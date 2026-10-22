import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List
from app.infrastructure.event_bus import bus

logger = logging.getLogger("OutboxWorker")

class OutboxEntry:
    def __init__(self, event_type: str, payload: Dict[str, Any]):
        self.id = str(uuid.uuid4())
        self.event_type = event_type
        self.payload = payload
        self.created_at = datetime.utcnow()
        self.processed = False

class OutboxSystem:
    """
    Transactional Outbox Pattern.
    Ensures that events are eventually delivered even if the immediate broadcast fails.
    """
    def __init__(self):
        self._entries: List[OutboxEntry] = []
        self._running = True

    def add_event(self, event_type: str, payload: Dict[str, Any]):
        entry = OutboxEntry(event_type, payload)
        self._entries.append(entry)
        return entry.id

    async def start_worker(self):
        logger.info("Reliable Outbox Worker started.")
        while self._running:
            # Process pending entries
            pending = [e for e in self._entries if not e.processed]
            for entry in pending:
                try:
                    await bus.emit(entry.event_type, entry.payload)
                    entry.processed = True
                    logger.debug(f"Outbox event {entry.id} processed successfully.")
                except Exception as e:
                    logger.error(f"Outbox Processing Error on {entry.id}: {str(e)}")
            
            await asyncio.sleep(5) # Period check

    def stop(self):
        self._running = False

# Global Singleton Outbox
outbox = OutboxSystem()
