# Channel One — Live Broadcast Simulator

A simulated live broadcast video channel built with Next.js. Users join a "channel" that's always playing — the server calculates which YouTube video and timestamp they should see based on elapsed time since a fixed broadcast start.

## Approach

### Core Concept

The system treats a playlist of YouTube videos as an infinitely looping broadcast. A fixed start time (`2025-01-01T00:00:00Z`) serves as the "broadcast epoch." When any user loads the page:

1. **Calculate elapsed time** — `now - broadcastStart` gives total seconds since launch
2. **Modulo by total playlist duration** — `elapsed % totalDuration` gives position within the current loop cycle
3. **Walk the playlist** — sum video durations to find which video is playing and at what offset

This means every user sees the same content at the same time, regardless of when they open the page — just like tuning into a real TV channel.

### Architecture

```
server.ts              → Custom HTTP server (Next.js + WebSocket on same port)
src/lib/broadcast.ts   → Pure sync logic (getCurrentPosition)
src/lib/playlist.ts    → Playlist data (video IDs + durations)
src/app/api/broadcast/  → REST endpoint returning current position
src/components/
  Player.tsx           → YouTube IFrame API player
  Chat.tsx             → WebSocket-powered live chat
  ViewerCount.tsx      → Real-time viewer count
```

### Key Decisions

- **YouTube IFrame API** — Videos are fully embedded from YouTube with ads, controls, and branding intact. No wrapper libraries.
- **Custom server** — Next.js API routes don't support WebSockets, so a lightweight `server.ts` wraps Next.js and attaches a `ws` WebSocket server to the same HTTP server. No separate backend service needed.
- **Pure sync functions** — The broadcast position calculation is a pure function with no side effects, making it testable and usable on both server (API) and client (Jump to Live).
- **Infinite looping** — The playlist loops seamlessly using modulo arithmetic. The channel never stops.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **YouTube IFrame API** (official embedded player)
- **ws** (WebSocket server)
- **Tailwind CSS** (styling)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (custom server + Next.js) |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start production server |

## Deployment

This app requires a long-running Node.js server (for WebSocket support), so it cannot be deployed to Vercel's serverless platform. Recommended platforms:

- **Railway**
- **Render**
- **Fly.io**

## Features

- Simulated live broadcast with time-synced playback
- Automatic video advancement through playlist
- "Jump to Live" button to re-sync with current broadcast position
- Real-time chat via WebSocket
- Live viewer count
- Responsive layout (desktop sidebar chat, mobile stacked)
