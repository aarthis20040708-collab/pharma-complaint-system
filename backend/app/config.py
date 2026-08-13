import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pharma_qms.db")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    # Updated Groq active models (llama-3.3-70b-versatile and llama-3.1-8b-instant)
    PRIMARY_MODEL: str = "llama-3.3-70b-versatile"
    FAST_MODEL: str = "llama-3.1-8b-instant"
    REASONING_MODEL: str = "llama-3.3-70b-versatile"

settings = Settings()
