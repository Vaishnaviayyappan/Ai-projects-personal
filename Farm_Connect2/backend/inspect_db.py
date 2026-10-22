import asyncio
from sqlalchemy import text
from app.db.session import engine

async def run():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = result.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")
        
        for table in [t[0] for t in tables]:
            count = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            print(f"{table}: {count.scalar()}")

if __name__ == "__main__":
    asyncio.run(run())
