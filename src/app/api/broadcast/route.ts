import { NextResponse } from "next/server";
import { getCurrentPosition, BROADCAST_START } from "@/lib/broadcast";
import { EFFECTIVE_PLAYLIST, TOTAL_DURATION } from "@/lib/playlist";

export function GET() {
  const position = getCurrentPosition();

  return NextResponse.json({
    broadcastStart: BROADCAST_START,
    totalDuration: TOTAL_DURATION,
    playlist: EFFECTIVE_PLAYLIST,
    current: position,
    serverTime: Date.now(),
  });
}
