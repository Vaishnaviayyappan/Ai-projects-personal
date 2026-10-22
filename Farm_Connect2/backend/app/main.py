from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from fastapi.staticfiles import StaticFiles
import os

from app.db.init_data import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    # await init_db()
    pass

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev/hackathon, allow all. In prod, strict list.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Create uploads directory if it doesnt exist
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Serve static files from uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Welcome to Farm Connect API. Local & Open Source."}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "platform": "Farm Connect"}

@app.get("/init-db")
async def force_init():
    try:
        await init_db()
        return {"message": "Database initialized successfully"}
    except Exception as e:
        return {"error": str(e)}
