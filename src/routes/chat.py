from fastapi import APIRouter, HTTPException
from src.models.chat import ChatRequest, ChatResponse
from src.services.conversation import get_conversation_state, update_conversation_state
from src.services.booking import extract_booking_info
from src.utils.llm import gemini_model
from src.utils.prompts import SYSTEM_PROMPT
from src.utils.supabase import supabase
from datetime import datetime
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from src.utils.config import logger

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
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

@router.post("/reset-conversation")
async def reset_conversation(user_id: str):
    supabase.table("conversation_state").delete().eq("user_id", user_id).execute()
    return {"message": "Conversation reset successfully"}

@router.get("/conversation-state/{user_id}")
async def get_user_conversation_state(user_id: str):
    state = get_conversation_state(user_id)
    return {"user_id": user_id, "state": state}
