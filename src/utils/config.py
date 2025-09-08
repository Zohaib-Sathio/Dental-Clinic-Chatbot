import os, sys, logging
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger("clinic_chatbot")
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
