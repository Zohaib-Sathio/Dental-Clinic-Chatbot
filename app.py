from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging, sys, os, json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, date

import re

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
    booking_signal: Optional[Dict[str, Any]] = None
    conversation_state: Optional[Dict[str, Any]] = None

today = date.today()
print(today)

SYSTEM_PROMPT = f"""
You are Sarah, a friendly and professional customer service representative for BrightSmile Dental Clinic. You have years of experience helping patients with their dental care needs.

CLINIC INFORMATION:
- Clinic Name: BrightSmile Dental Clinic
- Services: Dental check-ups, Professional cleanings, Basic dental procedures
- Pricing: $50 consultation, $100 cleaning, other procedures vary
- Hours: Monday-Friday 9am-6pm, Saturday 10am-2pm, Sunday Closed

YOUR PERSONALITY:
- Warm, empathetic, and patient
- Professional but approachable
- Good listener who remembers details from the conversation
- Proactive in helping solve patient needs

CONVERSATION GUIDELINES:
1. Always greet new patients warmly and introduce yourself
2. Listen carefully to understand what the patient needs
3. For appointment bookings, gather information naturally through conversation:
   - Patient's name and contact information (phone/email)
   - Preferred service (check-up, cleaning, etc.)
   - Preferred date and time. Today is {today}
   - Any specific concerns or requirements
   - Confirm all details before finalizing

4. Keep track of information shared during the conversation
5. When you have all required booking information AND the patient confirms they want to proceed, include this EXACT phrase in your response: "BOOKING_CONFIRMED" followed by the appointment details in JSON format.

6. Be conversational - ask follow-up questions, show empathy for dental concerns, and make small talk when appropriate
7. If asked about something outside your scope, politely explain you'll connect them with the appropriate staff member

BOOKING REQUIREMENTS:
- Patient name
- Contact information (phone or email)
- Service type
- Preferred date
- Preferred time
- Final confirmation from patient

Remember: You're having a natural conversation, not filling out a form. Make the patient feel comfortable and heard.
"""

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    html_path = Path("public/index.html")
    if not html_path.exists():
        return HTMLResponse("<h1>BrightSmile Dental Chatbot</h1><p>UI not found.</p>")
    return html_path.read_text(encoding="utf-8")

def get_conversation_state(user_id: str) -> Dict[str, Any]:
    """Retrieve or initialize conversation state for a user."""
    try:
        state_response = supabase.table("conversation_state").select("*").eq("user_id", user_id).execute()
        if state_response.data:
            return json.loads(state_response.data[0]["state_data"])
        else:
            # Initialize new conversation state
            initial_state = {
                "patient_info": {
                    "name": None,
                    "phone": None,
                    "email": None
                },
                "appointment_info": {
                    "service": None,
                    "date": None,
                    "time": None,
                    "concerns": None
                },
                "conversation_stage": "greeting",
                "confirmed_booking": False
            }
            return initial_state
    except Exception as e:
        logger.error(f"Error retrieving conversation state: {e}")
        return {
            "patient_info": {"name": None, "phone": None, "email": None},
            "appointment_info": {"service": None, "date": None, "time": None, "concerns": None},
            "conversation_stage": "greeting",
            "confirmed_booking": False
        }

def update_conversation_state(user_id: str, state: Dict[str, Any]):
    """Update conversation state in database."""
    try:
        existing = supabase.table("conversation_state").select("*").eq("user_id", user_id).execute()
        if existing.data:
            supabase.table("conversation_state").update({
                "state_data": json.dumps(state),
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).execute()
        else:
            supabase.table("conversation_state").insert({
                "user_id": user_id,
                "state_data": json.dumps(state),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()
    except Exception as e:
        logger.error(f"Error updating conversation state: {e}")

def extract_booking_info(response_text: str, current_state: Dict[str, Any]) -> tuple[Dict[str, Any], Dict[str, Any]]:
    """Extract booking information and return updated state plus booking signal if ready."""
    
    # Create a prompt to extract information from the conversation
    extraction_prompt = f"""
    Analyze this customer service response and extract any new patient or appointment information mentioned.
    
    Current state: {json.dumps(current_state, indent=2)}
    
    Response text: "{response_text}"

    and today's date is: {today}
    
    Extract any NEW information mentioned about:
    - Patient name, phone, email
    - Service type (check-up, cleaning, etc.)
    - Date preference
    - Time preference  
    - Any concerns or special requests
    
    Return a JSON object with only the NEW information found:
    {{
        "patient_info": {{"name": "...", "phone": "...", "email": "..."}},
        "appointment_info": {{"service": "...", "date": "...", "time": "...", "concerns": "..."}}
    }}
    
    If no new information is found, return empty objects. Use null for missing values.
    """
    
    try:
        extraction_response = gemini_model.invoke([HumanMessage(content=extraction_prompt)])
        print("Extract details: ", extraction_response.content)
        # response.content will likely include ```json ... ```
        raw_content = extraction_response.content

        # Strip markdown code fences if present
        cleaned = re.sub(r"^```json|```$", "", raw_content.strip(), flags=re.MULTILINE).strip()

        # Now load as JSON
        extracted_data = json.loads(cleaned)
        
        # # Update state with extracted information
        updated_state = current_state.copy()
        
        for key, value in extracted_data.get("patient_info", {}).items():
            if value and value.lower() != "null":
                updated_state["patient_info"][key] = value
                
        for key, value in extracted_data.get("appointment_info", {}).items():
            if value and value.lower() != "null":
                updated_state["appointment_info"][key] = value
        
        # Check if we have all required info and booking is confirmed
        required_fields = ["name", "service", "date", "time"]
        contact_provided = updated_state["patient_info"]["phone"] or updated_state["patient_info"]["email"]
        
        all_required = all([
            updated_state["patient_info"]["name"],
            updated_state["appointment_info"]["service"],
            updated_state["appointment_info"]["date"],
            updated_state["appointment_info"]["time"],
            contact_provided
        ])
        
        booking_signal = None
        if all_required and "BOOKING_CONFIRMED" in response_text:
            booking_signal = {
                "action": "book_appointment",
                "patient_name": updated_state["patient_info"]["name"],
                "contact_phone": updated_state["patient_info"]["phone"],
                "contact_email": updated_state["patient_info"]["email"],
                "service": updated_state["appointment_info"]["service"],
                "date": updated_state["appointment_info"]["date"],
                "time": updated_state["appointment_info"]["time"],
                "concerns": updated_state["appointment_info"]["concerns"]
            }
            updated_state["confirmed_booking"] = True
        
        print(f"Updated state: {updated_state}")
        print(f"Booking signal: {booking_signal}")
            
        return updated_state, booking_signal
        
    except Exception as e:
        logger.error(f"Error extracting booking info: {e}")
        return current_state, None

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get current conversation state
        conversation_state = get_conversation_state(request.user_id)
        
        # Save user message
        supabase.table("conversations").insert({
            "user_id": request.user_id,
            "role": "user",
            "text": request.message
        }).execute()

        # Get conversation history
        messages_response = supabase.table("conversations").select("*").eq("user_id", request.user_id).order("created_at", desc=False).execute()
        history = messages_response.data if messages_response.data else []
        
        # Build context-aware system prompt
        context_prompt = f"""
{SYSTEM_PROMPT}

CURRENT CONVERSATION CONTEXT:
Patient Information Collected:
- Name: {conversation_state['patient_info']['name'] or 'Not provided'}
- Phone: {conversation_state['patient_info']['phone'] or 'Not provided'}  
- Email: {conversation_state['patient_info']['email'] or 'Not provided'}

Appointment Information Collected:
- Service: {conversation_state['appointment_info']['service'] or 'Not specified'}
- Date: {conversation_state['appointment_info']['date'] or 'Not specified'}
- Time: {conversation_state['appointment_info']['time'] or 'Not specified'}
- Concerns: {conversation_state['appointment_info']['concerns'] or 'None mentioned'}

Conversation Stage: {conversation_state['conversation_stage']}
Booking Confirmed: {conversation_state['confirmed_booking']}

Use this context to provide personalized, continuous service. Remember details from previous messages and build upon them naturally.
"""

        # Prepare messages for LLM
        messages = [SystemMessage(content=context_prompt)]
        
        # Add conversation history (keep recent history to avoid token limits)
        recent_history = history[-10:] if len(history) > 10 else history
        for msg in recent_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["text"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["text"]))
        
        # Add current user message
        messages.append(HumanMessage(content=request.message))
        
        # Get AI response
        response = gemini_model.invoke(messages)
        reply_text = response.content
        
        # Extract and update booking information
        updated_state, booking_signal = extract_booking_info(reply_text, conversation_state)

        if "BOOKING_CONFIRMED" in reply_text:
            print(reply_text)
            splitted = reply_text.split("BOOKING_CONFIRMED")
            initial_response = splitted[0]
            temp = splitted[1]
            print(initial_response)
            second_repsonse = temp.split("```")[-1]
            print(second_repsonse)
            reply_text = initial_response.strip() + "\n" + second_repsonse.strip()
        
        # Update conversation state
        update_conversation_state(request.user_id, updated_state)
        
        # If booking is confirmed, save to appointments table
        if booking_signal:
            print("Appointment signal confirmed...")
            try:
                supabase.table("appointments").insert({
                    "user_id": request.user_id,
                    "patient_name": booking_signal["patient_name"],
                    "contact_phone": booking_signal["contact_phone"],
                    "contact_email": booking_signal["contact_email"],
                    "service": booking_signal["service"],
                    "date": booking_signal["date"],
                    "time": booking_signal["time"],
                    "concerns": booking_signal["concerns"],
                    "status": "confirmed",
                    "created_at": datetime.now().isoformat()
                }).execute()
                logger.info(f"Appointment booked for user {request.user_id}")
            except Exception as db_error:
                logger.error(f"Failed to save appointment: {db_error}")
        
        # Save assistant response
        supabase.table("conversations").insert({
            "user_id": request.user_id,
            "role": "assistant",
            "text": reply_text
        }).execute()

        return ChatResponse(
            reply=reply_text,
            booking_signal=booking_signal,
            conversation_state=updated_state
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chatbot service unavailable. Please try again.")

@app.post("/reset-conversation")
async def reset_conversation(user_id: str):
    """Reset conversation state for a user."""
    try:
        supabase.table("conversation_state").delete().eq("user_id", user_id).execute()
        return {"message": "Conversation reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset conversation")

@app.get("/conversation-state/{user_id}")
async def get_user_conversation_state(user_id: str):
    """Get current conversation state for a user."""
    try:
        state = get_conversation_state(user_id)
        return {"user_id": user_id, "state": state}
    except Exception as e:
        logger.error(f"Error getting conversation state: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conversation state")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)