import type { CombatLevels, FightLogEntry, FightPerformance } from "@/src/types/fights";

export type ItemStatsLike = {
  stab_attack?: number | string | null;
  slash_attack?: number | string | null;
  crush_attack?: number | string | null;
  magic_attack?: number | string | null;
  ranged_attack?: number | string | null;
  stab_defence?: number | string | null;
  slash_defence?: number | string | null;
  crush_defence?: number | string | null;
  magic_defence?: number | string | null;
  ranged_defence?: number | string | null;
  strength?: number | string | null;
  ranged_strength?: number | string | null;
  magic_damage?: number | string | null;
};

type AmmoData = {
  name: string;
  itemId: number;
  rangeStr: number;
  dmgModifier: number;
  specRangeLevelModifier?: number;
  specChance?: number;
};

type VoidStyle = {
  accuracyModifier: number;
  dmgModifier: number;
};

type CalcResult = {
  expectedDamage: number;
  accuracy: number;
  minHit: number;
  maxHit: number;
};

type ResolvedCalcConfig = {
  boltChoice: string;
  strongBoltChoice: string;
  bpDartChoice: string;
  dlongIsVls: boolean;
};

const PLAYER_COMPOSITION_ITEM_OFFSET = 2048;
const SLOT_HEAD = 0;
const SLOT_WEAPON = 3;
const SLOT_TORSO = 4;
const SLOT_SHIELD = 5;
const SLOT_LEGS = 7;
const SLOT_HANDS = 9;

const STAB_ATTACK = 0;
const SLASH_ATTACK = 1;
const CRUSH_ATTACK = 2;
const MAGIC_ATTACK = 3;
const RANGE_ATTACK = 4;
const STAB_DEF = 5;
const SLASH_DEF = 6;
const CRUSH_DEF = 7;
const MAGIC_DEF = 8;
const RANGE_DEF = 9;
const STRENGTH_BONUS = 10;
const RANGE_STRENGTH = 11;
const MAGIC_DAMAGE = 12;

const STANCE_BONUS = 0;
const UNSUCCESSFUL_PRAY_DMG_MODIFIER = 0.6;
const ELYSIAN_DAMAGE_MULTIPLIER = 0.75;
const STAFF_MELEE_DAMAGE_MULTIPLIER = 0.5;
const PIETY_ATK_PRAYER_MODIFIER = 1.2;
const PIETY_STR_PRAYER_MODIFIER = 1.23;
const AUGURY_OFFENSIVE_PRAYER_MODIFIER = 1.25;
const RIGOUR_OFFENSIVE_PRAYER_DMG_MODIFIER = 1.23;
const RIGOUR_OFFENSIVE_PRAYER_ATTACK_MODIFIER = 1.2;
const PIETY_DEF_PRAYER_MODIFIER = 1.25;
const AUGURY_DEF_PRAYER_MODIFIER = 1.25;
const AUGURY_MAGEDEF_PRAYER_MODIFIER = 1.25;
const RIGOUR_DEF_PRAYER_MODIFIER = 1.25;
const BALLISTA_SPEC_ACCURACY_MODIFIER = 1.25;
const BALLISTA_SPEC_DMG_MODIFIER = 1.25;
const ACB_SPEC_ACCURACY_MODIFIER = 2;
const DBOW_DMG_MODIFIER = 2;
const DBOW_SPEC_DMG_MODIFIER = 3;
const DBOW_SPEC_MIN_HIT = 16;
const DBOW_SPEC_MAX_HIT_PER_ARROW = 48;
const DRAGON_CBOW_SPEC_DMG_MODIFIER = 1.2;
const DDS_SPEC_ACCURACY_MODIFIER = 1.25;
const DDS_SPEC_DMG_MODIFIER = 2.3;
const ARMA_GS_SPEC_ACCURACY_MODIFIER = 2;
const ARMA_GS_SPEC_DMG_MODIFIER = 1.375;
const ANCIENT_GS_SPEC_ACCURACY_MODIFIER = 2;
const FANG_SPEC_ACCURACY_MODIFIER = 1.5;
const ANCIENT_GS_SPEC_DMG_MODIFIER = 1.1;
const ANCIENT_GS_FIXED_DAMAGE = 25;
const VLS_SPEC_DMG_MODIFIER = 1.2;
const VLS_SPEC_MIN_DMG_MODIFIER = 0.2;
const VLS_SPEC_DEFENCE_SCALE = 0.25;
const SWH_SPEC_DMG_MODIFIER = 1.25;
const SWH_SPEC_MIN_DMG_MODIFIER = 0.25;
const DWH_SPEC_DMG_MODIFIER = 1.5;
const VOIDWAKER_SPEC_DMG_MODIFIER = 1.5;
const VOIDWAKER_SPEC_MIN_DMG_MODIFIER = 0.5;
const VOIDWAKER_FIXED_ACCURACY = 1;
const ABYSSAL_DAGGER_SPEC_ACCURACY_MODIFIER = 1.25;
const ABYSSAL_DAGGER_SPEC_DMG_MODIFIER = 0.85;
const ARKAN_BLADE_SPEC_ACCURACY_MODIFIER = 1.5;
const ARKAN_BLADE_SPEC_DMG_MODIFIER = 1.5;
const BRIMSTONE_RING_OPPONENT_DEF_MODIFIER = 0.975;
const SMOKE_BATTLESTAFF_DMG_ACC_MODIFIER = 1.1;
const TOME_OF_FIRE_DMG_MODIFIER = 1.5;
const VOLATILE_NIGHTMARE_STAFF_ACC_MODIFIER = 0.5;

const SUCCESSFUL_OFFENSIVE_PRAYERS = {
  melee: new Set([125, 946]),
  ranged: new Set([504, 1420]),
  magic: new Set([505, 1421]),
};

const AUGURY_SPRITES = new Set([1421]);

const DEFAULT_CALC_CONFIG: ResolvedCalcConfig = {
  boltChoice: "DIAMOND_BOLTS_E",
  strongBoltChoice: "DIAMOND_DRAGON_BOLTS_E",
  bpDartChoice: "DRAGON_DARTS",
  dlongIsVls: true,
};

const VOID_STYLES: Record<string, VoidStyle> = {
  VOID_MELEE: { accuracyModifier: 1.1, dmgModifier: 1.1 },
  VOID_RANGE: { accuracyModifier: 1.1, dmgModifier: 1.1 },
  VOID_MAGE: { accuracyModifier: 1.45, dmgModifier: 1 },
  VOID_ELITE_MELEE: { accuracyModifier: 1.1, dmgModifier: 1.1 },
  VOID_ELITE_RANGE: { accuracyModifier: 1.125, dmgModifier: 1.125 },
  VOID_ELITE_MAGE: { accuracyModifier: 1.45, dmgModifier: 1.025 },
  NONE: { accuracyModifier: 1, dmgModifier: 1 },
};

const RING_ITEM_IDS: Record<string, number> = {
  SEERS_RING: 6731,
  ARCHERS_RING: 6733,
  BERSERKER_RING: 6737,
  RING_OF_SUFFERING: 20657,
  SEERS_RING_I: 11770,
  ARCHERS_RING_I: 11771,
  BERSERKER_RING_I: 11773,
  RING_OF_SUFFERING_I: 20655,
  BRIMSTONE_RING: 22975,
  MAGUS_RING: 28313,
  VENATOR_RING: 28310,
  BELLATOR_RING: 28316,
  ULTOR_RING: 28307,
  RING_OF_SHADOWS: 25336,
  NONE: -1,
};

const BOLT_AMMO: Record<string, AmmoData> = {
  RUNITE_BOLTS: { name: "RUNITE_BOLTS", itemId: 9169, rangeStr: 115, dmgModifier: 1 },
  DRAGONSTONE_BOLTS_E: {
    name: "DRAGONSTONE_BOLTS_E",
    itemId: 9281,
    rangeStr: 117,
    dmgModifier: 1,
    specRangeLevelModifier: 0.2,
    specChance: 0.06,
  },
  DIAMOND_BOLTS_E: { name: "DIAMOND_BOLTS_E", itemId: 9277, rangeStr: 105, dmgModifier: 1.015 },
  DRAGONSTONE_DRAGON_BOLTS_E: {
    name: "DRAGONSTONE_DRAGON_BOLTS_E",
    itemId: 1668,
    rangeStr: 122,
    dmgModifier: 1,
    specRangeLevelModifier: 0.2,
    specChance: 0.06,
  },
  OPAL_DRAGON_BOLTS_E: {
    name: "OPAL_DRAGON_BOLTS_E",
    itemId: 8729,
    rangeStr: 122,
    dmgModifier: 1,
    specRangeLevelModifier: 0.1,
    specChance: 0.05,
  },
  DIAMOND_DRAGON_BOLTS_E: { name: "DIAMOND_DRAGON_BOLTS_E", itemId: 1690, rangeStr: 122, dmgModifier: 1.015 },
  ADAMANT_DARTS: { name: "ADAMANT_DARTS", itemId: 810, rangeStr: 10, dmgModifier: 1 },
  RUNE_DARTS: { name: "RUNE_DARTS", itemId: 811, rangeStr: 14, dmgModifier: 1 },
  DRAGON_DARTS: { name: "DRAGON_DARTS", itemId: 11230, rangeStr: 20, dmgModifier: 1 },
  AMETHYST_ARROWS: { name: "AMETHYST_ARROWS", itemId: 21326, rangeStr: 55, dmgModifier: 1 },
  DRAGON_ARROW: { name: "DRAGON_ARROW", itemId: 11212, rangeStr: 60, dmgModifier: 1 },
  DRAGON_JAVELIN: { name: "DRAGON_JAVELIN", itemId: 19484, rangeStr: 150, dmgModifier: 1 },
  BOLT_RACK: { name: "BOLT_RACK", itemId: 4740, rangeStr: 55, dmgModifier: 1 },
  MOONLIGHT_ANTLER_BOLTS: { name: "MOONLIGHT_ANTLER_BOLTS", itemId: 28878, rangeStr: 60, dmgModifier: 1 },
};

const CANONICAL_WEAPON_IDS: Record<string, number[]> = {
  DRAGON_CROSSBOW: [21902, 21012],
  KARILS_CROSSBOW: [4734, 4934, 4935, 4936, 4937, 4938],
  HUNTERS_SUNLIGHT_CROSSBOW: [28794],
  DRAGON_HUNTER_CROSSBOW: [21012, 21000],
  MAGIC_SHORTBOW: [861],
  MAGIC_SHORTBOW_I: [12788],
  SCORCHING_BOW: [29591],
  TOXIC_BLOWPIPE: [12926],
  VOLATILE_NIGHTMARE_STAFF: [24424],
  SMOKE_BATTLESTAFF: [11998],
  CRYSTAL_BOW: [4212, 4214, 4215, 4216, 4217, 4218, 4219, 4220, 4221, 4222, 4223],
  CRYSTAL_BOW_I: [11748, 11749, 11750, 11751, 11752, 11753, 11754, 11755, 11756, 11757, 11758],
  DRAGON_LONGSWORD: [1305],
  ARKAN_BLADE: [28195],
  RUNE_CROSSBOW: [9185, 23601],
  ARMADYL_CROSSBOW: [11785, 23611],
  DARK_BOW: [11235, 20408, 12765, 12766, 12767, 12768],
  HEAVY_BALLISTA: [19481, 23630],
  LIGHT_BALLISTA: [19478, 27188],
  STATIUS_WARHAMMER: [23620],
  VESTAS_LONGSWORD: [22613, 23615],
  ARMADYL_GODSWORD: [11802, 20593, 20368],
  DRAGON_CLAWS: [13652, 20784, 29577],
  DRAGON_DAGGER: [1215, 1231, 5680, 5698, 20407],
  GRANITE_MAUL: [4153, 12848, 24225, 24227],
  ELDER_MAUL: [21003, 24417, 27189],
  GHRAZI_RAPIER: [22324, 23628],
  ZURIELS_STAFF: [23617],
  STAFF_OF_THE_DEAD: [11791, 23613],
  KODAI_WAND: [21006, 23626],
  TOME_OF_FIRE: [20714, 27358],
  ZARYTE_CROSSBOW: [26374, 27186],
  DRAGON_WARHAMMER: [13576, 20785],
  VOIDWAKER: [27690, 27869, 30955],
  DUAL_MACUAHUITL: [29850],
  BLUE_MOON_SPEAR: [29849],
  ECLIPSE_ATLATL: [29851, 29000],
  BOW_OF_FAERDHINEN: [25865, 25867, 25869, 25884, 25886, 25888, 25890, 25892, 25894, 25896, 27187, 33021],
  OSMUMTENS_FANG: [26219, 27246, 33174],
  NOXIOUS_HALBERD: [33178, 29796],
  PURGING_STAFF: [33184, 29594],
  BURNING_CLAWS: [33200],
  ABYSSAL_DAGGER: [13265, 13267, 13269, 13271, 27861, 27863, 27865, 27867],
};

const ARMOR_IDS = {
  VOID_GLOVES: new Set([8842, 13073]),
  VOID_MAGE_HELM: new Set([11663, 13069]),
  VOID_RANGE_HELM: new Set([11664, 13071]),
  VOID_MELEE_HELM: new Set([11665, 13072]),
  VOID_BODY: new Set([8839, 13072]),
  VOID_LEGS: new Set([8840, 13073]),
  VOID_ELITE_BODY: new Set([19785, 13075]),
  VOID_ELITE_LEGS: new Set([19786, 13076]),
  CRYSTAL_HELM: new Set([23971, 33170]),
  CRYSTAL_BODY: new Set([23975, 33166]),
  CRYSTAL_LEGS: new Set([23979, 33168]),
};

const MAGIC_BASE_DAMAGE: Record<string, number> = {
  MAGIC_STANDARD_BIND: 0,
  MAGIC_STANDARD_STRIKE_BOLT_BLAST: 16,
  MAGIC_STANDARD_BIND_STAFF: 0,
  MAGIC_STANDARD_STRIKE_BOLT_BLAST_STAFF: 16,
  MAGIC_STANDARD_WAVE_STAFF: 20,
  MAGIC_STANDARD_SURGE_STAFF: 24,
  MAGIC_STANDARD_GOD_SPELL: 30,
  MAGIC_ANCIENT_SINGLE_TARGET: 26,
  MAGIC_ANCIENT_MULTI_TARGET: 30,
  MAGIC_VOLATILE_NIGHTMARE_STAFF_SPEC: 66,
};

function normalizeItemId(itemId?: number | null) {
  if (!itemId || itemId <= 0) {
    return 0;
  }
  return itemId > PLAYER_COMPOSITION_ITEM_OFFSET ? itemId - PLAYER_COMPOSITION_ITEM_OFFSET : itemId;
}

function numberValue(value?: number | string | null) {
  return Number(value ?? 0) || 0;
}

function getItemBonusArray(itemStatsById: Record<number, ItemStatsLike>, itemId: number) {
  const stats = itemStatsById[itemId];
  if (!stats) {
    return null;
  }
  return [
    numberValue(stats.stab_attack),
    numberValue(stats.slash_attack),
    numberValue(stats.crush_attack),
    numberValue(stats.magic_attack),
    numberValue(stats.ranged_attack),
    numberValue(stats.stab_defence),
    numberValue(stats.slash_defence),
    numberValue(stats.crush_defence),
    numberValue(stats.magic_defence),
    numberValue(stats.ranged_defence),
    numberValue(stats.strength),
    numberValue(stats.ranged_strength),
    numberValue(stats.magic_damage),
  ];
}

function addBonusArrays(target: number[], extra: number[] | null) {
  if (!extra) {
    return;
  }
  for (let i = 0; i < target.length; i += 1) {
    target[i] += extra[i] ?? 0;
  }
}

function getCanonicalWeaponName(itemId: number, dlongIsVls: boolean) {
  for (const [name, ids] of Object.entries(CANONICAL_WEAPON_IDS)) {
    if (ids.includes(itemId)) {
      if (name === "DRAGON_LONGSWORD" && dlongIsVls) {
        return "VESTAS_LONGSWORD";
      }
      return name;
    }
  }
  return dlongIsVls && itemId === 1305 ? "VESTAS_LONGSWORD" : null;
}

function getAttackStyle(entry: FightLogEntry) {
  const style = entry.m ?? "";
  if (style.startsWith("MAGIC") || style === "MELEE_VOIDWAKER_SPEC") return "MAGIC";
  if (style.startsWith("RANGED")) return "RANGED";
  if (style.includes("STAB")) return "STAB";
  if (style.includes("CRUSH") || style.includes("POUND") || style.includes("PUMMEL") || style.includes("SMASH")) return "CRUSH";
  return "SLASH";
}

function isSpecialAttack(entry: FightLogEntry) {
  return (entry.m ?? "").includes("SPEC");
}

function isStandardSpellbookSpell(style?: string | null) {
  return style === "MAGIC_STANDARD_STRIKE_BOLT_BLAST_STAFF"
    || style === "MAGIC_STANDARD_STRIKE_BOLT_BLAST"
    || style === "MAGIC_STANDARD_WAVE_STAFF"
    || style === "MAGIC_STANDARD_SURGE_STAFF";
}

function isFireSpell(style?: string | null) {
  return isStandardSpellbookSpell(style);
}

function getBaseSpellDamage(style?: string | null) {
  return MAGIC_BASE_DAMAGE[style ?? ""] ?? 0;
}

function getResolvedConfig(): ResolvedCalcConfig {
  return DEFAULT_CALC_CONFIG;
}

function getRingName(fightType: FightPerformance["l"], attackLog?: FightLogEntry | null) {
  if (attackLog?.R != null && attackLog.R > 0) {
    const ringName = Object.entries(RING_ITEM_IDS).find(([, itemId]) => itemId === attackLog.R)?.[0];
    if (ringName) {
      return ringName;
    }
  }
  return fightType.startsWith("LMS_") ? "BERSERKER_RING" : "BERSERKER_RING";
}

function getRingItemId(ringName: string) {
  return RING_ITEM_IDS[ringName] ?? RING_ITEM_IDS.BERSERKER_RING;
}

function getVoidStyle(gear: number[]) {
  const fixed = gear.map(normalizeItemId);
  const gloves = fixed[SLOT_HANDS];
  if (!ARMOR_IDS.VOID_GLOVES.has(gloves)) {
    return VOID_STYLES.NONE;
  }

  const helm = fixed[SLOT_HEAD];
  const torso = fixed[SLOT_TORSO];
  const legs = fixed[SLOT_LEGS];

  if (ARMOR_IDS.VOID_BODY.has(torso) && ARMOR_IDS.VOID_LEGS.has(legs)) {
    if (ARMOR_IDS.VOID_MAGE_HELM.has(helm)) return VOID_STYLES.VOID_MAGE;
    if (ARMOR_IDS.VOID_RANGE_HELM.has(helm)) return VOID_STYLES.VOID_RANGE;
    if (ARMOR_IDS.VOID_MELEE_HELM.has(helm)) return VOID_STYLES.VOID_MELEE;
  }

  if (ARMOR_IDS.VOID_ELITE_BODY.has(torso) && ARMOR_IDS.VOID_ELITE_LEGS.has(legs)) {
    if (ARMOR_IDS.VOID_MAGE_HELM.has(helm)) return VOID_STYLES.VOID_ELITE_MAGE;
    if (ARMOR_IDS.VOID_RANGE_HELM.has(helm)) return VOID_STYLES.VOID_ELITE_RANGE;
    if (ARMOR_IDS.VOID_MELEE_HELM.has(helm)) return VOID_STYLES.VOID_ELITE_MELEE;
  }

  return VOID_STYLES.NONE;
}

function getAmmoForWeapon(weaponName: string | null, config: ResolvedCalcConfig, isLmsFight: boolean): AmmoData | null {
  if (!weaponName) return null;

  if (weaponName === "RUNE_CROSSBOW") {
    return BOLT_AMMO[isLmsFight ? "DIAMOND_BOLTS_E" : config.boltChoice] ?? BOLT_AMMO.DIAMOND_BOLTS_E;
  }
  if (["ARMADYL_CROSSBOW", "DRAGON_CROSSBOW", "DRAGON_HUNTER_CROSSBOW", "ZARYTE_CROSSBOW"].includes(weaponName)) {
    return BOLT_AMMO[isLmsFight ? "DIAMOND_BOLTS_E" : config.strongBoltChoice] ?? BOLT_AMMO.DIAMOND_DRAGON_BOLTS_E;
  }
  if (weaponName === "TOXIC_BLOWPIPE") {
    return BOLT_AMMO[config.bpDartChoice] ?? BOLT_AMMO.DRAGON_DARTS;
  }
  if (weaponName === "HEAVY_BALLISTA" || weaponName === "LIGHT_BALLISTA") return BOLT_AMMO.DRAGON_JAVELIN;
  if (weaponName === "DARK_BOW" || weaponName === "SCORCHING_BOW") return BOLT_AMMO.DRAGON_ARROW;
  if (weaponName === "KARILS_CROSSBOW") return BOLT_AMMO.BOLT_RACK;
  if (weaponName === "HUNTERS_SUNLIGHT_CROSSBOW") return BOLT_AMMO.MOONLIGHT_ANTLER_BOLTS;
  if (weaponName === "MAGIC_SHORTBOW" || weaponName === "MAGIC_SHORTBOW_I") return BOLT_AMMO.AMETHYST_ARROWS;
  return null;
}

function getAmmoByItemId(itemId?: number | null) {
  if (!itemId || itemId <= 0) {
    return null;
  }
  return Object.values(BOLT_AMMO).find((ammo) => ammo.itemId === itemId) ?? null;
}

function getAmmoBonusMaxHit(ammo: AmmoData | null, rangeLevel: number) {
  if (!ammo?.specRangeLevelModifier || !ammo.specChance) {
    return 0;
  }
  return rangeLevel * ammo.specRangeLevelModifier * ammo.specChance;
}

function isDiamondOrOpalAmmo(ammo: AmmoData | null) {
  return ammo?.name === "DIAMOND_BOLTS_E"
    || ammo?.name === "DIAMOND_DRAGON_BOLTS_E"
    || ammo?.name === "OPAL_DRAGON_BOLTS_E";
}

function hasCrystalArmorBonus(weaponName: string | null, gear: number[]) {
  if (!["BOW_OF_FAERDHINEN", "CRYSTAL_BOW", "CRYSTAL_BOW_I"].includes(weaponName ?? "")) {
    return false;
  }
  const fixed = gear.map(normalizeItemId);
  return ARMOR_IDS.CRYSTAL_HELM.has(fixed[SLOT_HEAD])
    || ARMOR_IDS.CRYSTAL_BODY.has(fixed[SLOT_TORSO])
    || ARMOR_IDS.CRYSTAL_LEGS.has(fixed[SLOT_LEGS]);
}

function getCrystalDamageModifier(gear: number[]) {
  const fixed = gear.map(normalizeItemId);
  return 1
    + (ARMOR_IDS.CRYSTAL_HELM.has(fixed[SLOT_HEAD]) ? 0.025 : 0)
    + (ARMOR_IDS.CRYSTAL_BODY.has(fixed[SLOT_TORSO]) ? 0.075 : 0)
    + (ARMOR_IDS.CRYSTAL_LEGS.has(fixed[SLOT_LEGS]) ? 0.05 : 0);
}

function getCrystalAccuracyModifier(gear: number[]) {
  const fixed = gear.map(normalizeItemId);
  return 1
    + (ARMOR_IDS.CRYSTAL_HELM.has(fixed[SLOT_HEAD]) ? 0.05 : 0)
    + (ARMOR_IDS.CRYSTAL_BODY.has(fixed[SLOT_TORSO]) ? 0.15 : 0)
    + (ARMOR_IDS.CRYSTAL_LEGS.has(fixed[SLOT_LEGS]) ? 0.1 : 0);
}

function calculateBonuses(gear: number[] | undefined, itemStatsById: Record<number, ItemStatsLike>, ringItemId: number) {
  const bonuses = new Array(13).fill(0);
  if (ringItemId > 0) {
    addBonusArrays(bonuses, getItemBonusArray(itemStatsById, ringItemId));
  }
  for (const rawItemId of gear ?? []) {
    const itemId = normalizeItemId(rawItemId);
    if (itemId <= 0) continue;
    addBonusArrays(bonuses, getItemBonusArray(itemStatsById, itemId));
  }
  return bonuses;
}

function getWeaponNameFromGear(gear: number[] | undefined, dlongIsVls: boolean) {
  return getCanonicalWeaponName(normalizeItemId(gear?.[SLOT_WEAPON]), dlongIsVls);
}

function clampAccuracy(accuracy: number) {
  if (accuracy < 0) return 0;
  if (accuracy > 1) return 1;
  return accuracy;
}

function isSuccessfulOffensivePrayer(entry: FightLogEntry) {
  const style = getAttackStyle(entry);
  if (style === "MAGIC") return SUCCESSFUL_OFFENSIVE_PRAYERS.magic.has(entry.p);
  if (style === "RANGED") return SUCCESSFUL_OFFENSIVE_PRAYERS.ranged.has(entry.p);
  return SUCCESSFUL_OFFENSIVE_PRAYERS.melee.has(entry.p);
}

function successAgainstPrayer(entry: FightLogEntry) {
  if (getAttackStyle(entry) === "MAGIC") return entry.o !== "MAGIC";
  if (getAttackStyle(entry) === "RANGED") return entry.o !== "RANGED";
  return entry.o !== "MELEE";
}

function calculateAccuracy(attackerChance: number, defenderChance: number) {
  if (attackerChance > defenderChance) {
    return 1 - (defenderChance + 2) / (2 * (attackerChance + 1));
  }
  return attackerChance / (2 * (defenderChance + 1));
}

function calculateAverageHit(
  success: boolean,
  weaponName: string | null,
  usingSpec: boolean,
  accuracy: number,
  minHit: number,
  maxHit: number,
) {
  const prayerModifier = success ? 1 : UNSUCCESSFUL_PRAY_DMG_MODIFIER;
  let adjustedAccuracy = accuracy;
  let adjustedMinHit = minHit;
  let adjustedMaxHit = maxHit;
  let averageSuccessfulHit: number;

  const dbow = weaponName === "DARK_BOW";
  const claws = weaponName === "DRAGON_CLAWS";
  const fang = weaponName === "OSMUMTENS_FANG";
  const vls = weaponName === "VESTAS_LONGSWORD";
  const swh = weaponName === "STATIUS_WARHAMMER";
  const voidwaker = weaponName === "VOIDWAKER";
  const burningClaws = weaponName === "BURNING_CLAWS";

  if (usingSpec && (dbow || vls || swh)) {
    const accuracyAdjuster = dbow ? adjustedAccuracy : 1;
    adjustedMinHit = dbow ? DBOW_SPEC_MIN_HIT : 0;
    adjustedMinHit = vls ? Math.trunc(adjustedMaxHit * VLS_SPEC_MIN_DMG_MODIFIER) : adjustedMinHit;
    adjustedMinHit = swh ? Math.trunc(adjustedMaxHit * SWH_SPEC_MIN_DMG_MODIFIER) : adjustedMinHit;
    let total = 0;
    for (let i = 0; i <= adjustedMaxHit; i += 1) {
      total += i < adjustedMinHit ? adjustedMinHit / accuracyAdjuster : i;
    }
    averageSuccessfulHit = total / adjustedMaxHit;
  } else if (usingSpec && claws) {
    const invertedAccuracy = 1 - adjustedAccuracy;
    const averageSuccessfulRegularHit = adjustedMaxHit / 2;
    const higherModifierChance = adjustedAccuracy + (adjustedAccuracy * invertedAccuracy);
    const lowerModifierChance = (adjustedAccuracy * (invertedAccuracy ** 2)) + (adjustedAccuracy * (invertedAccuracy ** 3));
    const averageSpecialHit = ((higherModifierChance * 2) + (lowerModifierChance * 1.5)) * averageSuccessfulRegularHit;
    return {
      expectedDamage: averageSpecialHit * prayerModifier,
      accuracy: higherModifierChance + lowerModifierChance,
      minHit: adjustedMinHit,
      maxHit: adjustedMaxHit * 2 + 1,
    };
  } else if (burningClaws && usingSpec) {
    const baseMaxHit = adjustedMaxHit;
    const miss = 1 - adjustedAccuracy;
    const minD1 = Math.floor(0.75 * baseMaxHit);
    const maxD1 = Math.floor(1.75 * baseMaxHit);
    const avgTotalDmg1 = getAverageBurningClawDamage(minD1, maxD1);
    const minD2 = Math.floor(0.5 * baseMaxHit);
    const maxD2 = Math.floor(1.5 * baseMaxHit);
    const avgTotalDmg2 = getAverageBurningClawDamage(minD2, maxD2);
    const minD3 = Math.floor(0.25 * baseMaxHit);
    const maxD3 = Math.floor(1.25 * baseMaxHit);
    const avgTotalDmg3 = getAverageBurningClawDamage(minD3, maxD3);
    const avgTotalDmg4 = getAverageBurningClawDamage(0, Math.floor(baseMaxHit));
    const expectedDamage = (adjustedAccuracy * avgTotalDmg1)
      + (miss * adjustedAccuracy * avgTotalDmg2)
      + (miss * miss * adjustedAccuracy * avgTotalDmg3)
      + (miss * miss * miss * avgTotalDmg4);
    return {
      expectedDamage: expectedDamage * prayerModifier,
      accuracy: adjustedAccuracy,
      minHit: 0,
      maxHit: calculateBurningClawTotalDamage(maxD1),
    };
  } else if (fang) {
    const maxHitMultiplier = usingSpec ? 1 : 0.85;
    const invertedAccuracy = 1 - adjustedAccuracy;
    adjustedAccuracy = 1 - (invertedAccuracy ** 2);
    const base = adjustedMaxHit;
    adjustedMinHit = Math.ceil(base * 0.15);
    adjustedMaxHit = Math.ceil(maxHitMultiplier * base);
    averageSuccessfulHit = (adjustedMinHit + adjustedMaxHit) / 2;
  } else if (usingSpec && voidwaker) {
    adjustedMinHit = Math.floor((adjustedMaxHit / VOIDWAKER_SPEC_DMG_MODIFIER) * VOIDWAKER_SPEC_MIN_DMG_MODIFIER);
    averageSuccessfulHit = (adjustedMinHit + adjustedMaxHit) / 2;
  } else {
    averageSuccessfulHit = (adjustedMinHit + adjustedMaxHit) / 2;
    if (weaponName === "ABYSSAL_DAGGER" && usingSpec) {
      averageSuccessfulHit *= 2;
      adjustedMaxHit *= 2;
    }
  }

  let expectedDamage = adjustedAccuracy * averageSuccessfulHit * prayerModifier;
  if (usingSpec && weaponName === "ANCIENT_GODSWORD") {
    expectedDamage += ANCIENT_GS_FIXED_DAMAGE;
  }
  return {
    expectedDamage,
    accuracy: adjustedAccuracy,
    minHit: adjustedMinHit,
    maxHit: adjustedMaxHit,
  };
}

function calculateBurningClawTotalDamage(D: number) {
  return Math.floor(0.25 * D) + Math.floor(0.25 * D) + Math.floor(0.5 * D);
}

function getAverageBurningClawDamage(minD: number, maxD: number) {
  if (minD > maxD) return 0;
  let totalDamageSum = 0;
  for (let D = minD; D <= maxD; D += 1) {
    totalDamageSum += calculateBurningClawTotalDamage(D);
  }
  return totalDamageSum / (maxD - minD + 1);
}

function applyDamageMultiplier(result: CalcResult, multiplier: number) {
  if (multiplier === 1) {
    return result;
  }
  return {
    expectedDamage: result.expectedDamage * multiplier,
    accuracy: result.accuracy,
    minHit: Math.floor(result.minHit * multiplier),
    maxHit: Math.floor(result.maxHit * multiplier),
  };
}

export function collectFightItemIdsForMerge(primary: FightPerformance, secondary: FightPerformance | null) {
  const ids = new Set<number>();
  const fights = [primary, secondary].filter(Boolean) as FightPerformance[];
  for (const fight of fights) {
    for (const fighter of [fight.c, fight.o]) {
      for (const entry of fighter.l ?? []) {
        for (const itemId of entry.G ?? []) {
          const normalized = normalizeItemId(itemId);
          if (normalized > 0) ids.add(normalized);
        }
        for (const itemId of entry.g ?? []) {
          const normalized = normalizeItemId(itemId);
          if (normalized > 0) ids.add(normalized);
        }
      }
    }
    ids.add(getRingItemId(getRingName(fight.l)));
  }
  for (const ringId of Object.values(RING_ITEM_IDS)) {
    if (ringId > 0) ids.add(ringId);
  }
  return [...ids];
}

export function recalculateMergedEntry(
  fight: FightPerformance,
  attackLog: FightLogEntry,
  defenderLog: FightLogEntry,
  itemStatsById: Record<number, ItemStatsLike>,
): CalcResult {
  const config = getResolvedConfig();
  const ringName = getRingName(fight.l, attackLog);
  const ringItemId = getRingItemId(ringName);
  const attackerLevels: CombatLevels = attackLog.C ?? { a: 118, s: 118, d: 120, r: 112, m: 99, h: 99 };
  const defenderLevels: CombatLevels = defenderLog.C ?? { a: 118, s: 118, d: 120, r: 112, m: 99, h: 99 };
  const attackerGear = attackLog.G ?? [];
  const defenderGear = attackLog.g ?? [];
  const attackStyle = getAttackStyle(attackLog);
  const successfulOffensive = isSuccessfulOffensivePrayer(attackLog);
  const success = successAgainstPrayer(attackLog);
  const weaponName = getWeaponNameFromGear(attackerGear, config.dlongIsVls);
  const usingSpec = isSpecialAttack(attackLog);
  const voidStyle = getVoidStyle(attackerGear);
  const isLmsFight = fight.l.startsWith("LMS_");
  const playerStats = calculateBonuses(attackerGear, itemStatsById, ringItemId);
  const opponentStats = calculateBonuses(defenderGear, itemStatsById, ringItemId);
  const ammo = getAmmoByItemId(attackLog.A) ?? getAmmoForWeapon(weaponName, config, isLmsFight);
  const smokeBstaff = weaponName === "SMOKE_BATTLESTAFF";
  const tomeOfFire = normalizeItemId(attackerGear[SLOT_SHIELD]) === 20714 || normalizeItemId(attackerGear[SLOT_SHIELD]) === 27358;

  let accuracy = 0;
  const minHit = 0;
  let maxHit = 0;

  if (attackStyle === "STAB" || attackStyle === "SLASH" || attackStyle === "CRUSH") {
    const effectiveLevel = Math.floor((attackerLevels.s * (successfulOffensive ? PIETY_STR_PRAYER_MODIFIER : 1)) + 8 + 3);
    const meleeVoid = voidStyle === VOID_STYLES.VOID_ELITE_MELEE || voidStyle === VOID_STYLES.VOID_MELEE;
    const adjustedEffectiveLevel = meleeVoid ? effectiveLevel * voidStyle.dmgModifier : effectiveLevel;
    const baseDamage = Math.floor(0.5 + (adjustedEffectiveLevel * (playerStats[STRENGTH_BONUS] + 64) / 640));
    const damageModifier =
      weaponName === "ARMADYL_GODSWORD" && usingSpec ? ARMA_GS_SPEC_DMG_MODIFIER
        : weaponName === "ANCIENT_GODSWORD" && usingSpec ? ANCIENT_GS_SPEC_DMG_MODIFIER
          : weaponName === "STATIUS_WARHAMMER" && usingSpec ? SWH_SPEC_DMG_MODIFIER
            : weaponName === "DRAGON_DAGGER" && usingSpec ? DDS_SPEC_DMG_MODIFIER
              : weaponName === "VESTAS_LONGSWORD" && usingSpec ? VLS_SPEC_DMG_MODIFIER
                : weaponName === "DRAGON_WARHAMMER" && usingSpec ? DWH_SPEC_DMG_MODIFIER
                  : weaponName === "VOIDWAKER" && usingSpec ? VOIDWAKER_SPEC_DMG_MODIFIER
                    : weaponName === "ABYSSAL_DAGGER" && usingSpec ? ABYSSAL_DAGGER_SPEC_DMG_MODIFIER
                      : weaponName === "ARKAN_BLADE" && usingSpec ? ARKAN_BLADE_SPEC_DMG_MODIFIER
                        : 1;
    maxHit = Math.trunc(damageModifier * baseDamage);

    if (weaponName === "VOIDWAKER" && usingSpec) {
      accuracy = VOIDWAKER_FIXED_ACCURACY;
    } else {
      const attackBonus = attackStyle === "STAB" ? playerStats[STAB_ATTACK] : attackStyle === "SLASH" ? playerStats[SLASH_ATTACK] : playerStats[CRUSH_ATTACK];
      const targetDefenceBonus = attackStyle === "STAB" ? opponentStats[STAB_DEF] : attackStyle === "SLASH" ? opponentStats[SLASH_DEF] : opponentStats[CRUSH_DEF];
      let effectiveLevelPlayer = Math.floor(((attackerLevels.a * (successfulOffensive ? PIETY_ATK_PRAYER_MODIFIER : 1)) + STANCE_BONUS) + 8);
      if (meleeVoid) {
        effectiveLevelPlayer *= voidStyle.accuracyModifier;
      }
      let baseChance = Math.floor(effectiveLevelPlayer * (attackBonus + 64));
      const accuracyModifier =
        weaponName === "DRAGON_DAGGER" ? DDS_SPEC_ACCURACY_MODIFIER
          : weaponName === "ARMADYL_GODSWORD" ? ARMA_GS_SPEC_ACCURACY_MODIFIER
            : weaponName === "ANCIENT_GODSWORD" ? ANCIENT_GS_SPEC_ACCURACY_MODIFIER
              : weaponName === "OSMUMTENS_FANG" ? FANG_SPEC_ACCURACY_MODIFIER
                : weaponName === "ARKAN_BLADE" ? ARKAN_BLADE_SPEC_ACCURACY_MODIFIER
                  : 1;
      if (usingSpec && weaponName !== "ABYSSAL_DAGGER") {
        baseChance *= accuracyModifier;
      }
      if (weaponName === "ABYSSAL_DAGGER" && usingSpec) {
        baseChance *= ABYSSAL_DAGGER_SPEC_ACCURACY_MODIFIER;
      }
      const effectiveLevelTarget = Math.floor(((defenderLevels.d * PIETY_DEF_PRAYER_MODIFIER) + STANCE_BONUS) + 8);
      const defenderChance = weaponName === "VESTAS_LONGSWORD" && usingSpec
        ? Math.floor((effectiveLevelTarget * (opponentStats[STAB_DEF] + 64)) * VLS_SPEC_DEFENCE_SCALE)
        : Math.floor(effectiveLevelTarget * (targetDefenceBonus + 64));
      accuracy = calculateAccuracy(baseChance, defenderChance);
    }
  } else if (attackStyle === "RANGED") {
    const ammoStrength = ammo?.rangeStr ?? 0;
    const rangeStrength = playerStats[RANGE_STRENGTH] + ammoStrength;
    let effectiveLevel = Math.floor((attackerLevels.r * (successfulOffensive ? RIGOUR_OFFENSIVE_PRAYER_DMG_MODIFIER : 1)) + 8);
    const rangeVoid = voidStyle === VOID_STYLES.VOID_ELITE_RANGE || voidStyle === VOID_STYLES.VOID_RANGE;
    if (rangeVoid) {
      effectiveLevel *= voidStyle.dmgModifier;
    }
    let baseDamage = Math.floor(0.5 + (effectiveLevel * (rangeStrength + 64) / 640));
    let modifier = ammo?.dmgModifier ?? 1;
    modifier = (weaponName === "HEAVY_BALLISTA" || weaponName === "LIGHT_BALLISTA") && usingSpec ? BALLISTA_SPEC_DMG_MODIFIER : modifier;
    modifier = weaponName === "DARK_BOW" && !usingSpec ? DBOW_DMG_MODIFIER : modifier;
    modifier = weaponName === "DARK_BOW" && usingSpec ? DBOW_SPEC_DMG_MODIFIER : modifier;
    modifier = weaponName === "DRAGON_CROSSBOW" && usingSpec ? DRAGON_CBOW_SPEC_DMG_MODIFIER : modifier;

    if (weaponName === "ECLIPSE_ATLATL") {
      const playerStatsWithRing = calculateBonuses(attackerGear, itemStatsById, ringItemId);
      effectiveLevel = Math.floor(((attackerLevels.s * (successfulOffensive ? RIGOUR_OFFENSIVE_PRAYER_DMG_MODIFIER : 1)) + STANCE_BONUS) + 8);
      if (rangeVoid) {
        effectiveLevel *= voidStyle.dmgModifier;
      }
      baseDamage = Math.floor(0.5 + (effectiveLevel * (playerStatsWithRing[STRENGTH_BONUS] + 64) / 640));
      maxHit = baseDamage;
    } else {
      maxHit = ammo ? Math.trunc((modifier * baseDamage) + getAmmoBonusMaxHit(ammo, attackerLevels.r)) : Math.trunc(modifier * baseDamage);
    }

    if (hasCrystalArmorBonus(weaponName, attackerGear)) {
      maxHit *= getCrystalDamageModifier(attackerGear);
    }
    if (weaponName === "DARK_BOW" && usingSpec) {
      maxHit = Math.min(maxHit, DBOW_SPEC_MAX_HIT_PER_ARROW * 2);
    }

    let stanceBonus = STANCE_BONUS;
    if (weaponName === "DARK_BOW" && usingSpec) {
      stanceBonus += 3;
    }
    let effectiveLevelPlayer = Math.floor(((attackerLevels.r * (successfulOffensive ? RIGOUR_OFFENSIVE_PRAYER_ATTACK_MODIFIER : 1)) + stanceBonus) + 8);
    if (rangeVoid) {
      effectiveLevelPlayer *= voidStyle.accuracyModifier;
    }
    if (hasCrystalArmorBonus(weaponName, attackerGear)) {
      effectiveLevelPlayer *= getCrystalAccuracyModifier(attackerGear);
    }
    const rangeModifier = Math.floor(effectiveLevelPlayer * (playerStats[RANGE_ATTACK] + 64));
    const attackerChance = usingSpec
      ? Math.floor(rangeModifier * (weaponName === "ARMADYL_CROSSBOW" ? ACB_SPEC_ACCURACY_MODIFIER : (weaponName === "HEAVY_BALLISTA" || weaponName === "LIGHT_BALLISTA") ? BALLISTA_SPEC_ACCURACY_MODIFIER : 1))
      : rangeModifier;
    const effectiveLevelTarget = Math.floor(((defenderLevels.d * RIGOUR_DEF_PRAYER_MODIFIER) + STANCE_BONUS) + 8);
    const defenderChance = Math.floor(effectiveLevelTarget * (opponentStats[RANGE_DEF] + 64));
    accuracy = calculateAccuracy(attackerChance, defenderChance);
    if (isDiamondOrOpalAmmo(ammo) && !(weaponName === "DRAGON_CROSSBOW" && usingSpec)) {
      accuracy = (accuracy * 0.95) + 0.05;
    }
  } else {
    let magicBonus = 1 + (playerStats[MAGIC_DAMAGE] / 100);
    if (smokeBstaff && isStandardSpellbookSpell(attackLog.m)) {
      magicBonus *= SMOKE_BATTLESTAFF_DMG_ACC_MODIFIER;
    }
    if (tomeOfFire && isFireSpell(attackLog.m)) {
      magicBonus *= TOME_OF_FIRE_DMG_MODIFIER;
    }
    const mageVoid = voidStyle === VOID_STYLES.VOID_ELITE_MAGE || voidStyle === VOID_STYLES.VOID_MAGE;
    if (mageVoid) {
      magicBonus *= voidStyle.dmgModifier;
    }
    maxHit = Math.trunc(getBaseSpellDamage(attackLog.m) * magicBonus);

    let effectiveLevelPlayer = Math.floor((attackerLevels.m * (successfulOffensive ? AUGURY_OFFENSIVE_PRAYER_MODIFIER : 1)) + 8);
    if (mageVoid) {
      effectiveLevelPlayer *= voidStyle.accuracyModifier;
    }
    const attackerChance = Math.floor(effectiveLevelPlayer * (playerStats[MAGIC_ATTACK] + 64));
    const effectiveLevelTarget = Math.floor(((defenderLevels.d * AUGURY_DEF_PRAYER_MODIFIER) + STANCE_BONUS) + 8);
    const defensiveAugurySuccess = AUGURY_SPRITES.has(defenderLog.p);
    const effectiveMagicLevelTarget = Math.floor((defenderLevels.m * (defensiveAugurySuccess ? AUGURY_MAGEDEF_PRAYER_MODIFIER : 1)) * 0.7);
    const reducedDefenceLevelTarget = Math.floor(effectiveLevelTarget * 0.3);
    const effectiveMagicDefenceTarget = effectiveMagicLevelTarget + reducedDefenceLevelTarget;
    const ringIsBrimstone = ringName === "BRIMSTONE_RING";
    const defenderChance = ringIsBrimstone
      ? Math.floor(effectiveMagicDefenceTarget * ((BRIMSTONE_RING_OPPONENT_DEF_MODIFIER * opponentStats[MAGIC_DEF]) + 64))
      : Math.floor(effectiveMagicDefenceTarget * (opponentStats[MAGIC_DEF] + 64));
    accuracy = calculateAccuracy(attackerChance, defenderChance);
    if (smokeBstaff && isStandardSpellbookSpell(attackLog.m)) {
      accuracy *= SMOKE_BATTLESTAFF_DMG_ACC_MODIFIER;
    } else if (weaponName === "VOLATILE_NIGHTMARE_STAFF" && attackLog.m === "MAGIC_VOLATILE_NIGHTMARE_STAFF_SPEC") {
      accuracy *= VOLATILE_NIGHTMARE_STAFF_ACC_MODIFIER;
    }
  }

  let result = calculateAverageHit(success, weaponName, usingSpec, clampAccuracy(accuracy), minHit, maxHit);
  if (attackLog.E) {
    result = applyDamageMultiplier(result, ELYSIAN_DAMAGE_MULTIPLIER);
  }
  if (attackLog.S && (attackStyle === "STAB" || attackStyle === "SLASH" || attackStyle === "CRUSH")) {
    result = applyDamageMultiplier(result, STAFF_MELEE_DAMAGE_MULTIPLIER);
  }
  return {
    expectedDamage: result.expectedDamage,
    accuracy: clampAccuracy(result.accuracy),
    minHit: Math.trunc(result.minHit * (success ? 1 : UNSUCCESSFUL_PRAY_DMG_MODIFIER)),
    maxHit: Math.trunc(result.maxHit * (success ? 1 : UNSUCCESSFUL_PRAY_DMG_MODIFIER)),
  };
}
