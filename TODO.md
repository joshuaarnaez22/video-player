# TODO — Live Broadcast Simulator

## Phase 1: Project Setup
- [x] Initialize Next.js project with TypeScript and Tailwind
- [x] Install dependencies (`ws`, `@types/ws`, `@types/youtube`, `tsx`)
- [x] Set up project structure (src/lib, src/components)

## Phase 2: Core Broadcast Logic
- [x] Define playlist data in `src/lib/playlist.ts` (5 YouTube video IDs + durations)
- [x] Implement `getCurrentPosition()` in `src/lib/broadcast.ts`
  - Calculate elapsed time since broadcast start
  - Modulo by total playlist duration (infinite loop)
  - Walk playlist to find current video index + offset within that video
- [x] Create API route `GET /api/broadcast` returning current position + playlist info

## Phase 3: YouTube Player
- [x] Create `Player.tsx` component
- [x] Load YouTube IFrame API via script tag
- [x] On mount: fetch `/api/broadcast`, load correct video at correct offset
- [x] Handle `onStateChange` to auto-advance to next video when current ends
- [x] Implement "Jump to Live" button that recalculates position and seeks

## Phase 4: Custom Server + WebSocket
- [x] Create `server.ts` with HTTP server wrapping Next.js
- [x] Attach `ws` WebSocket server to same HTTP server
- [x] Track connected clients (Map)
- [x] Broadcast viewer count on connect/disconnect
- [x] Relay chat messages to all connected clients

## Phase 5: Chat & Viewer Count UI
- [x] Create `Chat.tsx` component with WebSocket connection
- [x] Message list + input field
- [x] Display username (random generated)
- [x] Create `ViewerCount.tsx` component showing live count
- [x] Wire up WebSocket message handling for both components

## Phase 6: Integration & Polish
- [x] Assemble all components on main page (`page.tsx`)
- [x] Layout: player main area, chat sidebar, viewer count in header
- [x] Broadcast control room aesthetic (dark, cinematic, LIVE indicator)
- [x] Responsive design (mobile stacks vertically)
- [x] Handle edge cases (WebSocket reconnection, message limits)

## Phase 7: Documentation
- [x] README with approach explanation
- [x] CHECKLIST.md for manual testing
- [ ] Deploy to Railway/Render
- [ ] Create GitHub repository and push
