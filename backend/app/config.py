import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings loaded from environment variables."""
    
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL")
    
    # CORS settings
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
