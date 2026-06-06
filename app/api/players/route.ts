import { NextResponse } from "next/server";
import { getPlayerSummaries } from "@/src/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const players = await getPlayerSummaries(search);
    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
