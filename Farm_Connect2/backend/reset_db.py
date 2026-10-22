
import asyncio
import os
import sys
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.session import engine
from app.db.base_class import Base
from app.models.user import User, FarmerProfile
from app.models.features import MarketItem, Scheme, Tutorial, Expert

async def reset_db():
    print("Resetting database with CASCADE...")
    try:
        async with engine.begin() as conn:
            # For Postgres, we can drop the schema and recreate it
            await conn.execute(text("DROP SCHEMA public CASCADE;"))
            await conn.execute(text("CREATE SCHEMA public;"))
            await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            print("Dropped and recreated public schema.")
            await conn.run_sync(Base.metadata.create_all)
            print("Created all tables.")
        print("Database reset successfully.")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(reset_db())
