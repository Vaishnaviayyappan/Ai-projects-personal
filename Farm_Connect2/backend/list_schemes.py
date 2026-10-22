import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import AsyncSessionLocal
from app.models.features import Scheme
from sqlalchemy import select

# Fix for Windows Event Loop Policy
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def list_schemes():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Scheme))
        schemes = result.scalars().all()
        print(f"Total Schemes Found: {len(schemes)}")
        for s in schemes:
            print(f" - {s.title} ({s.link})")

if __name__ == "__main__":
    asyncio.run(list_schemes())
