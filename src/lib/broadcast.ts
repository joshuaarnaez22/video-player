import { EFFECTIVE_PLAYLIST, TOTAL_DURATION } from "./playlist";

// Fixed broadcast start time — the "channel" has been live since this moment
export const BROADCAST_START = new Date("2025-01-01T00:00:00Z").getTime();

export interface BroadcastPosition {
  videoIndex: number;
  videoId: string;
  title: string;
  offsetSeconds: number;
  totalElapsed: number;
  playlistPosition: number; // position within current loop cycle
}

export function getCurrentPosition(
  now: number = Date.now()
): BroadcastPosition {
  const totalElapsed = Math.floor((now - BROADCAST_START) / 1000);
  const playlistPosition =
    ((totalElapsed % TOTAL_DURATION) + TOTAL_DURATION) % TOTAL_DURATION;

  let accumulated = 0;
  for (let i = 0; i < EFFECTIVE_PLAYLIST.length; i++) {
    const item = EFFECTIVE_PLAYLIST[i];
    if (accumulated + item.duration > playlistPosition) {
      return {
        videoIndex: i,
        videoId: item.videoId,
        title: item.title,
        offsetSeconds: playlistPosition - accumulated,
        totalElapsed,
        playlistPosition,
      };
    }
    accumulated += item.duration;
  }

  // Fallback to first video (should never reach here)
  return {
    videoIndex: 0,
    videoId: EFFECTIVE_PLAYLIST[0].videoId,
    title: EFFECTIVE_PLAYLIST[0].title,
    offsetSeconds: 0,
    totalElapsed,
    playlistPosition,
  };
}
