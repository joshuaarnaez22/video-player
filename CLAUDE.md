# Live Broadcast Simulator

## Project Overview
A Next.js app that simulates a live broadcast video channel using YouTube videos. Users join a "live" stream that's always playing — the server calculates which video and timestamp they should see based on elapsed time since broadcast start.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **WebSockets**: `ws` library via custom server (`server.ts`)
- **Video**: YouTube IFrame API (embedded, ads/controls/branding intact)
- **Styling**: Tailwind CSS (minimal, focus on logic)
- **Language**: TypeScript

## Architecture
- `server.ts` — Custom Node server wrapping Next.js + WebSocket server
- `src/app/page.tsx` — Main broadcast page
- `src/app/api/broadcast/route.ts` — Returns broadcast config + current position
- `src/lib/broadcast.ts` — Core time-sync logic (shared server/client)
- `src/lib/playlist.ts` — Playlist data (video IDs + durations)
- `src/components/Player.tsx` — YouTube IFrame API wrapper
- `src/components/Chat.tsx` — WebSocket chat UI
- `src/components/ViewerCount.tsx` — Live viewer count display

## Key Design Decisions
- Single custom server handles both Next.js and WebSocket connections
- Broadcast sync logic is pure functions, usable on both server and client
- Playlist loops infinitely: `elapsed % totalDuration` gives loop position
- YouTube IFrame API used directly (no wrapper libraries) to preserve ads/controls
- WebSocket messages use `{ type, ...payload }` format

## Commands
- `npm run dev` — Development with custom server
- `npm run build` — Build Next.js
- `npm run start` — Production with custom server

## Deployment
- Cannot use Vercel (no WebSocket support in serverless)
- Use Railway, Render, or Fly.io
