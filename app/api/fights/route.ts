import { NextResponse } from "next/server";
import { insertFightsBulk } from "@/src/lib/db";
import { broadcast } from "@/src/lib/sse";
import { validateFightPayload } from "@/src/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { error: "Use /api/players and /api/fights/[fightID] in the Next app." },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validation = validateFightPayload(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation Failed",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const insertedFights = await insertFightsBulk(validation.fights);

    for (const insertedFight of insertedFights) {
      if (insertedFight.isPublic) {
        broadcast("fight_added", insertedFight.fight);
      }
    }

    return NextResponse.json(
      {
        message: `Successfully stored ${insertedFights.length} fight(s)`,
        fights: insertedFights.map(({ fight }) => fight),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saving fight(s):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
