import type { FightLogEntry, FightPerformance, Fighter, HeadIconValue } from "@/src/types/fights";
import { recalculateMergedEntry, type ItemStatsLike } from "@/src/lib/fight-calc";

type WrappedLog = {
  attackerName: string;
  entry: FightLogEntry;
};

type MergedAttackPair = {
  attackLog: FightLogEntry;
  defenderLog: FightLogEntry;
};

const SUCCESSFUL_OFFENSIVE_PRAYERS = {
  MELEE: new Set([945, 946]),
  RANGED: new Set([133, 502, 504, 1420, 1422]),
  MAGIC: new Set([134, 503, 505, 1421, 1423]),
};

function cloneFight<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sortByTickAndTime(left: FightLogEntry, right: FightLogEntry) {
  const tickDiff = (left.T ?? 0) - (right.T ?? 0);
  if (tickDiff !== 0) {
    return tickDiff;
  }
  return (left.t ?? 0) - (right.t ?? 0);
}

function arraysEqual(left?: number[] | null, right?: number[] | null) {
  if (left === right) {
    return true;
  }
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function isMagicStyle(style?: string | null) {
  return style?.startsWith("MAGIC") ?? false;
}

function isRangedStyle(style?: string | null) {
  return style?.startsWith("RANGED") ?? false;
}

function isMeleeStyle(style?: string | null) {
  return Boolean(style) && !isMagicStyle(style) && !isRangedStyle(style);
}

function expectedProtection(style?: string | null): HeadIconValue {
  if (isMagicStyle(style)) return "MAGIC";
  if (isRangedStyle(style)) return "RANGED";
  if (isMeleeStyle(style)) return "MELEE";
  return null;
}

function wasSuccessful(entry: FightLogEntry) {
  return expectedProtection(entry.m) !== (entry.o ?? null);
}

function usedSuccessfulOffensivePrayer(entry: FightLogEntry) {
  if (isMagicStyle(entry.m)) {
    return SUCCESSFUL_OFFENSIVE_PRAYERS.MAGIC.has(entry.p);
  }
  if (isRangedStyle(entry.m)) {
    return SUCCESSFUL_OFFENSIVE_PRAYERS.RANGED.has(entry.p);
  }
  if (isMeleeStyle(entry.m)) {
    return SUCCESSFUL_OFFENSIVE_PRAYERS.MELEE.has(entry.p);
  }
  return false;
}

function wrapLogs(fight: FightPerformance): WrappedLog[] {
  const competitorLogs = (fight.c.l ?? []).map((entry) => ({ attackerName: fight.c.n, entry: cloneFight(entry) }));
  const opponentLogs = (fight.o.l ?? []).map((entry) => ({ attackerName: fight.o.n, entry: cloneFight(entry) }));
  return [...competitorLogs, ...opponentLogs].sort((left, right) => sortByTickAndTime(left.entry, right.entry));
}

function filterFullLogs(logs: WrappedLog[]) {
  return logs.filter((log) => log.entry.f);
}

function areOpposingPovs(left: FightPerformance, right: FightPerformance) {
  return left.c.n === right.o.n && left.o.n === right.c.n;
}

function areMatchingAttackLogs(left: WrappedLog, right: WrappedLog) {
  return left.attackerName === right.attackerName
    && left.entry.m === right.entry.m
    && arraysEqual(left.entry.G, right.entry.G)
    && arraysEqual(left.entry.g, right.entry.g)
    && (left.entry.O ?? null) === (right.entry.O ?? null)
    && (left.entry.o ?? null) === (right.entry.o ?? null)
    && wasSuccessful(left.entry) === wasSuccessful(right.entry)
    && left.entry.s === right.entry.s;
}

function determineTickOffset(mainFightLogs: WrappedLog[], opponentFightLogs: WrappedLog[]) {
  const fullMainFightLogs = filterFullLogs(mainFightLogs);
  const fullOpponentFightLogs = filterFullLogs(opponentFightLogs);
  const offsetsToCheck = 2;
  const attacksToCheck = 12;
  const matchingLogs: WrappedLog[][][] = [];

  for (let mainOffset = 0; mainOffset < offsetsToCheck; mainOffset += 1) {
    for (let oppOffset = 0; oppOffset < offsetsToCheck; oppOffset += 1) {
      const currentOffsetMatches: WrappedLog[][] = [];
      let highestMatchIdx = -1;

      for (let i = mainOffset; i < fullMainFightLogs.length && i < attacksToCheck; i += 1) {
        const entry = fullMainFightLogs[i];
        const skip = highestMatchIdx < 0 ? oppOffset : highestMatchIdx + 1;
        const limit = Math.max(0, attacksToCheck - skip);

        const relativeIdx = fullOpponentFightLogs
          .slice(skip, skip + limit)
          .findIndex((candidate) => areMatchingAttackLogs(entry, candidate));

        if (relativeIdx === -1) {
          continue;
        }

        const absoluteIdx = skip + relativeIdx;
        highestMatchIdx = absoluteIdx;
        currentOffsetMatches.push([entry, fullOpponentFightLogs[absoluteIdx]]);
      }

      if (currentOffsetMatches.length >= 2) {
        matchingLogs.push(currentOffsetMatches);
      }
    }
  }

  if (matchingLogs.length === 0) {
    return null;
  }

  matchingLogs.sort((left, right) => right.length - left.length);

  for (const logMatches of matchingLogs) {
    let tickDiff: number | null = null;
    let valid = true;

    for (const [mainEntry, opposingEntry] of logMatches) {
      const currentDiff = (mainEntry.entry.T ?? 0) - (opposingEntry.entry.T ?? 0);
      if (tickDiff == null) {
        tickDiff = currentDiff;
        continue;
      }
      if (currentDiff !== tickDiff) {
        valid = false;
        break;
      }
    }

    if (valid) {
      return tickDiff ?? 0;
    }
  }

  return null;
}

function buildMergedAttackLogs(mainFight: FightPerformance, opposingFight: FightPerformance) {
  const mainFightLogs = wrapLogs(mainFight);
  const opposingFightLogs = wrapLogs(opposingFight);
  const tickOffset = determineTickOffset(mainFightLogs, opposingFightLogs);

  if (tickOffset == null) {
    return null;
  }

  for (const log of opposingFightLogs) {
    log.entry.T = (log.entry.T ?? 0) + tickOffset;
  }

  const competitorPairs: MergedAttackPair[] = [];
  const opponentPairs: MergedAttackPair[] = [];

  for (const log of mainFightLogs) {
    if (log.attackerName !== mainFight.c.n) {
      continue;
    }

    if (log.entry.f) {
      const matchingDefenderLog = opposingFightLogs.find(
        (candidate) => !candidate.entry.f
          && candidate.attackerName === mainFight.o.n
          && candidate.entry.T === log.entry.T,
      );

      if (matchingDefenderLog) {
        competitorPairs.push({
          attackLog: cloneFight(log.entry),
          defenderLog: cloneFight(matchingDefenderLog.entry),
        });
      }
      continue;
    }

    const matchingAttackerLog = opposingFightLogs.find(
      (candidate) => candidate.entry.f
        && candidate.attackerName === mainFight.o.n
        && candidate.entry.T === log.entry.T,
    );

    if (matchingAttackerLog) {
      opponentPairs.push({
        attackLog: cloneFight(matchingAttackerLog.entry),
        defenderLog: cloneFight(log.entry),
      });
    }
  }

  if (competitorPairs.length === 0 && opponentPairs.length === 0) {
    return null;
  }

  competitorPairs.sort((left, right) => sortByTickAndTime(left.attackLog, right.attackLog));
  opponentPairs.sort((left, right) => sortByTickAndTime(left.attackLog, right.attackLog));
  return { competitorPairs, opponentPairs };
}

function mergeFighterFromLogs(
  fight: FightPerformance,
  self: Fighter,
  mirror: Fighter | null | undefined,
  pairs: MergedAttackPair[],
  itemStatsById: Record<number, ItemStatsLike>,
): Fighter {
  const recalculatedLogs = pairs.map(({ attackLog, defenderLog }) => {
    const recalculated = recalculateMergedEntry(fight, attackLog, defenderLog, itemStatsById);
    return {
      ...attackLog,
      d: recalculated.expectedDamage,
      a: recalculated.accuracy,
      l: recalculated.minHit,
      h: recalculated.maxHit,
    };
  });
  const expectedDamage = recalculatedLogs.reduce((total, entry) => total + (entry.d ?? 0), 0);
  const damageDealt = recalculatedLogs.reduce((total, entry) => total + (entry.aD ?? 0), 0);
  const totalMagicAttacks = recalculatedLogs.filter((entry) => isMagicStyle(entry.m)).length;
  const magicExpectedHits = recalculatedLogs
    .filter((entry) => isMagicStyle(entry.m))
    .reduce((total, entry) => total + (entry.a ?? 0), 0);
  const successfulOffPray = recalculatedLogs.filter((entry) => wasSuccessful(entry)).length;
  const successfulOffensivePrayers = recalculatedLogs.filter((entry) => usedSuccessfulOffensivePrayer(entry)).length;
  return {
    ...self,
    a: recalculatedLogs.length > 0 ? recalculatedLogs.length : Math.max(self.a, mirror?.a ?? 0),
    s: recalculatedLogs.length > 0 ? successfulOffPray : Math.max(self.s, mirror?.s ?? 0),
    d: recalculatedLogs.length > 0 ? expectedDamage : Math.max(self.d, mirror?.d ?? 0),
    h: recalculatedLogs.length > 0 ? damageDealt : Math.max(self.h, mirror?.h ?? 0),
    z: recalculatedLogs.length > 0 ? totalMagicAttacks : Math.max(self.z, mirror?.z ?? 0),
    m: Math.max(self.m, mirror?.m ?? 0),
    M: recalculatedLogs.length > 0 ? magicExpectedHits : Math.max(self.M, mirror?.M ?? 0),
    p: recalculatedLogs.length > 0 ? successfulOffensivePrayers : Math.max(self.p, mirror?.p ?? 0),
    g: Math.max(self.g, mirror?.g ?? 0),
    y: Math.max(self.y, mirror?.y ?? 0),
    H: Math.max(self.H, mirror?.H ?? 0),
    rh: Math.max(self.rh, mirror?.rh ?? 0),
    x: self.x || Boolean(mirror?.x),
    l: recalculatedLogs.length > 0 ? recalculatedLogs : cloneFight(self.l ?? []),
  };
}

export function mergeFightPair(
  primary: FightPerformance,
  secondary: FightPerformance | null,
  itemStatsById: Record<number, ItemStatsLike>,
): FightPerformance {
  const primaryClone = cloneFight(primary);

  if (!secondary) {
    return primaryClone;
  }

  const secondaryClone = cloneFight(secondary);
  if (!areOpposingPovs(primaryClone, secondaryClone)) {
    return primaryClone;
  }

  const mergedLogs = buildMergedAttackLogs(primaryClone, secondaryClone);
  const competitorPairs = mergedLogs?.competitorPairs ?? [];
  const opponentPairs = mergedLogs?.opponentPairs ?? [];

  return {
    c: mergeFighterFromLogs(primaryClone, primaryClone.c, secondaryClone.o, competitorPairs, itemStatsById),
    o: mergeFighterFromLogs(primaryClone, secondaryClone.c, primaryClone.o, opponentPairs, itemStatsById),
    t: Math.max(primaryClone.t, secondaryClone.t),
    fightID: primaryClone.fightID,
    l: primaryClone.l,
    w: primaryClone.w,
  };
}
