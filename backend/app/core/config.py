from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from typing import Optional
import json

class Settings(BaseSettings):
    # Environment configuration
    environment: str = "development"  # development lub production
    
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
    frontend_url: str = "http://localhost:5173"  # URL frontendu (domyślnie dla developmentu)
    stripe_secret_key: str
    stripe_webhook_secret: str
    supported_currencies: str
    success_payment_url: str
    fail_payment_url: str
    supported_payment_methods: str
    
    # SSH Tunnel configuration (only for production)
    ssh_tunnel_host: Optional[str] = None
    ssh_tunnel_port: Optional[int] = 22
    ssh_tunnel_username: Optional[str] = None
    ssh_tunnel_password: Optional[str] = None
    
    # Database configuration (only for production)
    db_host: Optional[str] = None
    db_port: Optional[int] = 5432
    db_name: Optional[str] = None
    db_username: Optional[str] = None
    db_password: Optional[str] = None

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"  # Ignoruj dodatkowe pola z .env (np. stare zmienne TPay)
    )


settings = Settings()
