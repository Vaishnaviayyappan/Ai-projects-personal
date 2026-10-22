import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.db.base_class import Base
from app.models.features import Expert

async def nuke_experts():
    async with engine.begin() as conn:
        print("Dropping experts table...")
        await conn.execute(text("DROP TABLE IF EXISTS experts CASCADE"))
        print("Recreating tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    from app.db.init_data import init_db
    print("Seeding...")
    await init_db()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(nuke_experts())
