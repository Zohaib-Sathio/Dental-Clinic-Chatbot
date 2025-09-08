from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    booking_signal: Optional[Dict[str, Any]] = None
    conversation_state: Optional[Dict[str, Any]] = None
