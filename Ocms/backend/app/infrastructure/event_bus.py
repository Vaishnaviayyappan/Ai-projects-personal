import asyncio
import json
import logging
from typing import Callable, Dict, List

logger = logging.getLogger("EventBus")

class EventBus:
    """
    A lightweight, internal PubSub system to simulate Redis-based microservices communication.
    Ensures that the Agent Engine can react to Incident and Auth events asynchronously.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        logger.info(f"Subscribed callback to {event_type}")

    async def emit(self, event_type: str, data: dict):
        logger.info(f"Emitting {event_type}...") # Avoid json.dumps on raw objects (datetime, etc)
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                asyncio.create_task(callback(data))

# Singleton instance for the modular monolith
bus = EventBus()
