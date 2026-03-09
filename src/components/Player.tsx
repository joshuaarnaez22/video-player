"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { BroadcastPosition } from "@/lib/broadcast";

// Extend Window for YT API
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerProps {
  onPositionUpdate?: (position: BroadcastPosition) => void;
}

export default function Player({ onPositionUpdate }: PlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const currentVideoIdRef = useRef<string>("");
  const loadingRef = useRef(false);
  const slotTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playStartTimeRef = useRef<number>(0);

  const fetchAndSeek = useCallback(async (force = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Clear any existing slot timer
    clearTimeout(slotTimerRef.current);

    try {
      const res = await fetch("/api/broadcast");
      const data = await res.json();
      const { current, playlist } = data;

      setCurrentTitle(current.title);
      onPositionUpdate?.(current);

      if (playerRef.current) {
        if (!force && currentVideoIdRef.current === current.videoId) {
          // Same video — just seek, don't reload
          playerRef.current.seekTo(current.offsetSeconds, true);
        } else {
          // Different video — load it
          currentVideoIdRef.current = current.videoId;
          playStartTimeRef.current = Date.now();
          playerRef.current.loadVideoById({
            videoId: current.videoId,
            startSeconds: current.offsetSeconds,
          });
        }

        // Set a timer to advance when this video's slot runs out
        const currentItem = playlist[current.videoIndex];
        const remainingInSlot = currentItem.duration - current.offsetSeconds;
        if (remainingInSlot > 0) {
          slotTimerRef.current = setTimeout(() => {
            currentVideoIdRef.current = "";
            fetchAndSeek(true);
          }, remainingInSlot * 1000);
        }
      }
    } finally {
      loadingRef.current = false;
    }
  }, [onPositionUpdate]);

  useEffect(() => {
    // Destroy any existing player from previous mount (Strict Mode)
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // Load YT IFrame API script (only once)
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 0,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            fetchAndSeek();
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              // Only advance if the video played for at least 5 seconds
              // (ignores spurious ENDED from ads, embed restrictions, etc.)
              const playedMs = Date.now() - playStartTimeRef.current;
              if (playedMs > 5000) {
                clearTimeout(slotTimerRef.current);
                currentVideoIdRef.current = "";
                fetchAndSeek(true);
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearTimeout(slotTimerRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJumpToLive = () => {
    fetchAndSeek();
  };

  return (
    <div className="player-container">
      <div className="player-header">
        <div className="live-badge">
          <span className="live-dot" />
          LIVE
        </div>
        <span className="now-playing">{currentTitle}</span>
      </div>
      <div className="player-wrapper">
        <div ref={containerRef} className="player-frame" />
        {!isReady && (
          <div className="player-loading">
            <div className="loading-pulse">TUNING IN...</div>
          </div>
        )}
        <div className="scanline-overlay" />
      </div>
      <div className="player-controls">
        <button onClick={handleJumpToLive} className="jump-to-live-btn">
          <span className="live-dot" />
          Jump to Live
        </button>
      </div>
    </div>
  );
}
