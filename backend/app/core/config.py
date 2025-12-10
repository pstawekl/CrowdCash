from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
import json

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    mail_username: str
    mail_password: str
    mail_from: str
    mail_server: str
    mail_port: int
    mail_use_tls: bool
    app_name: str
    stripe_secret_key: str
    stripe_webhook_secret: str
    supported_currencies: str
    success_payment_url: str
    fail_payment_url: str
    supported_payment_methods: str

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"  # Ignoruj dodatkowe pola z .env (np. stare zmienne TPay)
    )


settings = Settings()
