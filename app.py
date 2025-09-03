from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
import logging, sys, os
from pathlib import Path
from dotenv import load_dotenv

from supabase import create_client
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

load_dotenv(override=True)

app = FastAPI(title="Clinic Chatbot API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

gemini_model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str

SYSTEM_PROMPT = """
You are a friendly, professional assistant for BrightSmile Dental Clinic. 
Your responsibilities:
- Answer FAQs clearly (clinic name, services, pricing, opening hours).
- Services: Dental check-up
- Opening hours: Mon–Fri: 9am–6pm, Sat: 10am–2pm, Sun: Closed
- Pricing: $50 consultation, $100 cleaning
- Appointment booking: simulate a booking flow (just ask for a preferred time, no backend integration yet).
- If a question falls outside your scope, politely say you will pass it on to clinic staff.
- Always keep tone warm, concise, and patient-friendly.
- Do not hallicunate any information that you don't have access to, only answer from the information context that you are provided.
"""

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    html_path = Path("public/index.html")
    if not html_path.exists():
        return HTMLResponse("<h1>BrightSmile Dental Chatbot</h1><p>UI not found.</p>")
    return html_path.read_text(encoding="utf-8")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Save user message
        supabase.table("conversations").insert({
            "user_id": request.user_id,
            "role": "user",
            "text": request.message
        }).execute()

        # Fetch all conversation history for user
        messages_response = supabase.table("conversations").select("*").eq("user_id", request.user_id).order("created_at", desc=False).execute()
        history = messages_response.data if messages_response.data else []

        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["text"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["text"]))

        messages.append(HumanMessage(content=request.message))

        response = gemini_model.invoke(messages)
        reply_text = response.content

        supabase.table("conversations").insert({
            "user_id": request.user_id,
            "role": "assistant",
            "text": reply_text
        }).execute()

        return ChatResponse(reply=reply_text)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chatbot failed")
