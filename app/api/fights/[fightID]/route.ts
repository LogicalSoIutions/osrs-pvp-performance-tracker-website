import { NextResponse } from "next/server";
import { getFightByFightId, getItemStatsForIds } from "@/src/lib/db";
import type { Fighter } from "@/src/types/fights";

export const runtime = "nodejs";

type FightRouteProps = {
  params: Promise<{
    fightID: string;
  }>;
};

export async function GET(_request: Request, { params }: FightRouteProps) {
  try {
    const resolved = await params;
    const fight = await getFightByFightId(resolved.fightID);

    if (!fight) {
      return NextResponse.json({ error: "Fight not found" }, { status: 404 });
    }

    // Extract all unique item IDs from the fight logs
    const itemIdsSet = new Set<number>();
    
    const collectFromFighter = (fighter: Fighter | null | undefined) => {
      if (!fighter?.l) return;
      for (const entry of fighter.l) {
        if (entry?.G) {
          for (const id of entry.G) {
            if (id > 0) {
              const normalized = id > 2048 ? id - 2048 : id;
              itemIdsSet.add(normalized);
            }
          }
        }
        if (entry?.g) {
          for (const id of entry.g) {
            if (id > 0) {
              const normalized = id > 2048 ? id - 2048 : id;
              itemIdsSet.add(normalized);
            }
          }
        }
        if (entry?.R && entry.R > 0) {
          itemIdsSet.add(entry.R);
        }
        if (entry?.A && entry.A > 0) {
          itemIdsSet.add(entry.A);
        }
      }
    };

    if (fight.full_data) {
      collectFromFighter(fight.full_data.c);
      collectFromFighter(fight.full_data.o);
    }
    if (fight.secondary_data) {
      collectFromFighter(fight.secondary_data.c);
      collectFromFighter(fight.secondary_data.o);
    }

    // Add default rings to ensure they are fetched
    itemIdsSet.add(20655); // Ring of suffering (i)
    itemIdsSet.add(6737);  // Berserker ring

    const itemStats = await getItemStatsForIds(Array.from(itemIdsSet));

    return NextResponse.json({
      ...fight,
      item_stats: itemStats,
    });
  } catch (error) {
    console.error("Error fetching fight by fightID:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
