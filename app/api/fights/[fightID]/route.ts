import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getFightByFightId, getItemStatsForIds, type ItemStatsRow } from "@/src/lib/db";
import type { Fighter, ItemStats } from "@/src/types/fights";

export const runtime = "nodejs";

type SlotHint = "head" | "cape" | "neck" | "weapon" | "body" | "shield" | "legs" | "hands" | "feet" | "ammunition";
type GearSlotHint = Exclude<SlotHint, "weapon" | "ammunition">;
type LocalItemStat = ItemStats & { slot?: string | null };

type LocalItemStatsIndex = {
  itemNames: Record<string, string>;
  bySlot: Partial<Record<SlotHint, LocalItemStat[]>>;
  allEntries: LocalItemStat[];
};

const EQUIPMENT_SLOT_HINTS: Record<number, SlotHint | undefined> = {
  0: "head",
  1: "cape",
  2: "neck",
  3: "weapon",
  4: "body",
  5: "shield",
  7: "legs",
  9: "hands",
  10: "feet",
  11: "ammunition",
};

const SLOT_FILES_BY_HINT: Record<SlotHint, string[]> = {
  head: ["head.json"],
  cape: ["cape.json"],
  neck: ["neck.json"],
  weapon: ["one_handed.json", "two_handed.json"],
  body: ["body.json"],
  shield: ["shield.json"],
  legs: ["legs.json"],
  hands: ["hands.json"],
  feet: ["feet.json"],
  ammunition: ["ammunition.json"],
};

let localItemStatsIndexPromise: Promise<LocalItemStatsIndex> | null = null;

function normalizeItemStatName(name: string) {
  return name.split("#")[0]?.trim().toLowerCase() ?? "";
}

function normalizeLooseItemName(name: string) {
  return normalizeItemStatName(name).replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

function cloneResolvedItemStats(
  itemId: number,
  rawName: string,
  resolved: LocalItemStat | ItemStatsRow,
  current?: ItemStatsRow,
): ItemStatsRow {
  return {
    ...resolved,
    id: current?.id ?? String(itemId),
    item_id: itemId,
    name: rawName,
    image_url: current?.image_url ?? resolved.image_url,
  } as ItemStatsRow;
}

async function loadLocalItemStatsIndex(): Promise<LocalItemStatsIndex> {
  if (!localItemStatsIndexPromise) {
    localItemStatsIndexPromise = (async () => {
      const itemStatsDir = path.join(process.cwd(), "item_stats");
      const itemNames = JSON.parse(
        await readFile(path.join(itemStatsDir, "item_names.json"), "utf8"),
      ) as Record<string, string>;

      const bySlot = {} as Partial<Record<SlotHint, LocalItemStat[]>>;
      for (const [slotHint, files] of Object.entries(SLOT_FILES_BY_HINT) as [SlotHint, string[]][]) {
        const entries: LocalItemStat[] = [];
        for (const file of files) {
          const parsed = JSON.parse(await readFile(path.join(itemStatsDir, file), "utf8")) as LocalItemStat[];
          entries.push(...parsed);
        }
        bySlot[slotHint] = entries;
      }

      return {
        itemNames,
        bySlot,
        allEntries: Object.values(bySlot).flat(),
      };
    })();
  }

  return localItemStatsIndexPromise;
}

async function patchAmbiguousItemStats(
  itemStats: Record<number, ItemStatsRow>,
  itemSlotHints: Map<number, Set<SlotHint>>,
) {
  const localIndex = await loadLocalItemStatsIndex();

  for (const [itemId, slotHints] of itemSlotHints.entries()) {
    if (slotHints.size === 0) {
      continue;
    }

    const preferredHints = [...slotHints].filter(
      (hint): hint is GearSlotHint => hint !== "weapon" && hint !== "ammunition",
    );
    if (preferredHints.length === 0) {
      continue;
    }

    const current = itemStats[itemId];
    if (current?.slot && preferredHints.includes(current.slot as GearSlotHint)) {
      continue;
    }

    const rawName = localIndex.itemNames[String(itemId)];
    if (!rawName) {
      continue;
    }

    const exactName = normalizeItemStatName(rawName);
    const looseName = normalizeLooseItemName(rawName);

    for (const slotHint of preferredHints) {
      const candidates = localIndex.bySlot[slotHint] ?? [];
      const resolved =
        candidates.find((entry) => normalizeItemStatName(entry.name) === exactName)
        ?? candidates.find((entry) => normalizeLooseItemName(entry.name) === looseName);

      if (resolved) {
        itemStats[itemId] = cloneResolvedItemStats(itemId, rawName, resolved, current);
        break;
      }
    }
  }
}

async function patchVariantItemStats(
  itemStats: Record<number, ItemStatsRow>,
  itemSlotHints: Map<number, Set<SlotHint>>,
) {
  const localIndex = await loadLocalItemStatsIndex();

  for (const [itemId, slotHints] of itemSlotHints.entries()) {
    const current = itemStats[itemId];
    if (current?.image_url) {
      continue;
    }

    const rawName = localIndex.itemNames[String(itemId)];
    if (!rawName) {
      continue;
    }

    const exactName = normalizeItemStatName(rawName);
    const looseName = normalizeLooseItemName(rawName);
    const hintedSlots = slotHints.size > 0 ? [...slotHints] : [];
    const candidateGroups = hintedSlots.length > 0
      ? hintedSlots.map((slotHint) => localIndex.bySlot[slotHint] ?? [])
      : [localIndex.allEntries];

    let resolved: LocalItemStat | undefined;
    for (const candidates of candidateGroups) {
      resolved =
        candidates.find((entry) => normalizeItemStatName(entry.name) === exactName)
        ?? candidates.find((entry) => normalizeLooseItemName(entry.name) === looseName);

      if (resolved?.image_url) {
        break;
      }

      resolved = undefined;
    }

    if (resolved?.image_url) {
      itemStats[itemId] = cloneResolvedItemStats(itemId, rawName, resolved, current);
    }
  }
}

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
    const itemSlotHints = new Map<number, Set<SlotHint>>();

    const addSlotHint = (normalizedId: number, slotHint: SlotHint | undefined) => {
      if (!slotHint) {
        return;
      }

      const existing = itemSlotHints.get(normalizedId);
      if (existing) {
        existing.add(slotHint);
        return;
      }

      itemSlotHints.set(normalizedId, new Set([slotHint]));
    };
    
    const collectFromFighter = (fighter: Fighter | null | undefined) => {
      if (!fighter?.l) return;
      for (const entry of fighter.l) {
        if (entry?.G) {
          for (const [index, id] of entry.G.entries()) {
            if (id > 0) {
              const normalized = id > 2048 ? id - 2048 : id;
              itemIdsSet.add(normalized);
              addSlotHint(normalized, EQUIPMENT_SLOT_HINTS[index]);
            }
          }
        }
        if (entry?.g) {
          for (const [index, id] of entry.g.entries()) {
            if (id > 0) {
              const normalized = id > 2048 ? id - 2048 : id;
              itemIdsSet.add(normalized);
              addSlotHint(normalized, EQUIPMENT_SLOT_HINTS[index]);
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
    await patchAmbiguousItemStats(itemStats, itemSlotHints);
    await patchVariantItemStats(itemStats, itemSlotHints);

    return NextResponse.json({
      ...fight,
      item_stats: itemStats,
    });
  } catch (error) {
    console.error("Error fetching fight by fightID:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
