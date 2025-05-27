from pydantic_settings import BaseSettings


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
    tpay_merchant_id: str
    tpay_api_key: str
    tpay_api_password: str
    tpay_api_url: str

    class Config:
        env_file = ".env"


settings = Settings()
