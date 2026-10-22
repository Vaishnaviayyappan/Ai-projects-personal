import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.features import Tutorial

async def update_tutorials():
    async with AsyncSessionLocal() as db:
        print("Updating Tutorial URLs...")
        
        # Define updates: {title: new_video_url}
        updates = {
            "Modern Drip Irrigation Systems": "https://www.youtube.com/results?search_query=modern+drip+irrigation+systems+india",
            "Organic Pest Control Methods": "https://www.youtube.com/results?search_query=organic+pest+control+methods+farming",
            "Maximizing Wheat Yield 2024": "https://www.youtube.com/results?search_query=maximizing+wheat+yield+india+technique",
            "Soil Health & Fertilizer Basics": "https://www.youtube.com/results?search_query=soil+health+and+fertilizers+for+farmers",
            "Kisan Credit Card Application Guide": "https://www.youtube.com/results?search_query=kisan+credit+card+application+process+hindi"
        }

        result = await db.execute(select(Tutorial))
        tutorials = result.scalars().all()

        for tutorial in tutorials:
            if tutorial.title in updates:
                print(f"Updating '{tutorial.title}' -> {updates[tutorial.title]}")
                tutorial.video_url = updates[tutorial.title]
        
        await db.commit()
        print("Update Complete.")

if __name__ == "__main__":
    import sys
    import os
    # Add project root to path
    sys.path.append(os.getcwd())
    
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    asyncio.run(update_tutorials())
