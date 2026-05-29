from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./lpu_marketplace.db"
    JWT_SECRET: str = "lpu_marketplace_super_secret_key_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days in minutes
    
    # Mock OTP configurations
    MOCK_OTP_CODE: str = "123456"
    
    # SMS gateway credentials
    FAST2SMS_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
