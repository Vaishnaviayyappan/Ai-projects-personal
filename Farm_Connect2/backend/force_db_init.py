import asyncio
from app.db.init_data import init_db
from app.db.session import engine
from app.db.base_class import Base

async def run():
    print("Re-initializing database...")
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Be careful
        await conn.run_sync(Base.metadata.create_all)
    await init_db()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(run())
