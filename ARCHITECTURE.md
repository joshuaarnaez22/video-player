# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        server.ts                                │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │   HTTP Server         │    │   WebSocket Server (ws)       │  │
│  │                       │    │                               │  │
│  │  Next.js App Router   │    │  /ws endpoint                 │  │
│  │  ├─ Pages (SSR/SSG)   │    │  ├─ Client tracking (Map)     │  │
│  │  └─ API Routes        │    │  ├─ Chat relay                │  │
│  │     └─ /api/broadcast │    │  └─ Viewer count broadcast    │  │
│  └──────────────────────┘    └───────────────────────────────┘  │
│                                                                 │
│  Both share a single HTTP server on port 3000                   │
│  WebSocket upgrade handled on /ws path only                     │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
video-player/
├── server.ts                    # Custom server (Next.js + WebSocket)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (fonts, metadata)
│   │   ├── page.tsx             # Main broadcast page (client component)
│   │   ├── globals.css          # All styles (broadcast control room theme)
│   │   └── api/
│   │       └── broadcast/
│   │           └── route.ts     # GET: current broadcast position
│   ├── lib/
│   │   ├── playlist.ts          # Playlist data (video IDs, durations)
│   │   └── broadcast.ts         # Time-sync logic (pure functions)
│   └── components/
│       ├── Player.tsx           # YouTube IFrame API player
│       ├── Chat.tsx             # WebSocket chat panel
│       └── ViewerCount.tsx      # Live viewer count display
├── package.json
├── tsconfig.json
└── CHECKLIST.md                 # Manual testing checklist
```

## Core Algorithm: Broadcast Sync

The central piece of logic that makes the "live channel" illusion work.

```
Input:  current time (Date.now())
Output: { videoIndex, videoId, offsetSeconds }

1. elapsed = floor((now - BROADCAST_START) / 1000)
   └─ BROADCAST_START = 2025-01-01T00:00:00Z (fixed epoch)

2. playlistPosition = elapsed % TOTAL_DURATION
   └─ TOTAL_DURATION = sum of all video durations (~8 hours)
   └─ This makes the playlist loop infinitely

3. Walk the playlist, accumulating durations:
   ┌─────────────────────────────────────────────────────┐
   │  Video 0: 0s ──────── 3661s                        │
   │  Video 1: 3661s ───── 10861s                       │
   │  Video 2: 10861s ──── 14409s                       │
   │  Video 3: 14409s ──── 18332s                       │
   │  Video 4: 18332s ──── 29147s                       │
   │                                                     │
   │  If playlistPosition = 12000                        │
   │  → Falls in Video 2 range                           │
   │  → offsetSeconds = 12000 - 10861 = 1139            │
   └─────────────────────────────────────────────────────┘

4. Return video ID + offset → player seeks to exact position
```

This function is **pure** (no side effects, deterministic given the same timestamp), making it:
- Testable without mocking
- Usable on both server (API route) and client (Jump to Live)
- Consistent across all connected users

## Data Flow

### Initial Page Load

```
Browser                          Server
  │                                │
  │──── GET / ────────────────────▶│  Next.js renders page (SSG)
  │◀─── HTML + JS ────────────────│
  │                                │
  │  [Player mounts]               │
  │──── GET /api/broadcast ───────▶│  getCurrentPosition(Date.now())
  │◀─── { videoId, offset } ──────│
  │                                │
  │  [Load YouTube IFrame API]     │
  │  [player.loadVideoById(        │
  │    videoId, startSeconds)]     │
  │                                │
  │  [Chat mounts]                 │
  │──── WS connect /ws ──────────▶│  Add to clients Map
  │◀─── { type: viewers, count } ─│  Broadcast new count
  │──── { type: join, user } ────▶│
  │◀─── { type: system, text } ───│  "UserX joined the channel"
  │                                │
```

### Chat Message Flow

```
User A                Server               User B
  │                     │                     │
  │── { type: chat,    │                     │
  │    user, text } ──▶│                     │
  │                     │── { type: chat,    │
  │◀── { type: chat,  │    id, user,        │
  │    id, user,       │    text, ts } ─────▶│
  │    text, ts }      │                     │
  │                     │                     │
```

All chat messages are broadcast to **all** clients, including the sender. This keeps the flow simple — the client doesn't need to optimistically render its own messages.

### Jump to Live

```
Browser                          Server
  │                                │
  │  [User clicks "Jump to Live"]  │
  │──── GET /api/broadcast ───────▶│  getCurrentPosition(Date.now())
  │◀─── { videoId, offset } ──────│
  │                                │
  │  [If same video:]              │
  │  player.seekTo(offset)         │
  │                                │
  │  [If different video:]         │
  │  player.loadVideoById(         │
  │    videoId, startSeconds)      │
  │                                │
```

## WebSocket Protocol

All messages are JSON with a `type` field.

### Client → Server

| Type   | Fields         | Description                  |
|--------|---------------|------------------------------|
| `join` | `user: string` | Announce username on connect |
| `chat` | `user, text`   | Send a chat message          |

### Server → Client

| Type      | Fields              | Description                      |
|-----------|--------------------|---------------------------------|
| `chat`    | `id, user, text, timestamp` | Chat message (broadcast to all) |
| `system`  | `text`             | Join/leave notifications         |
| `viewers` | `count: number`    | Current viewer count             |

## Component Architecture

```
page.tsx (client component)
├── <header>
│   ├── Channel brand (logo + name)
│   └── <ViewerCount count={viewerCount} />
│
└── <div> broadcast-content
    ├── <Player />
    │   ├── Player header (LIVE badge + now playing)
    │   ├── YouTube IFrame (via YT.Player API)
    │   ├── Scanline overlay (CSS)
    │   └── Controls bar (Jump to Live button)
    │
    └── <Chat onViewerCount={setViewerCount} />
        ├── Chat header (title + connection status)
        ├── Message list (scrollable)
        └── Input form (username tag + input + send)
```

State flows **up** via callbacks:
- `Chat` receives viewer count from WebSocket → calls `onViewerCount` → updates `page.tsx` state → passes to `ViewerCount`
- `Player` manages its own state (current video, ready status) internally

## Server Architecture

```
server.ts
│
├── next({ dev }) ─── Next.js app instance
│   └── handle(req, res) ─── All HTTP requests
│
├── WebSocketServer({ noServer: true })
│   ├── clients: Map<string, { ws, user }>
│   │
│   ├── on "connection"
│   │   ├── Assign UUID
│   │   ├── Add to clients Map
│   │   ├── broadcastViewerCount()
│   │   │
│   │   ├── on "message"
│   │   │   ├── type "join"  → update username, broadcast system msg
│   │   │   └── type "chat"  → broadcast to all (200 char limit)
│   │   │
│   │   └── on "close"
│   │       ├── Remove from Map
│   │       ├── Broadcast leave message
│   │       └── broadcastViewerCount()
│   │
│   └── broadcastViewerCount() ─── sends { type: viewers, count }
│
└── server.on("upgrade")
    └── pathname === "/ws" ? handleUpgrade : socket.destroy()
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Custom server instead of separate WS service | Single port, single deploy, simpler infra |
| Pure sync function (no DB) | Broadcast position is deterministic — no state to store |
| YouTube IFrame API (not react-youtube) | Requirement to keep ads/controls/branding unchanged |
| Client-side username generation | No auth needed for a demo; keeps things simple |
| Chat messages broadcast to sender too | Avoids optimistic UI complexity; server is source of truth |
| CSS-only styling (no Tailwind utilities in components) | Complex theme requires custom properties; Tailwind imported but used minimally |
| No database | Chat is ephemeral (in-memory only); broadcast state is computed |

## Deployment Constraints

```
┌─────────────────────────────────────────────┐
│ Requires long-running Node.js process       │
│ (WebSocket connections need persistent TCP) │
│                                             │
│ ✗ Vercel (serverless, no WS)               │
│ ✗ Cloudflare Pages (no custom server)      │
│                                             │
│ ✓ Railway                                  │
│ ✓ Render                                   │
│ ✓ Fly.io                                   │
│ ✓ Any VPS (DigitalOcean, EC2, etc.)        │
└─────────────────────────────────────────────┘
```

## Scaling Considerations (Beyond Demo Scope)

If this needed to scale beyond a single server:

1. **Chat** — Replace in-memory relay with Redis Pub/Sub so multiple server instances share messages
2. **Viewer count** — Store in Redis with atomic increment/decrement
3. **Broadcast sync** — Already stateless/deterministic, scales infinitely
4. **Video delivery** — Already handled by YouTube CDN, no server load
