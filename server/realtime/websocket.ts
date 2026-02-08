import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export type BroadcastFn = (type: string, payload: unknown) => void;

export function setupWebsocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const broadcast: BroadcastFn = (type, payload) => {
    const message = JSON.stringify({ type, payload });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  return { wss, broadcast };
}
