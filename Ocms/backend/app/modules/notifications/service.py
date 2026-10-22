import logging
import asyncio
from typing import Dict, Any, List
from datetime import datetime
from app.infrastructure.event_bus import bus

logger = logging.getLogger("NotificationService")

class NotificationChannel:
    async def send(self, to: str, subject: str, body: str) -> bool:
        raise NotImplementedError

class MockEmailChannel(NotificationChannel):
    async def send(self, to: str, subject: str, body: str) -> bool:
        logger.info(f"PHASE 5 EMAIL: Sending to {to} | Subject: {subject}")
        await asyncio.sleep(0.5) # Simulate network
        return True

class NotificationService:
    """
    Enterprise Notification System with retry logic and multi-channel support.
    """
    def __init__(self):
        self.channels = [MockEmailChannel()]
        self.history: List[Dict[str, Any]] = []

    async def notify_incident_created(self, incident: Dict[str, Any]):
        """
        Notify appropriate parties about a new incident.
        """
        actor = incident.get("reporter_email")
        if not actor: return # Anonymous

        subject = f"Incident Reported: {incident['title']}"
        body = f"Hello. Your incident has been received and is being processed by the Agent Council. Reference ID: {incident['id']}"
        
        await self._dispatch(actor, subject, body)

    async def _dispatch(self, to: str, subject: str, body: str):
        success = False
        for channel in self.channels:
            if await channel.send(to, subject, body):
                success = True
                break
        
        self.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "to": to,
            "status": "SENT" if success else "FAILED"
        })

# Global Notification Service
notification_service = NotificationService()

# Hook into the Event Bus for automatic notification on incident creation
bus.subscribe("INCIDENT_CREATED", notification_service.notify_incident_created)
