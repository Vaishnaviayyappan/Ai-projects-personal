import logging
import asyncio
from app.db.session import SessionLocal, engine
from app.db.base import Base  # Now includes all models
from app.models.features import MarketItem, Scheme

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    # 1. Create Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed Data
    db = SessionLocal()
    try:
        # Check if data exists
        if db.query(MarketItem).first():
            logger.info("Data already exists. Skipping seed.")
            return

        logger.info("Seeding Market Items...")
        market_items = [
            MarketItem(name="Organic Wheat", price="₹2,200/qt", buyer="Fresh Mills Pvt", distance="5 km", tags="Organic,High Quality"),
            MarketItem(name="Basmati Rice", price="₹4,500/qt", buyer="Global Exports", distance="12 km", tags="Premium,Export"),
            MarketItem(name="Red Tomatoes", price="₹15/kg", buyer="Local Mandi", distance="2 km", tags="Fresh,Urgent"),
            MarketItem(name="Cotton Bales", price="₹6,000/qt", buyer="Textile Corp", distance="25 km", tags="Raw,Bulk"),
            MarketItem(name="Sugarcane", price="₹320/qt", buyer="Sugar Factory", distance="8 km", tags="Sweet,Bulk"),
        ]
        db.add_all(market_items)

        logger.info("Seeding Schemes...")
        schemes = [
            Scheme(title="PM-Kisan Samman Nidhi", benefit="₹6,000/year", type="Grant"),
            Scheme(title="Kisan Credit Card", benefit="Low Interest Loan", type="Credit"),
            Scheme(title="Fasal Bima Yojana", benefit="Crop Insurance", type="Insurance"),
            Scheme(title="Solar Pump Scheme", benefit="60% Subsidy", type="Subsidy"),
        ]
        db.add_all(schemes)

        db.commit()
        logger.info("Database initialized with seed data!")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(init_db())
