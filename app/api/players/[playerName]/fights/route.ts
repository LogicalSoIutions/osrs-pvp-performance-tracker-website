import { NextResponse } from "next/server";
import { getPlayerFights } from "@/src/lib/db";

export const runtime = "nodejs";

type PlayerFightRouteProps = {
  params: Promise<{
    playerName: string;
  }>;
};

export async function GET(_request: Request, { params }: PlayerFightRouteProps) {
  try {
    const resolved = await params;
    const fights = await getPlayerFights(decodeURIComponent(resolved.playerName));
    return NextResponse.json(fights);
  } catch (error) {
    console.error("Error fetching player fights:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
