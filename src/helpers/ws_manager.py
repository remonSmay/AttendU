from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, session_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[session_id].add(websocket)

    def disconnect(self, session_id: UUID, websocket: WebSocket) -> None:
        session_connections = self.active_connections.get(session_id)
        if not session_connections:
            return

        session_connections.discard(websocket)
        if not session_connections:
            self.active_connections.pop(session_id, None)

    async def broadcast(self, session_id: UUID, data: dict) -> None:
        session_connections = self.active_connections.get(session_id)
        if not session_connections:
            return

        dead_connections: list[WebSocket] = []
        for connection in list(session_connections):
            try:
                await connection.send_json(data)
            except Exception:
                dead_connections.append(connection)

        for dead_connection in dead_connections:
            self.disconnect(session_id, dead_connection)


ws_manager = ConnectionManager()
