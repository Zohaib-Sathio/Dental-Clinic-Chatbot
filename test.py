reply_text = """
Alright Zohaib, your appointment is booked! BOOKING_CONFIRMED ```json { "patient_name": "Zohaib", "phone_number": "+923423551111", "service": "regular check-up", "date": "next Thursday", "time": "2:00 PM" } ``` We look forward to seeing you then! Is there anything else I can help you with today?
"""

text = reply_text.split("BOOKING_CONFIRMED")[1].split("} ```")[1].strip()

print(text)