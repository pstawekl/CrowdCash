import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText

from app.core.config import settings
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema


# Konfiguracja maila
class EmailConfig:
    MAIL_USERNAME = settings.mail_username
    MAIL_PASSWORD = settings.mail_password
    MAIL_FROM = settings.mail_from
    MAIL_SERVER = settings.mail_server
    MAIL_PORT = settings.mail_port
    MAIL_SSL_TLS = True
    MAIL_STARTTLS = False  # Używaj STARTTLS, jeśli wymagane


conf = ConnectionConfig(
    MAIL_USERNAME=EmailConfig.MAIL_USERNAME,
    MAIL_PASSWORD=EmailConfig.MAIL_PASSWORD,
    MAIL_FROM=EmailConfig.MAIL_FROM,
    MAIL_SERVER=EmailConfig.MAIL_SERVER,
    MAIL_PORT=EmailConfig.MAIL_PORT,
    MAIL_SSL_TLS=EmailConfig.MAIL_SSL_TLS,
    MAIL_STARTTLS=EmailConfig.MAIL_STARTTLS,
)

fm = FastMail(conf)


# Konfiguracja SMTP dla Mailtrap


def send_email(subject: str, body: str, to_email: str):
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = conf.MAIL_USERNAME
        msg["To"] = to_email

        if conf.MAIL_STARTTLS:
            server = smtplib.SMTP(conf.MAIL_SERVER, conf.MAIL_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(conf.MAIL_SERVER, conf.MAIL_PORT)

        server.login(conf.MAIL_USERNAME, conf.MAIL_PASSWORD.get_secret_value())
        server.sendmail(conf.MAIL_USERNAME, [to_email], msg.as_string())
        server.quit()

        return {"status": "OK", "message": "Mail wysłany"}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

    # sender_email = settings.mail_from
    # smtp_port = 587

    # smtp_server = settings.mail_server
    # receiver_email = to_email
    # # Wiadomość e-mail
    # message = f"""\
    # Subject: {subject}
    # To: {receiver_email}
    # From: {sender_email}

    # {body}."""

    # # Połączenie z serwerem SMTP i wysyłka
    # with smtplib.SMTP(smtp_server, smtp_port) as server:
    #     server.starttls()  # Użycie TLS do zabezpieczenia połączenia
    #     # Zalogowanie się do Mailtrap
    #     server.login(settings.mail_username, settings.mail_password)
    #     server.sendmail(sender_email, receiver_email,
    #                     message)  # Wysłanie e-maila
