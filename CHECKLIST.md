# Manual Testing Checklist

## Setup
- [ ] Run `npm install` — installs without errors
- [ ] Run `npm run dev` — server starts, shows "Server ready on http://localhost:3000"
- [ ] Open http://localhost:3000 in browser — page loads without console errors

## Broadcast Sync Logic
- [ ] Hit `GET /api/broadcast` — returns JSON with `broadcastStart`, `playlist`, `current`
- [ ] `current.videoIndex` is between 0-4 (valid playlist index)
- [ ] `current.offsetSeconds` is > 0 (not starting from beginning — proves time sync works)
- [ ] Refresh `/api/broadcast` after 10s — `current.offsetSeconds` increases by ~10
- [ ] `current.videoId` matches the video actually playing in the embedded player

## YouTube Player
- [ ] Player loads automatically with the correct video (matches API response)
- [ ] Video starts at a non-zero timestamp (joins mid-stream, not from the start)
- [ ] YouTube controls, branding, and ads are visible and functional (official embed)
- [ ] Video plays with audio (may require clicking to unmute due to browser autoplay policies)

## Jump to Live
- [ ] "Jump to Live" button is visible below the player
- [ ] Click "Jump to Live" — player recalculates and seeks to current live position
- [ ] If you pause the video for 30+ seconds then click "Jump to Live", it jumps ahead
- [ ] Button has a pulsing red dot indicator

## Live Chat (WebSocket)
- [ ] Chat panel is visible on the right sidebar (or below on mobile)
- [ ] Connection status shows "CONNECTED" in green
- [ ] Type a message and press Send — message appears in the chat
- [ ] A random username is auto-generated (e.g., "CosmicOwl42")
- [ ] Messages display with colored username and white text

## Multi-User Test (open 2+ browser tabs)
- [ ] Open a second tab to http://localhost:3000
- [ ] Both tabs show the same video at approximately the same timestamp
- [ ] Send a chat message in Tab 1 — it appears in Tab 2
- [ ] Send a chat message in Tab 2 — it appears in Tab 1
- [ ] "X joined the channel" system message appears when a new tab connects
- [ ] "X left the channel" system message appears when a tab is closed

## Viewer Count
- [ ] Viewer count displays in the header (eye icon + number)
- [ ] With 1 tab open, count shows "1"
- [ ] Open a second tab — count updates to "2" in both tabs
- [ ] Close the second tab — count drops back to "1"

## Responsive Design
- [ ] Resize browser to mobile width (~375px) — layout stacks vertically
- [ ] Player takes full width on mobile
- [ ] Chat appears below the player on mobile
- [ ] All controls remain usable on mobile

## Edge Cases
- [ ] Refresh the page — player reloads at the correct current position (not from start)
- [ ] Close and reopen the page after a few minutes — lands at correct position
- [ ] WebSocket reconnects if connection drops (close DevTools Network WS, wait 2s)
- [ ] Chat messages are limited to 200 characters (try pasting a long string)

## Build & Production
- [ ] `npm run build` completes without errors
- [ ] `npm run start` starts the production server
- [ ] All features work in production mode
