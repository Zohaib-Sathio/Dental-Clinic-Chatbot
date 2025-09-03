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

from langchain.prompts import ChatPromptTemplate

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

INTENT_PROMPT = """
Classify the user message into one of three categories:
- faq: The user is asking about services, pricing, or hours.
- appointment: The user wants to book an appointment (date, time, service, contact).
- other: Anything outside clinic scope.
Reply ONLY with: faq, appointment, or other.
"""


BOOKING_PROMPT = """
You are a dental clinic assistant helping to book an appointment.

Required details:
- Service (check-up or cleaning)
- Date
- Time
- Contact (email or phone)

Known so far: {known_fields}

User message: {user_message}

Instructions:
1. If the message contains any missing details, extract them.
2. Always respond with:
---
reply: (your message to the user)
data: (a JSON object with any new info, keys: service, date, time, contact)
---
"""

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Save user message
        supabase.table("conversations").insert({
            "user_id": request.user_id,
            "role": "user",
            "text": request.message
        }).execute()

        # Detect intent
        intent_response = gemini_model.invoke([
            SystemMessage(content=INTENT_PROMPT),
            HumanMessage(content=request.message)
        ])
        intent = intent_response.content.strip().lower()

        if intent == "appointment":
            # Define the required fields
            required_fields = ["service", "date", "time", "contact"]

            # Ask Gemini to extract/slot-fill all appointment details in one shot
            booking_prompt = f"""
            You are a healthcare clinic assistant. 
            Extract appointment details from the user's message.
            Required fields: {required_fields}.
            Reply in the following format:

            reply: <natural language reply to the user>
            data: {{"service": ..., "date": ..., "time": ..., "contact": ...}}

            If some details are missing, set them as null in the JSON.
            User message: "{request.message}"
            """

            response = gemini_model.invoke([HumanMessage(content=booking_prompt)])
            reply_text = response.content
            print("Reply text: ", reply_text)

            # Try to parse structured data
            if "data:" in reply_text:
                parts = reply_text.split("data:")
                reply_part = parts[0].replace("reply:", "").strip()
                data_part = parts[1].strip()

                import json
                try:
                    data = json.loads(data_part)

                    # Check if all required fields are filled
                    missing = [f for f in required_fields if not data.get(f)]

                    if not missing:
                        # Insert confirmed appointment into Supabase
                        supabase.table("appointments").insert({
                            "user_id": request.user_id,
                            "service": data["service"],
                            "date": data["date"],
                            "time": data["time"],
                            "contact": data["contact"],
                            "status": "confirmed"
                        }).execute()
                        reply_text = reply_part + "\n✅ Your appointment is confirmed!"
                    else:
                        # Ask for missing fields in one go
                        missing_str = ", ".join(missing)
                        reply_text = (
                            reply_part +
                            f"\nI still need the following details to confirm your appointment: {missing_str}."
                        )

                except Exception as parse_err:
                    logger.error(f"JSON parse error: {parse_err}")
                    # Fallback to original text if parsing fails
                    reply_text = reply_text

            return {"reply": reply_text}


        else:
            # FAQ flow (same as before)
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

        # Save assistant response
        supabase.table("conversations").insert({
            "user_id": request.user_id,
            "role": "assistant",
            "text": reply_text
        }).execute()

        return ChatResponse(reply=reply_text)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chatbot failed")
