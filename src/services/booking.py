import re, json
from datetime import date
from langchain.schema import HumanMessage
from src.utils.llm import gemini_model
from src.utils.config import logger

from typing import Optional, Dict, Any

today = date.today()

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