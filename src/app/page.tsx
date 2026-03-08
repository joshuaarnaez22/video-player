"use client";

import { useState } from "react";
import Player from "@/components/Player";
import Chat from "@/components/Chat";
import ViewerCount from "@/components/ViewerCount";
import BroadcastInfo from "@/components/BroadcastInfo";

export default function Home() {
  const [viewerCount, setViewerCount] = useState(0);

  return (
    <main className="broadcast-layout">
      <header className="broadcast-header">
        <div className="channel-brand">
          <div className="channel-logo">CH</div>
          <div className="channel-info">
            <h1 className="channel-name">CHANNEL ONE</h1>
            <p className="channel-tagline">Always On. Always Live.</p>
          </div>
        </div>
        <ViewerCount count={viewerCount} />
      </header>

      <div className="broadcast-content">
        <div className="broadcast-main">
          <Player />
          <BroadcastInfo />
        </div>
        <aside className="broadcast-sidebar">
          <Chat onViewerCount={setViewerCount} />
        </aside>
      </div>
    </main>
  );
}
