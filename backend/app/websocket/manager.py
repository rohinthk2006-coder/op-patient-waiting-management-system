import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("app.websocket")


class ConnectionManager:
    def __init__(self):
        # Maps session_id (or "all") to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str = "general"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info(f"WebSocket client connected on channel: {channel}. Total: {len(self.active_connections[channel])}")

    def disconnect(self, websocket: WebSocket, channel: str = "general"):
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)
            logger.info(f"WebSocket client disconnected from channel: {channel}")

    async def broadcast(self, message: dict, channel: str = "general"):
        if channel in self.active_connections:
            disconnected = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as ex:
                    logger.warning(f"Error sending to WebSocket on {channel}: {ex}")
                    disconnected.append(connection)
            for dead in disconnected:
                self.disconnect(dead, channel)

    async def broadcast_all(self, message: dict):
        for channel in list(self.active_connections.keys()):
            await self.broadcast(message, channel)


ws_manager = ConnectionManager()
