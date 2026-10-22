import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.features import Expert

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Expert))
        experts = result.scalars().all()
        print(f"Experts count: {len(experts)}")
        for e in experts:
            print(f"- {e.name}")

if __name__ == "__main__":
    asyncio.run(check())
