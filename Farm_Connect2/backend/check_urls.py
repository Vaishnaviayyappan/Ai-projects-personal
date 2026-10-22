import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.features import Tutorial
import sys
import os

async def check_tutorials():
    sys.path.append(os.getcwd())
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    async with AsyncSessionLocal() as db:
        print("--- Current Tutorial URLs in DB ---")
        result = await db.execute(select(Tutorial))
        tutorials = result.scalars().all()
        for t in tutorials:
            print(f"[{t.title}] -> {t.video_url}")

if __name__ == "__main__":
    import os
    sys.path.append(os.getcwd())
    asyncio.run(check_tutorials())
