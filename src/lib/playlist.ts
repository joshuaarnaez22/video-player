export interface PlaylistItem {
  videoId: string;
  title: string;
  duration: number; // seconds
}

// ─── Test mode: short videos for testing transitions ───
// Set to true to use short (<1 min) videos, false for production playlist
const TEST_MODE = false;

const TEST_PLAYLIST: PlaylistItem[] = [
  {
    videoId: "jNQXAC9IVRw",
    title: "Me at the zoo",
    duration: 19,
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    duration: 32, // we'll cut it short for testing
  },
  {
    videoId: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE",
    duration: 28,
  },
];

// ─── Production playlist ───
const PROD_PLAYLIST: PlaylistItem[] = [
  {
    videoId: "LXb3EKWsInQ",
    title: "A Smooth Jazz Lounge",
    duration: 3661, // ~61 min
  },
  {
    videoId: "jfKfPfyJRdk",
    title: "lofi hip hop radio",
    duration: 0, // livestream — treated as 7200s (2h) for rotation
  },
  {
    videoId: "DWcJFNfaw9c",
    title: "Jazz Relaxing Music",
    duration: 3548, // ~59 min
  },
  {
    videoId: "HuFYqnbVbzY",
    title: "Study Jazz Piano",
    duration: 3923, // ~65 min
  },
  {
    videoId: "Na0w3Mz1WVw",
    title: "Relaxing Fireplace",
    duration: 10815, // ~3h
  },
];

export const PLAYLIST = TEST_MODE ? TEST_PLAYLIST : PROD_PLAYLIST;

// Replace 0 durations (livestreams) with a fallback
export const EFFECTIVE_PLAYLIST = PLAYLIST.map((item) => ({
  ...item,
  duration: item.duration || 7200,
}));

export const TOTAL_DURATION = EFFECTIVE_PLAYLIST.reduce(
  (sum, item) => sum + item.duration,
  0
);
