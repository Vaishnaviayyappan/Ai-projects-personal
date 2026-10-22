import smtplib
import os
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

logger = logging.getLogger("EmailService")

class EmailService:
    """
    Enterprise Email Dispatcher.
    Supports secure SMTP relay for resolution confirmations and investigator alerts.
    """
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_pass = os.getenv("SMTP_PASS", "")
        self.enabled = all([self.smtp_user, self.smtp_pass])

    async def send_email(self, recipient: str, subject: str, body: str, html: bool = False):
        if not self.enabled:
            logger.warning(f"Email system disabled. Would have sent: '{subject}' to {recipient}")
            print(f"--- EMAIL SIMULATION ---\nTo: {recipient}\nSubject: {subject}\nBody: {body}\n-------------------------")
            return

        def _dispatch():
            try:
                msg = MIMEMultipart()
                msg['From'] = self.smtp_user
                msg['To'] = recipient
                msg['Subject'] = f"[PROACT-RESOLVE] {subject}"

                content_type = "html" if html else "plain"
                msg.attach(MIMEText(body, content_type))

                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.set_debuglevel(0)
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
                server.quit()
                return True
            except Exception as e:
                logger.error(f"Failed to dispatch email to {recipient}: {str(e)}")
                return False

        # Execute blocking SMTP in thread pool to prevent event loop stall
        await asyncio.to_thread(_dispatch)

# Singleton Instance
email_service = EmailService()
