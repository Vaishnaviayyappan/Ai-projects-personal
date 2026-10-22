import logging
from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal, engine
from app.models.features import MarketItem, Scheme, Tutorial, CartItem, Order, ForumPost, ForumComment, AnalysisReport, Expert
from app.models.user import User

from app.models.user import User
from app.db.base_class import Base

logger = logging.getLogger(__name__)

async def init_db():
    # 1. Create Tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.error(f"Error creating tables: {e}")

    # 2. Seed Data
    async with AsyncSessionLocal() as db:
        try:
            # --- MARKET ITEMS ---
            result = await db.execute(select(MarketItem))
            existing = result.scalars().first()
            if not existing:
                logger.info("Seeding Market Items...")
                items = [
                    MarketItem(name="Sharbati Wheat", price="₹2,450/q", buyer="ITC Agribusiness", distance="12 km", tags="Premier,Organic"),
                    MarketItem(name="Basmati Rice 1121", price="₹3,800/q", buyer="Dawat Foods", distance="25 km", tags="Export Quality"),
                    MarketItem(name="Yellow Maize", price="₹1,950/q", buyer="Local Mandi Agent", distance="5 km", tags="Feed Grade"),
                    MarketItem(name="Desi Cotton", price="₹6,900/q", buyer="Cotton Corp of India", distance="40 km", tags="High Yield"),
                    MarketItem(name="Mustard Seeds", price="₹5,200/q", buyer="Patanjali Foods", distance="18 km", tags="Oil Rich"),
                    MarketItem(name="Potato (Jyoti)", price="₹800/q", buyer="Balaji Wafers", distance="55 km", tags="Processing")
                ]
                db.add_all(items)
                await db.commit()

            # --- SCHEMES ---
            result = await db.execute(select(Scheme))
            existing_schemes = result.scalars().first()
            if not existing_schemes:
                logger.info("Seeding Government Schemes...")
                schemes = [
                    Scheme(title="PM-Kisan Samman Nidhi", benefit="₹6,000 per year income support", type="Central", link="https://pmkisan.gov.in", application_process="Register on PM-Kisan portal with Aadhaar."),
                    Scheme(title="Kisan Credit Card (KCC)", benefit="Loans up to ₹1.6 Lakh collateral-free", type="Credit", link="https://fasalrin.gov.in/", application_process="Visit nearest bank branch with land documents."),
                    Scheme(title="Pradhan Mantri Fasal Bima Yojana", benefit="Comprehensive Crop Insurance", type="Insurance", link="https://pmfby.gov.in", application_process="Apply online at PMFBY portal or via CSC."),
                    Scheme(title="Soil Health Card Scheme", benefit="Soil nutrient status report & advice", type="State", link="https://soilhealth.dac.gov.in/", application_process="Collect soil sample and submit to local lab."),
                    Scheme(title="Paramparagat Krishi Vikas Yojana", benefit="₹50,000/hectare for Organic Farming", type="Subsidies", link="https://pgsindia-ncof.gov.in/", application_process="Form a cluster of farmers and apply via Regional Council."),
                ]

                db.add_all(schemes)
                await db.commit()

            # --- TUTORIALS ---
            result = await db.execute(select(Tutorial))
            existing_tutorials = result.scalars().first()
            if not existing_tutorials:
                logger.info("Seeding Tutorials...")
                tutorials = [
                    Tutorial(title="Modern Drip Irrigation Systems", duration="10:05", views="1.2k", category="Irrigation", image_url="https://images.unsplash.com/photo-1563514227142-7a2f4e4a643f", video_url="https://www.youtube.com/results?search_query=modern+drip+irrigation+systems+india", external_source_url="https://www.youtube.com/results?search_query=drip+irrigation"),
                    Tutorial(title="Organic Pest Control Methods", duration="08:30", views="3.5k", category="Pest Control", image_url="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18", video_url="https://www.youtube.com/results?search_query=organic+pest+control+methods+farming", external_source_url="https://www.youtube.com/results?search_query=organic+pest+control"),
                    Tutorial(title="Maximizing Wheat Yield 2024", duration="15:20", views="900", category="Crop Management", image_url="https://images.unsplash.com/photo-1574943320219-553eb213f72d", video_url="https://www.youtube.com/results?search_query=maximizing+wheat+yield+india+technique", external_source_url="https://www.youtube.com/results?search_query=wheat+yield"),
                    Tutorial(title="Soil Health & Fertilizer Basics", duration="12:45", views="2.1k", category="Soil Science", image_url="https://images.unsplash.com/photo-1625246333195-bf73842cff61", video_url="https://www.youtube.com/results?search_query=soil+health+and+fertilizers+for+farmers", external_source_url="https://www.youtube.com/results?search_query=soil+health"),
                    Tutorial(title="Kisan Credit Card Application Guide", duration="05:00", views="10k", category="Finance", image_url="https://plus.unsplash.com/premium_photo-1661962692059-55d5a4319814", video_url="https://www.youtube.com/results?search_query=kisan+credit+card+application+process+hindi", external_source_url="https://www.youtube.com/results?search_query=kisan+credit+card"),
                ]

                db.add_all(tutorials)
                await db.commit()
            
            # --- EXPERTS ---
            experts_data = [
                ("Dr. Rajesh Kumar", "Crop Pathologist", "PhD (IARI)", "15 Years", 4.9, "https://randomuser.me/api/portraits/men/32.jpg", True),
                ("Priya Sharma", "Soil Scientist", "MSc Agriculture", "8 Years", 4.8, "https://randomuser.me/api/portraits/women/44.jpg", True),
                ("Dr. Anil Gupta", "Veterinarian", "BVSc & AH", "12 Years", 4.9, "https://randomuser.me/api/portraits/men/64.jpg", False),
                ("Suresh Patel", "Organic Farming", "Certified Expert", "20 Years", 4.7, "https://randomuser.me/api/portraits/men/85.jpg", True)
            ]
            
            for name, spec, qual, exp, rat, img, online in experts_data:
                await db.execute(text(f"""
                    INSERT INTO experts (name, specialization, qualification, experience, rating, image_url, is_online)
                    VALUES (:name, :spec, :qual, :exp, :rat, :img, :online)
                    ON CONFLICT DO NOTHING
                """), {"name": name, "spec": spec, "qual": qual, "exp": exp, "rat": rat, "img": img, "online": online})
            
            # --- DEMO USER & PROFILE ---
            result = await db.execute(select(User).filter(User.email == "farmer@example.com"))
            existing_user = result.scalars().first()
            if not existing_user:
                logger.info("Seeding Demo Farmer...")
                from app.models.user import FarmerProfile
                demo_user = User(
                    full_name="Agri Farmer",
                    email="farmer@example.com",
                    hashed_password="fakehashedpassword", 
                    role="farmer"
                )
                db.add(demo_user)
                await db.flush() # Get ID
                
                profile = FarmerProfile(
                    user_id=demo_user.id,
                    location="Bhatinda, Punjab",
                    land_size="5 Acres",
                    primary_crops="Wheat, Rice",
                    soil_type="Alluvial",
                    irrigation_source="Tubewell"
                )
                db.add(profile)
                await db.commit()

            logger.info("Database Initialization Complete.")

        except Exception as e:
            logger.error(f"Error during DB initialization: {e}")
            raise e
