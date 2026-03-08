import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

interface Client {
  ws: WebSocket;
  user: string;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<string, Client>();

  function broadcastViewerCount() {
    const msg = JSON.stringify({ type: "viewers", count: clients.size });
    for (const [, client] of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }

  function broadcast(data: string, excludeId?: string) {
    for (const [id, client] of clients) {
      if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  wss.on("connection", (ws) => {
    const clientId = crypto.randomUUID();
    clients.set(clientId, { ws, user: "Anonymous" });
    broadcastViewerCount();

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === "join") {
          const client = clients.get(clientId);
          if (client) client.user = data.user || "Anonymous";

          broadcast(
            JSON.stringify({
              type: "system",
              text: `${data.user} joined the channel`,
            })
          );
          broadcastViewerCount();
        }

        if (data.type === "chat" && data.text) {
          const msg = JSON.stringify({
            type: "chat",
            id: crypto.randomUUID(),
            user: data.user || "Anonymous",
            text: data.text.slice(0, 200),
            timestamp: Date.now(),
          });
          // Broadcast to all including sender
          for (const [, client] of clients) {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(msg);
            }
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      const client = clients.get(clientId);
      clients.delete(clientId);

      if (client && client.user !== "Anonymous") {
        broadcast(
          JSON.stringify({
            type: "system",
            text: `${client.user} left the channel`,
          })
        );
      }
      broadcastViewerCount();
    });
  });

  // Upgrade HTTP to WebSocket for /ws path
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url!, true);
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
    console.log(`> WebSocket ready on ws://localhost:${port}/ws`);
  });
});
