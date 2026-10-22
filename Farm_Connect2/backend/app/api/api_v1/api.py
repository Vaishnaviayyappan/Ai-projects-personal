from fastapi import APIRouter

api_router = APIRouter()

from app.api.api_v1.endpoints import auth, agent_routes, features

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(agent_routes.router, prefix="/agents", tags=["agents"])
api_router.include_router(features.router, prefix="/features", tags=["features"])
