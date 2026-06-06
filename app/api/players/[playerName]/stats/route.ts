import { NextResponse } from "next/server";
import { getPlayerStats } from "@/src/lib/db";

export const runtime = "nodejs";

type PlayerStatsRouteProps = {
  params: Promise<{
    playerName: string;
  }>;
};

export async function GET(_request: Request, { params }: PlayerStatsRouteProps) {
  try {
    const resolved = await params;
    const stats = await getPlayerStats(decodeURIComponent(resolved.playerName));
    if (!stats) {
      return NextResponse.json({ error: "Player not found or has no fights" }, { status: 404 });
    }
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
