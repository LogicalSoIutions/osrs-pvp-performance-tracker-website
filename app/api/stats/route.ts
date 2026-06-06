import { NextResponse } from "next/server";
import { getGlobalStats } from "@/src/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getGlobalStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
