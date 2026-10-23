import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import db_manager
from app.api.v1.router import api_router
from app.workers.expiry_worker import expiry_worker
from app.websocket.manager import ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting Hospital OP Live Tracker Backend...")
    await db_manager.connect()
    await expiry_worker.start()
    yield
    # Shutdown actions
    logger.info("Shutting down Hospital OP Live Tracker Backend...")
    await expiry_worker.stop()
    await db_manager.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev from Vite and mobile simulators
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 REST APIs
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": {
            "connected": db_manager.is_connected,
            "engine": "In-Memory Development Store" if db_manager.is_mock else "MongoDB Cluster",
        },
        "background_worker": {
            "active": expiry_worker.is_running,
            "scan_interval_seconds": settings.EXPIRY_WORKER_INTERVAL_SECONDS
        }
    }


# WebSocket endpoint for real-time live tracker
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket, channel="general")
    try:
        while True:
            # Keep connection alive with heartbeat / messages
            data = await websocket.receive_text()
            # Echo or handle incoming client ping
            await websocket.send_text(f'{{"type": "PONG", "received": {data}}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel="general")
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket, channel="general")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
