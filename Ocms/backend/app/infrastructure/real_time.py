import logging
import json
import asyncio
from typing import Dict, List, Any, Set

logger = logging.getLogger("RealTimeManager")

class RealTimeManager:
    """
    PHASE 20: SSE-based Real-Time Sync Manager.
    Replaces WebSockets with unidirectional Server-Sent Events for maximum stability.
    """
    def __init__(self):
        # tenant_id -> Set of subscriber queues
        self.subscribers: Dict[str, Set[asyncio.Queue]] = {}

    async def subscribe(self, tenant_id: str) -> asyncio.Queue:
        """
        Registers a new SSE listener for a tenant.
        """
        queue = asyncio.Queue()
        if tenant_id not in self.subscribers:
            self.subscribers[tenant_id] = set()
        
        self.subscribers[tenant_id].add(queue)
        logger.info(f"[SSE_INTERNAL] Subscriber added for {tenant_id}. Active count: {len(self.subscribers[tenant_id])}")
        return queue

    def unsubscribe(self, tenant_id: str, queue: asyncio.Queue):
        """
        Removes an SSE listener.
        """
        if tenant_id in self.subscribers:
            self.subscribers[tenant_id].discard(queue)
            if not self.subscribers[tenant_id]:
                del self.subscribers[tenant_id]
            logger.info(f"[SSE_INTERNAL] Subscriber removed for {tenant_id}")

    async def broadcast_to_tenant(self, tenant_id: str, data: Dict[str, Any]):
        """
        Pushes data to all active SSE queues for a tenant.
        """
        if tenant_id not in self.subscribers:
            return

        message = json.dumps(data)
        for queue in self.subscribers[tenant_id]:
            await queue.put(message)

# Principal Instance
rt_manager = RealTimeManager()
