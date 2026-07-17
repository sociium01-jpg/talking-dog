import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Dog Body Language & Bark Intent App"
    
    # Supabase configurations
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://mock.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "mock_key")
    
    # Vertex AI / GCP configurations
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "mock-project-id")
    GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")
    VERTEX_POSE_ENDPOINT: str = os.getenv("VERTEX_POSE_ENDPOINT", "mock-pose-endpoint")
    VERTEX_AUDIO_ENDPOINT: str = os.getenv("VERTEX_AUDIO_ENDPOINT", "mock-audio-endpoint")
    
    # LLM Settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "mock-llm-key")

    # Razorpay configurations
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "mock-rzp-key")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock-rzp-secret")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "mock-rzp-webhook-secret")

    # Hugging Face configurations
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")

settings = Settings()
