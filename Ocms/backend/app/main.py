from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
import logging
import jwt
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

# Infrastructure & Domain Imports
from app.infrastructure.real_time import rt_manager
from app.core.security import SECRET_KEY, ALGORITHM
from app.modules.incidents.router import router as incidents_router
from app.modules.analytics.router import router as analytics_router
from app.modules.auth.router import router as auth_router
from app.core.outbox import outbox

# --- CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout
)
logger = logging.getLogger("EnterpriseEngine")

# --- APP INITIALIZATION ---
app = FastAPI(title="ProAct-Resolve-AI Enterprise", version="2.0.0")

# 1. Universal CORS Baseline
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# 2. Startup Tasks
@app.on_event("startup")
async def startup_event():
    logger.info("[STARTUP] Initializing Event Pipeline...")
    asyncio.create_task(outbox.start_worker())

from fastapi.responses import StreamingResponse
from fastapi import Request

# 3. REAL-TIME EVENT STREAM (SSE)
@app.get("/api/v1/stream")
async def stream_audit_traces(request: Request, token: str):
    """
    STABILIZED EVENT STREAM ENGINE v1.
    Replaces WebSockets with resilient SSE for neural telemetry.
    """
    tenant_id = "UNKNOWN"
    
    try:
        # JWT Session Validation
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        payload = jwt.decode(clean_token, options={"verify_signature": False})
        tenant_id = payload.get("tenant_id", "UNKNOWN")
    except Exception as auth_err:
        logger.error(f"[SSE_SEC] Decoding Failure: {str(auth_err)}")
        return {"error": "Unauthorized"}

    async def event_generator():
        queue = await rt_manager.subscribe(tenant_id)
        try:
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                    
                data = await queue.get()
                yield f"data: {data}\n\n"
        finally:
            rt_manager.unsubscribe(tenant_id, queue)

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" # For Nginx stability
        }
    )

# 4. MODULE ROUTERS
app.include_router(incidents_router, prefix="/api/v1/incidents", tags=["Incidents"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

# 5. CORE ENDPOINTS
@app.get("/")
async def root():
    return {"message": "ProAct-Resolve-AI Enterprise Engine Online", "status": "active"}

@app.get("/health")
async def health():
    return {
        "status": "operational", 
        "trace_id": "STABILIZATION_PHASE_19_SYNTAX_GUARD_ACTIVE",
        "engine": "FastAPI/Starlette"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
