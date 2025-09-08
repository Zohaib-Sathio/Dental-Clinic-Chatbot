import json
from datetime import datetime
from src.utils.supabase import supabase
from src.utils.config import logger

def get_conversation_state(user_id: str):
    try:
        resp = supabase.table("conversation_state").select("*").eq("user_id", user_id).execute()
        if resp.data:
            return json.loads(resp.data[0]["state_data"])
        return {
            "patient_info": {"name": None, "phone": None, "email": None},
            "appointment_info": {"service": None, "date": None, "time": None, "concerns": None},
            "conversation_stage": "greeting",
            "confirmed_booking": False
        }
    except Exception as e:
        logger.error(f"Error getting state: {e}")
        return {}

def update_conversation_state(user_id: str, state: dict):
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
        logger.error(f"Error updating state: {e}")
