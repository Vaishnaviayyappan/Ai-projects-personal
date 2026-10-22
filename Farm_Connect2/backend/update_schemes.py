import asyncio
import logging
import sys
import os

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import AsyncSessionLocal
from app.models.features import Scheme
from sqlalchemy import select, update

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fix for Windows Event Loop Policy
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def update_schemes():
    logger.info("Starting scheme link updates...")
    
    # Mapping of Scheme Title to Correct URL
    scheme_updates = {
        "Paramparagat Krishi Vikas Yojana": "https://pgsindia-ncof.gov.in/"
    }

    async with AsyncSessionLocal() as db:
        try:
            for title, new_link in scheme_updates.items():
                logger.info(f"Updating scheme: {title} -> {new_link}")
                
                # Check if scheme exists
                result = await db.execute(select(Scheme).where(Scheme.title == title))
                scheme = result.scalars().first()
                
                if scheme:
                    # Update the link
                    await db.execute(
                        update(Scheme)
                        .where(Scheme.title == title)
                        .values(link=new_link)
                    )
                    logger.info(f"Updated {title} successfully.")
                else:
                    logger.warning(f"Scheme '{title}' not found in database. Skipping.")

            await db.commit()
            logger.info("All scheme links updated successfully!")
            
        except Exception as e:
            logger.error(f"Error updating schemes: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(update_schemes())
