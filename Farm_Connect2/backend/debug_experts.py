import asyncio
from sqlalchemy import text
from app.db.session import engine

async def debug():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT * FROM experts"))
        rows = res.fetchall()
        print(f"Experts in DB: {len(rows)}")
        for r in rows:
            print(r)

if __name__ == "__main__":
    asyncio.run(debug())
