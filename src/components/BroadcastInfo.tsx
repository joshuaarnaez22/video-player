"use client";

import { useEffect, useState } from "react";
import { EFFECTIVE_PLAYLIST, TOTAL_DURATION } from "@/lib/playlist";
import { BROADCAST_START } from "@/lib/broadcast";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatElapsed(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${days}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export default function BroadcastInfo() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalElapsed = Math.floor((now - BROADCAST_START) / 1000);
  const playlistPosition =
    ((totalElapsed % TOTAL_DURATION) + TOTAL_DURATION) % TOTAL_DURATION;

  let accumulated = 0;
  let currentIndex = 0;
  let offsetInVideo = 0;
  for (let i = 0; i < EFFECTIVE_PLAYLIST.length; i++) {
    if (accumulated + EFFECTIVE_PLAYLIST[i].duration > playlistPosition) {
      currentIndex = i;
      offsetInVideo = playlistPosition - accumulated;
      break;
    }
    accumulated += EFFECTIVE_PLAYLIST[i].duration;
  }

  const currentVideo = EFFECTIVE_PLAYLIST[currentIndex];
  const progressPercent = (offsetInVideo / currentVideo.duration) * 100;
  const cyclePercent = (playlistPosition / TOTAL_DURATION) * 100;

  return (
    <div className="broadcast-info">
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">BROADCAST UPTIME</span>
          <span className="info-value uptime">{formatElapsed(totalElapsed)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">PLAYLIST CYCLE</span>
          <span className="info-value">{formatDuration(playlistPosition)} / {formatDuration(TOTAL_DURATION)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">NOW PLAYING ({currentIndex + 1}/{EFFECTIVE_PLAYLIST.length})</span>
          <span className="info-value">{currentVideo.title}</span>
        </div>
        <div className="info-item">
          <span className="info-label">VIDEO OFFSET</span>
          <span className="info-value">{formatDuration(offsetInVideo)} / {formatDuration(currentVideo.duration)}</span>
        </div>
      </div>

      <div className="progress-bars">
        <div className="progress-row">
          <span className="progress-label">VIDEO</span>
          <div className="progress-track">
            <div className="progress-fill video-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="progress-row">
          <span className="progress-label">CYCLE</span>
          <div className="progress-track">
            {EFFECTIVE_PLAYLIST.map((item, i) => (
              <div
                key={item.videoId}
                className={`progress-segment ${i === currentIndex ? "active" : ""} ${i < currentIndex ? "past" : ""}`}
                style={{ width: `${(item.duration / TOTAL_DURATION) * 100}%` }}
                title={item.title}
              />
            ))}
            <div className="progress-needle" style={{ left: `${cyclePercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
