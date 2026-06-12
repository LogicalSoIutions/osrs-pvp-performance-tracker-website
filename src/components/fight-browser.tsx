"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./fight-browser.module.css";
import type { FightDetail, FightLogEntry, FightPerformance, FightSummary, PlayerSummary, DashboardStats, PlayerStats } from "@/src/types/fights";
import { WEAPON_IMAGES_BY_ITEM_ID } from "@/src/lib/weapon-images";

const number0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const HIDDEN_RSN = "Hidden";

function isHiddenRsn(name: string) {
  return name === HIDDEN_RSN;
}
const number1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const number2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const percent1 = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const OSRS_TICK_MS = 600;

type IconDefinition = {
  alt: string;
  label: string;
  src: string;
};

type WeaponFamily =
  | "2h_sword"
  | "bladed_staff"
  | "bludgeon"
  | "blunt"
  | "bow"
  | "claw"
  | "crossbow"
  | "polearm"
  | "powered_staff"
  | "powered_wand"
  | "slash_sword"
  | "spear"
  | "stab_sword"
  | "staff"
  | "thrown"
  | "whip";

type CombatStyleKey = "stab" | "slash" | "crush" | "ranged" | "magic";

const PLAYER_COMPOSITION_ITEM_OFFSET = 2048;
const WEAPON_SLOT_INDEX = 3;

const ATTACK_STYLE_ICONS: Record<string, IconDefinition> = {
  STAB: { src: "/CombatStyles_stab_sword_stab.png", alt: "Stab", label: "Stab" },
  SLASH: { src: "/CombatStyles_slash_sword_slash.png", alt: "Slash", label: "Slash" },
  CRUSH: { src: "/CombatStyles_blunt_pound.png", alt: "Crush", label: "Crush" },
  RANGED: { src: "/Ranged_icon.png", alt: "Ranged", label: "Ranged" },
  MAGIC: { src: "/Magic_icon.png", alt: "Magic", label: "Magic" },
  UNKNOWN: { src: "/Attack_icon.png", alt: "Attack", label: "Attack" },
};

const WEAPON_STYLE_ICONS: Record<WeaponFamily, Record<CombatStyleKey, IconDefinition>> = {
  "2h_sword": {
    stab: { src: "/CombatStyles_2h_sword_chop.png", alt: "2h sword stab style", label: "2h sword stab" },
    slash: { src: "/CombatStyles_2h_sword_slash.png", alt: "2h sword slash style", label: "2h sword slash" },
    crush: { src: "/CombatStyles_2h_sword_smash.png", alt: "2h sword crush style", label: "2h sword crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  bladed_staff: {
    stab: { src: "/CombatStyles_bladed_staff_jab.png", alt: "Bladed staff stab style", label: "Bladed staff stab" },
    slash: { src: "/CombatStyles_bladed_staff_swipe.png", alt: "Bladed staff slash style", label: "Bladed staff slash" },
    crush: { src: "/CombatStyles_bladed_staff_fend.png", alt: "Bladed staff crush style", label: "Bladed staff crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: { src: "/CombatStyles_bladed_staff_spell.png", alt: "Bladed staff magic style", label: "Bladed staff magic" },
  },
  bludgeon: {
    stab: { src: "/CombatStyles_bludgeon_pummel.png", alt: "Bludgeon stab style", label: "Bludgeon stab" },
    slash: { src: "/CombatStyles_bludgeon_pummel.png", alt: "Bludgeon slash style", label: "Bludgeon slash" },
    crush: { src: "/CombatStyles_bludgeon_smash.png", alt: "Bludgeon crush style", label: "Bludgeon crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  blunt: {
    stab: { src: "/CombatStyles_blunt_pummel.png", alt: "Blunt stab style", label: "Blunt stab" },
    slash: { src: "/CombatStyles_blunt_pummel.png", alt: "Blunt slash style", label: "Blunt slash" },
    crush: { src: "/CombatStyles_blunt_pound.png", alt: "Blunt crush style", label: "Blunt crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  bow: {
    stab: ATTACK_STYLE_ICONS.STAB,
    slash: ATTACK_STYLE_ICONS.SLASH,
    crush: ATTACK_STYLE_ICONS.CRUSH,
    ranged: { src: "/CombatStyles_bow_accurate.png", alt: "Bow ranged style", label: "Bow ranged" },
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  claw: {
    stab: { src: "/CombatStyles_claw_lunge.png", alt: "Claw stab style", label: "Claw stab" },
    slash: { src: "/CombatStyles_claw_slash.png", alt: "Claw slash style", label: "Claw slash" },
    crush: { src: "/CombatStyles_claw_chop.png", alt: "Claw crush style", label: "Claw crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  crossbow: {
    stab: ATTACK_STYLE_ICONS.STAB,
    slash: ATTACK_STYLE_ICONS.SLASH,
    crush: ATTACK_STYLE_ICONS.CRUSH,
    ranged: { src: "/CombatStyles_crossbow_accurate.png", alt: "Crossbow ranged style", label: "Crossbow ranged" },
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  polearm: {
    stab: { src: "/CombatStyles_polearm_jab.png", alt: "Polearm stab style", label: "Polearm stab" },
    slash: { src: "/CombatStyles_polearm_swipe.png", alt: "Polearm slash style", label: "Polearm slash" },
    crush: { src: "/CombatStyles_polearm_fend.png", alt: "Polearm crush style", label: "Polearm crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  powered_staff: {
    stab: ATTACK_STYLE_ICONS.STAB,
    slash: ATTACK_STYLE_ICONS.SLASH,
    crush: ATTACK_STYLE_ICONS.CRUSH,
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: { src: "/CombatStyles_powered_staff_accurate.png", alt: "Powered staff magic style", label: "Powered staff magic" },
  },
  powered_wand: {
    stab: ATTACK_STYLE_ICONS.STAB,
    slash: ATTACK_STYLE_ICONS.SLASH,
    crush: ATTACK_STYLE_ICONS.CRUSH,
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: { src: "/CombatStyles_powered_wand_accurate.png", alt: "Powered wand magic style", label: "Powered wand magic" },
  },
  slash_sword: {
    stab: { src: "/CombatStyles_slash_sword_lunge.png", alt: "Slash sword stab style", label: "Slash sword stab" },
    slash: { src: "/CombatStyles_slash_sword_slash.png", alt: "Slash sword slash style", label: "Slash sword slash" },
    crush: { src: "/CombatStyles_slash_sword_chop.png", alt: "Slash sword crush style", label: "Slash sword crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  spear: {
    stab: { src: "/CombatStyles_spear_lunge.png", alt: "Spear stab style", label: "Spear stab" },
    slash: { src: "/CombatStyles_spear_swipe.png", alt: "Spear slash style", label: "Spear slash" },
    crush: { src: "/CombatStyles_spear_pound.png", alt: "Spear crush style", label: "Spear crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  stab_sword: {
    stab: { src: "/CombatStyles_stab_sword_stab.png", alt: "Stab sword stab style", label: "Stab sword stab" },
    slash: { src: "/CombatStyles_stab_sword_slash.png", alt: "Stab sword slash style", label: "Stab sword slash" },
    crush: { src: "/CombatStyles_stab_sword_lunge.png", alt: "Stab sword crush style", label: "Stab sword crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  staff: {
    stab: { src: "/CombatStyles_staff_focus.png", alt: "Staff stab style", label: "Staff stab" },
    slash: { src: "/CombatStyles_staff_bash.png", alt: "Staff slash style", label: "Staff slash" },
    crush: { src: "/CombatStyles_staff_pound.png", alt: "Staff crush style", label: "Staff crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: { src: "/CombatStyles_staff_spell.png", alt: "Staff magic style", label: "Staff magic" },
  },
  thrown: {
    stab: ATTACK_STYLE_ICONS.STAB,
    slash: ATTACK_STYLE_ICONS.SLASH,
    crush: ATTACK_STYLE_ICONS.CRUSH,
    ranged: { src: "/CombatStyles_thrown_accurate.png", alt: "Thrown ranged style", label: "Thrown ranged" },
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
  whip: {
    stab: { src: "/CombatStyles_whip_flick.png", alt: "Whip stab style", label: "Whip stab" },
    slash: { src: "/CombatStyles_whip_lash.png", alt: "Whip slash style", label: "Whip slash" },
    crush: { src: "/CombatStyles_whip_deflect.png", alt: "Whip crush style", label: "Whip crush" },
    ranged: ATTACK_STYLE_ICONS.RANGED,
    magic: ATTACK_STYLE_ICONS.MAGIC,
  },
};

const WEAPON_FAMILY_BY_ITEM_ID: Record<number, WeaponFamily> = {
  861: "bow",
  1215: "stab_sword",
  1231: "stab_sword",
  1305: "slash_sword",
  4151: "whip",
  4153: "blunt",
  4214: "bow",
  4215: "bow",
  4216: "bow",
  4217: "bow",
  4218: "bow",
  4219: "bow",
  4220: "bow",
  4221: "bow",
  4222: "bow",
  4223: "bow",
  4710: "staff",
  4734: "crossbow",
  4755: "blunt",
  4934: "crossbow",
  4935: "crossbow",
  4936: "crossbow",
  4937: "crossbow",
  4938: "crossbow",
  5680: "stab_sword",
  5698: "stab_sword",
  9185: "crossbow",
  11235: "bow",
  11749: "bow",
  11750: "bow",
  11751: "bow",
  11752: "bow",
  11753: "bow",
  11754: "bow",
  11755: "bow",
  11756: "bow",
  11757: "bow",
  11758: "bow",
  11785: "crossbow",
  11791: "bladed_staff",
  11802: "2h_sword",
  11998: "staff",
  12765: "bow",
  12766: "bow",
  12767: "bow",
  12768: "bow",
  12788: "bow",
  12926: "thrown",
  13265: "stab_sword",
  13267: "stab_sword",
  13269: "stab_sword",
  13271: "stab_sword",
  13576: "blunt",
  13652: "claw",
  19478: "crossbow",
  19481: "crossbow",
  20368: "2h_sword",
  20405: "whip",
  20407: "stab_sword",
  20408: "bow",
  20593: "2h_sword",
  20784: "claw",
  20785: "blunt",
  21000: "crossbow",
  21003: "blunt",
  21006: "powered_wand",
  21012: "crossbow",
  21902: "crossbow",
  22324: "stab_sword",
  22613: "slash_sword",
  22622: "blunt",
  22636: "thrown",
  22647: "staff",
  23601: "crossbow",
  23611: "crossbow",
  23613: "bladed_staff",
  23615: "slash_sword",
  23617: "staff",
  23619: "thrown",
  23620: "blunt",
  23626: "powered_wand",
  23628: "stab_sword",
  23630: "crossbow",
  23983: "bow",
  24225: "blunt",
  24227: "blunt",
  24417: "blunt",
  24424: "staff",
  24617: "slash_sword",
  25865: "bow",
  25867: "bow",
  25869: "bow",
  25884: "bow",
  25886: "bow",
  25888: "bow",
  25890: "bow",
  25892: "bow",
  25894: "bow",
  25896: "bow",
  26219: "stab_sword",
  26233: "2h_sword",
  26374: "crossbow",
  27184: "2h_sword",
  27186: "crossbow",
  27187: "bow",
  27188: "crossbow",
  27189: "blunt",
  27198: "blunt",
  27246: "stab_sword",
  27690: "slash_sword",
  27692: "slash_sword",
  27861: "stab_sword",
  27863: "stab_sword",
  27865: "stab_sword",
  27867: "stab_sword",
  27869: "slash_sword",
  28869: "crossbow",
  28988: "spear",
  28997: "blunt",
  29000: "thrown",
  29577: "claw",
  29591: "bow",
  29594: "powered_staff",
  29605: "2h_sword",
  29607: "slash_sword",
  29609: "staff",
  29611: "bow",
  29796: "polearm",
  29849: "spear",
  29850: "blunt",
  29851: "thrown",
  30955: "slash_sword",
  33021: "bow",
  33174: "stab_sword",
  33178: "polearm",
  33184: "powered_staff",
  33200: "claw",
};

const OVERHEAD_ICONS: Record<string, IconDefinition> = {
  MELEE: { src: "/Protect_from_Melee.png", alt: "Protect from Melee", label: "Protect from Melee" },
  RANGED: { src: "/Protect_from_Missiles.png", alt: "Protect from Missiles", label: "Protect from Missiles" },
  MAGIC: { src: "/Protect_from_Magic.png", alt: "Protect from Magic", label: "Protect from Magic" },
  SMITE: { src: "/Smite.png", alt: "Smite", label: "Smite" },
};

const OFFENSIVE_PRAYER_ICONS: Record<number, IconDefinition> = {
  116: { src: "/Burst_of_Strength.png", alt: "Burst of Strength", label: "Burst of Strength" },
  117: { src: "/Clarity_of_Thought.png", alt: "Clarity of Thought", label: "Clarity of Thought" },
  118: { src: "/Rock_Skin.png", alt: "Rock Skin", label: "Rock Skin" },
  119: { src: "/Superhuman_Strength.png", alt: "Superhuman Strength", label: "Superhuman Strength" },
  120: { src: "/Improved_Reflexes.png", alt: "Improved Reflexes", label: "Improved Reflexes" },
  124: { src: "/Steel_Skin.png", alt: "Steel Skin", label: "Steel Skin" },
  125: { src: "/Ultimate_Strength.png", alt: "Ultimate Strength", label: "Ultimate Strength" },
  126: { src: "/Incredible_Reflexes.png", alt: "Incredible Reflexes", label: "Incredible Reflexes" },
  133: { src: "/Sharp_Eye.png", alt: "Sharp Eye", label: "Sharp Eye" },
  134: { src: "/Mystic_Will.png", alt: "Mystic Will", label: "Mystic Will" },
  502: { src: "/Hawk_Eye.png", alt: "Hawk Eye", label: "Hawk Eye" },
  503: { src: "/Mystic_Lore.png", alt: "Mystic Lore", label: "Mystic Lore" },
  504: { src: "/Eagle_Eye.png", alt: "Eagle Eye", label: "Eagle Eye" },
  505: { src: "/Mystic_Might.png", alt: "Mystic Might", label: "Mystic Might" },
  945: { src: "/Chivalry.png", alt: "Chivalry", label: "Chivalry" },
  946: { src: "/Piety.png", alt: "Piety", label: "Piety" },
  1420: { src: "/Rigour.png", alt: "Rigour", label: "Rigour" },
  1421: { src: "/Augury.png", alt: "Augury", label: "Augury" },
  1422: { src: "/Deadeye.png", alt: "Deadeye", label: "Deadeye" },
  1423: { src: "/Mystic_Vigour.png", alt: "Mystic Vigour", label: "Mystic Vigour" },
};

function formatSignedNumber(value: number, formatter = number0) {
  const rendered = formatter.format(Math.abs(value));
  if (value > 0) return `+${rendered}`;
  if (value < 0) return `-${rendered}`;
  return rendered;
}

function normalizeEquipmentItemId(itemId?: number | null) {
  if (!itemId || itemId <= 0) {
    return null;
  }
  return itemId > PLAYER_COMPOSITION_ITEM_OFFSET ? itemId - PLAYER_COMPOSITION_ITEM_OFFSET : itemId;
}

function getWeaponItemId(gear?: number[] | null) {
  if (!gear || gear.length <= WEAPON_SLOT_INDEX) {
    return null;
  }
  return normalizeEquipmentItemId(gear[WEAPON_SLOT_INDEX]);
}

function getCombatStyleKey(style?: string | null): CombatStyleKey | null {
  if (!style) {
    return null;
  }
  if (style.includes("STAB")) return "stab";
  if (style.includes("SLASH")) return "slash";
  if (style.includes("CRUSH")) return "crush";
  if (style.startsWith("RANGED")) return "ranged";
  if (style.startsWith("MAGIC")) return "magic";
  return null;
}

function inferWeaponFamily(style?: string | null, weaponId?: number | null): WeaponFamily | null {
  if (weaponId && WEAPON_FAMILY_BY_ITEM_ID[weaponId]) {
    return WEAPON_FAMILY_BY_ITEM_ID[weaponId];
  }

  if (!style) {
    return null;
  }

  if (style.includes("WHIP")) return "whip";
  if (style.includes("CLAW")) return "claw";
  if (style.includes("GODSWORD") || style.includes("2H")) return "2h_sword";
  if (style.includes("HALBERD")) return "polearm";
  if (style.includes("SPEAR") || style.includes("HASTA") || style.includes("PARTISAN")) return "spear";
  if (style.includes("BLUDGEON")) return "bludgeon";
  if (style.includes("DAGGER") || style.includes("FANG") || style.includes("RAPIER")) return "stab_sword";
  if (style.includes("SCIM") || style.includes("DLONG") || style.includes("VLS") || style.includes("VOIDWAKER")) return "slash_sword";
  if (style.includes("MAUL") || style.includes("MACE") || style.includes("WARHAMMER") || style.includes("FLAIL")) return "blunt";
  if (style.includes("STAFF_OF_THE_DEAD")) return "bladed_staff";
  if (style.includes("STAFF")) return "staff";
  if (style.includes("CROSSBOW") || style.includes("BALLISTA")) return "crossbow";
  if (style.includes("BOW") || style.includes("VENATOR")) return "bow";
  if (style.includes("BLOWPIPE") || style.includes("DART") || style.includes("KNIFE") || style.includes("THROWNAXE") || style.includes("ATLATL")) return "thrown";
  return null;
}

function getAttackStyleIcon(style?: string | null, weaponId?: number | null) {
  const combatStyle = getCombatStyleKey(style);
  if (!combatStyle) {
    return ATTACK_STYLE_ICONS.UNKNOWN;
  }

  if (combatStyle === "ranged") {
    return ATTACK_STYLE_ICONS.RANGED;
  }

  if (combatStyle === "magic") {
    return ATTACK_STYLE_ICONS.MAGIC;
  }

  const weaponFamily = inferWeaponFamily(style, weaponId);
  if (weaponFamily) {
    return WEAPON_STYLE_ICONS[weaponFamily][combatStyle];
  }

  if (combatStyle === "stab") return ATTACK_STYLE_ICONS.STAB;
  if (combatStyle === "slash") return ATTACK_STYLE_ICONS.SLASH;
  if (combatStyle === "crush") return ATTACK_STYLE_ICONS.CRUSH;
  return ATTACK_STYLE_ICONS.UNKNOWN;
}

function getWeaponName(src: string): string {
  const filename = src.split("/").pop() || "";
  const nameWithoutExtension = filename.replace(/\.png$/i, "");
  const nameWithSpaces = nameWithoutExtension.replace(/_/g, " ");

  return nameWithSpaces
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.startsWith("(")) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getWeaponIcon(weaponId?: number | null) {
  if (!weaponId || weaponId <= 0) {
    return null;
  }
  const src = WEAPON_IMAGES_BY_ITEM_ID[weaponId];
  if (!src) {
    return null;
  }
  const label = getWeaponName(src);
  return {
    src,
    alt: label,
    label: label,
  };
}

function getOverheadIcon(headIcon?: string | null) {
  if (!headIcon) {
    return null;
  }
  return OVERHEAD_ICONS[headIcon] ?? null;
}

function getOffensivePrayerIcon(spriteId?: number | null) {
  if (!spriteId || spriteId <= 0) {
    return null;
  }
  return OFFENSIVE_PRAYER_ICONS[spriteId] ?? null;
}

function getOffensivePrayerText(spriteId?: number | null) {
  if (!spriteId || spriteId <= 0) {
    return "N/A";
  }
  return OFFENSIVE_PRAYER_ICONS[spriteId]?.label ?? `Prayer ${spriteId}`;
}

function getWeaponAmmoStrength(weaponId: number): number {
  if ([11235, 12765, 12766, 12767, 12768, 20408, 29611].includes(weaponId)) {
    return 60; // Dragon arrow
  }
  if ([19481, 23630, 19478, 27188].includes(weaponId)) {
    return 150; // Dragon javelin
  }
  if ([4734, 4934, 4935, 4936, 4937, 4938].includes(weaponId)) {
    return 55; // Bolt rack
  }
  if ([28869].includes(weaponId)) {
    return 55; // Moonlight antler bolts
  }
  if ([861, 12788].includes(weaponId)) {
    return 55; // Amethyst arrows
  }
  if ([9185, 23601, 11785, 23611, 26374, 27186].includes(weaponId)) {
    return 105; // Diamond bolts (e)
  }
  return 0;
}

function getWeaponAmmoIconAndName(weaponId: number) {
  if ([11235, 12765, 12766, 12767, 12768, 20408, 29611].includes(weaponId)) {
    return { name: "Dragon arrow", src: "/Dragon_arrow_1.png" };
  }
  if ([19481, 23630, 19478, 27188].includes(weaponId)) {
    return { name: "Dragon javelin", src: "/Dragon_javelin.png" };
  }
  if ([4734, 4934, 4935, 4936, 4937, 4938].includes(weaponId)) {
    return { name: "Bolt rack", src: "/Bolt_rack_1.png" };
  }
  if ([28869].includes(weaponId)) {
    return { name: "Moonlight antler bolts", src: "/Moonlight_antler_bolts_1.png" };
  }
  if ([861, 12788].includes(weaponId)) {
    return { name: "Amethyst arrows", src: "/Amethyst_arrow_1.png" };
  }
  if ([9185, 23601, 11785, 23611, 26374, 27186].includes(weaponId)) {
    return { name: "Diamond bolts (e)", src: "/Diamond_bolts_(e)_1.png" };
  }
  return null;
}

function getDefaultRing(fightType: string) {
  if (fightType.startsWith("LMS_")) {
    return { id: 20655, name: "Ring of suffering (i)", src: "/Ring_of_suffering_(i).png" };
  }
  return { id: 6737, name: "Berserker ring", src: "/Berserker_ring.png" };
}

const DEFAULT_COMBAT_LEVELS_BY_TYPE: Record<string, { a: number; s: number; d: number; r: number; m: number; h: number }> = {
  LMS_MAXMED: { a: 118, s: 118, d: 85, r: 112, m: 99, h: 99 },
  LMS_ZERK: { a: 97, s: 118, d: 45, r: 112, m: 99, h: 99 },
  LMS_1DEF: { a: 91, s: 118, d: 1, r: 112, m: 99, h: 99 },
  NORMAL: { a: 118, s: 118, d: 120, r: 112, m: 99, h: 99 },
};

function IconLabel({
  icon,
  text,
  hideText = false,
}: {
  icon: IconDefinition | null;
  text: string;
  hideText?: boolean;
}) {
  return (
    <span className={styles.iconLabel}>
      {icon ? (
        <span className={styles.tooltipTarget} data-tooltip={icon.label}>
          <Image
            alt={icon.alt}
            className={styles.iconImage}
            height={18}
            src={icon.src}
            width={18}
          />
        </span>
      ) : null}
      {(!icon || !hideText) && <span>{text}</span>}
    </span>
  );
}

function formatPercentNumber(value: number) {
  return `${number1.format(value)}%`;
}

function formatPercentFromRatio(ratio: number) {
  return percent1.format(ratio);
}

function formatElapsedFromTickDelta(tickDelta: number, includeTenths = true) {
  const elapsedMs = Math.max(0, tickDelta) * OSRS_TICK_MS;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((elapsedMs % 1000) / 100);

  if (hours > 0) {
    return includeTenths
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`
      : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return includeTenths
    ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatLogTime(log: FightLogEntry, firstVisibleTick: number) {
  const tickValue = Number(log.T ?? 0);
  const tickDelta = Math.max(0, tickValue - Number(firstVisibleTick ?? 0));
  return `${formatElapsedFromTickDelta(tickDelta)} (${tickDelta}t)`;
}

function SyncStatusBadge({ synced }: { synced: boolean }) {
  return (
    <span className={`${styles.syncBadge} ${synced ? styles.syncBadgeOn : styles.syncBadgeOff}`}>
      {synced ? "Synced" : "One POV"}
    </span>
  );
}

function getFightLogs(fight: FightPerformance): FightLogEntry[] {
  return [...(fight.c?.l ?? []), ...(fight.o?.l ?? [])]
    .filter((entry) => entry && entry.f)
    .sort((left, right) => {
      const tickDiff = (left.T ?? 0) - (right.T ?? 0);
      if (tickDiff !== 0) {
        return tickDiff;
      }
      return (left.t ?? 0) - (right.t ?? 0);
    });
}

function attackerNameForEntry(fight: FightPerformance, entry: FightLogEntry) {
  const competitorLogs = fight.c?.l ?? [];
  return competitorLogs.includes(entry) ? fight.c?.n : fight.o?.n;
}

function attackerDataForEntry(fight: FightPerformance, entry: FightLogEntry) {
  const attackerName = attackerNameForEntry(fight, entry);
  if (attackerName === fight.c?.n) {
    return { attacker: fight.c, defenderName: fight.o?.n, attackerName };
  }
  return { attacker: fight.o, defenderName: fight.c?.n, attackerName };
}

function compareFightLogOrder(left: FightLogEntry, right: FightLogEntry) {
  const tickDiff = (left.T ?? 0) - (right.T ?? 0);
  if (tickDiff !== 0) {
    return tickDiff;
  }

  return (left.t ?? 0) - (right.t ?? 0);
}

function hasEquipmentSnapshot(gear: number[] | undefined) {
  return Array.isArray(gear) && gear.some((id) => id > 0);
}

function findNearestAttackSnapshot(entries: FightLogEntry[] | undefined, target: FightLogEntry) {
  const fullEntries = (entries ?? []).filter((entry) => entry?.f);
  if (fullEntries.length === 0) {
    return null;
  }

  return fullEntries.reduce<FightLogEntry | null>((closest, candidate) => {
    if (!closest) {
      return candidate;
    }

    const candidateTickDiff = Math.abs((candidate.T ?? 0) - (target.T ?? 0));
    const closestTickDiff = Math.abs((closest.T ?? 0) - (target.T ?? 0));
    if (candidateTickDiff !== closestTickDiff) {
      return candidateTickDiff < closestTickDiff ? candidate : closest;
    }

    const candidateTimeDiff = Math.abs((candidate.t ?? 0) - (target.t ?? 0));
    const closestTimeDiff = Math.abs((closest.t ?? 0) - (target.t ?? 0));
    return candidateTimeDiff < closestTimeDiff ? candidate : closest;
  }, null);
}

function findLatestEquipmentSnapshot(
  entries: FightLogEntry[] | undefined,
  target: FightLogEntry,
  gearKey: "G" | "g",
) {
  const candidates = (entries ?? []).filter((entry) => hasEquipmentSnapshot(gearKey === "G" ? entry.G : entry.g));
  if (candidates.length === 0) {
    return null;
  }

  let latestKnown: FightLogEntry | null = null;
  let nextKnown: FightLogEntry | null = null;

  for (const candidate of candidates) {
    const comparison = compareFightLogOrder(candidate, target);
    if (comparison <= 0) {
      if (!latestKnown || compareFightLogOrder(candidate, latestKnown) > 0) {
        latestKnown = candidate;
      }
      continue;
    }

    if (!nextKnown || compareFightLogOrder(candidate, nextKnown) < 0) {
      nextKnown = candidate;
    }
  }

  return latestKnown ?? nextKnown;
}

function offPrayPercentage(fighter: FightPerformance["c"]) {
  return fighter?.a ? (fighter.s / fighter.a) * 100 : 0;
}

function offensivePrayPercentage(fighter: FightPerformance["c"]) {
  return fighter?.a ? (fighter.p / fighter.a) * 100 : 0;
}

function magicLuckRatio(fighter: FightPerformance["c"]) {
  return fighter?.M ? fighter.m / fighter.M : 0;
}

function getRobeHitStats(fighter: FightPerformance["c"], opponent: FightPerformance["c"]) {
  const total = opponent.a - opponent.z;
  const ratio = total > 0 ? fighter.rh / total : 0;
  return {
    text: `${fighter.rh}/${total} (${formatPercentFromRatio(ratio)})`,
    ratio,
  };
}

function getKoSummary(fight: FightPerformance) {
  const competitor = { count: 0, survival: 1, total: 0 };
  const opponent = { count: 0, survival: 1, total: 0 };

  for (const entry of getFightLogs(fight)) {
    const chance = entry.displayKoChance ?? entry.k ?? null;
    if (chance == null) {
      continue;
    }
    const bucket = attackerNameForEntry(fight, entry) === fight.c.n ? competitor : opponent;
    bucket.count += 1;
    bucket.survival *= 1 - chance;
  }

  competitor.total = competitor.count > 0 ? 1 - competitor.survival : 0;
  opponent.total = opponent.count > 0 ? 1 - opponent.survival : 0;

  return {
    competitor: {
      ...competitor,
      text: competitor.count > 0 ? `${competitor.count} (${formatPercentFromRatio(competitor.total)})` : "0",
    },
    opponent: {
      ...opponent,
      text: opponent.count > 0 ? `${opponent.count} (${formatPercentFromRatio(opponent.total)})` : "0",
    },
  };
}

function getOpposingPov(fight: FightPerformance) {
  const secondaryFight = fight._secondaryFight ?? null;
  if (!secondaryFight) {
    return null;
  }
  if (secondaryFight.c?.n === fight.o?.n && secondaryFight.o?.n === fight.c?.n) {
    return secondaryFight;
  }
  return null;
}

const SUMMARY_TOOLTIPS: Record<string, string> = {
  OP: "Off-Prayer — attacks landed while opponent wasn't protecting",
  eD: "Expected Damage — average damage you would have dealt based on gear, accuracy & max hit",
  D: "Damage Dealt — actual total damage inflicted",
  M: "Magic Hits — tracks expected hits vs. actual magic hits (non-splashes)",
  P: "Offensive Prayer — attacks using correct offensive prayers (e.g. Piety/Rigour/Augury)",
  HP: "HP Healed — amount of hitpoints recovered during the fight from all sources",
  rH: "Robe Hits — number of range/melee hits taken while wearing robes",
  KO: "KO Chances — total probability of getting a KO across all opportunities",
  GB: "Ghost Barrages — barrages cast during animation stalls (PvP Arena)",
};

function getSummaryRows(fight: FightPerformance) {
  const competitor = fight.c;
  const opponent = fight.o;
  const opposingCompetitor = getOpposingPov(fight)?.c ?? null;
  const robeLeft = getRobeHitStats(competitor, opponent);
  const robeRight = getRobeHitStats(opponent, competitor);
  const ko = getKoSummary(fight);

  const rows = [
    {
      index: "OP",
      left: `${competitor.s}/${competitor.a} (${formatPercentNumber(offPrayPercentage(competitor))})`,
      right: `${opponent.s}/${opponent.a} (${formatPercentNumber(offPrayPercentage(opponent))})`,
      leftClass: offPrayPercentage(competitor) > offPrayPercentage(opponent) ? styles.summarySuccess : "",
      rightClass: offPrayPercentage(opponent) > offPrayPercentage(competitor) ? styles.summarySuccess : "",
    },
    {
      index: "eD",
      left: `${number0.format(competitor.d)} (${formatSignedNumber(competitor.d - opponent.d, number0)})`,
      right: `${number0.format(opponent.d)} (${formatSignedNumber(opponent.d - competitor.d, number0)})`,
      leftClass: competitor.d > opponent.d ? styles.summarySuccess : "",
      rightClass: opponent.d > competitor.d ? styles.summarySuccess : "",
    },
    {
      index: "D",
      left: `${competitor.h} (${formatSignedNumber(competitor.h - opponent.h, number0)})`,
      right: `${opponent.h} (${formatSignedNumber(opponent.h - competitor.h, number0)})`,
      leftClass: competitor.h > opponent.h ? styles.summarySuccess : "",
      rightClass: opponent.h > competitor.h ? styles.summarySuccess : "",
    },
    {
      index: "M",
      left: `${number0.format(competitor.m)}/${number0.format(competitor.z)} (${formatPercentNumber(magicLuckRatio(competitor) * 100)})`,
      right: `${number0.format(opponent.m)}/${number0.format(opponent.z)} (${formatPercentNumber(magicLuckRatio(opponent) * 100)})`,
      leftClass: magicLuckRatio(competitor) > magicLuckRatio(opponent) ? styles.summarySuccess : "",
      rightClass: magicLuckRatio(opponent) > magicLuckRatio(competitor) ? styles.summarySuccess : "",
    },
    {
      index: "P",
      left: `${competitor.p}/${competitor.a} (${formatPercentNumber(offensivePrayPercentage(competitor))})`,
      right: opposingCompetitor ? `${opposingCompetitor.p}/${opposingCompetitor.a} (${formatPercentNumber(offensivePrayPercentage(opposingCompetitor))})` : "N/A",
      leftClass: opposingCompetitor && offensivePrayPercentage(competitor) > offensivePrayPercentage(opposingCompetitor) ? styles.summarySuccess : "",
      rightClass: opposingCompetitor && offensivePrayPercentage(opposingCompetitor) > offensivePrayPercentage(competitor) ? styles.summarySuccess : "",
    },
    {
      index: "HP",
      left: String(competitor.H),
      right: opposingCompetitor ? String(opposingCompetitor.H) : "N/A",
      leftClass: opposingCompetitor && competitor.H > opposingCompetitor.H ? styles.summarySuccess : "",
      rightClass: opposingCompetitor && opposingCompetitor.H > competitor.H ? styles.summarySuccess : "",
    },
    {
      index: "rH",
      left: robeLeft.text,
      right: robeRight.text,
      leftClass: robeLeft.ratio < robeRight.ratio ? styles.summarySuccess : "",
      rightClass: robeRight.ratio < robeLeft.ratio ? styles.summarySuccess : "",
    },
    {
      index: "KO",
      left: ko.competitor.text,
      right: ko.opponent.text,
      leftClass: ko.competitor.total > ko.opponent.total ? styles.summarySuccess : "",
      rightClass: ko.opponent.total > ko.competitor.total ? styles.summarySuccess : "",
    },
  ];

  if ((competitor.g ?? 0) > 0 || (opponent.g ?? 0) > 0 || (opposingCompetitor?.g ?? 0) > 0) {
    rows.push({
      index: "GB",
      left: `${competitor.g} G.B. (${number1.format(competitor.y)})`,
      right: opposingCompetitor ? `${opposingCompetitor.g} G.B. (${number1.format(opposingCompetitor.y)})` : "N/A",
      leftClass: opposingCompetitor
        ? competitor.y > opposingCompetitor.y
          ? styles.summarySuccess
          : styles.summaryWarning
        : styles.summaryWarning,
      rightClass: opposingCompetitor
        ? opposingCompetitor.y > competitor.y
          ? styles.summarySuccess
          : styles.summaryWarning
        : "",
    });
  }

  return rows;
}

function HomeDashboard({
  stats,
  loading,
  onPlayerClick,
  onFightClick,
}: {
  stats: DashboardStats | null;
  loading: boolean;
  onPlayerClick: (name: string) => void;
  onFightClick: (fight: FightSummary) => void;
}) {
  if (loading) {
    return (
      <div className={styles.statsLoading}>
        <div className={styles.spinner} />
        <p>Loading global tracker statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>OSRS PvP Fight Tracker</h1>
        <p className={styles.heroSubtitle}>
          Deep combat analytics for Old School RuneScape PvP. Track tick-perfect equipment switches, pray accuracy, damage luck, and KO setups.
        </p>
        <p className={styles.heroNote}>
          <strong>Synced</strong> means both players uploaded their POV from the same fight, so the tracker has the full two-sided record.
        </p>

        {/* Counter cards */}
        <div className={styles.countersGrid}>
          <div className={styles.counterCard}>
            <div className={styles.counterLabel}>Total Fights Tracked</div>
            <div className={styles.counterValue}>{stats.totalFights}</div>
          </div>
          <div className={styles.counterCard}>
            <div className={styles.counterLabel}>Active Players</div>
            <div className={styles.counterValue}>{stats.totalPlayers}</div>
          </div>
        </div>
      </section>

      {/* Grid of details */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: Recent Fights */}
        <div className={styles.dashboardCard}>
          <h2 className={styles.dashboardCardTitle}>Recent PvP Activity</h2>
          <div className={styles.recentFightsList}>
            {stats.recentFights.length === 0 ? (
              <p className={styles.emptyText}>No recent fights recorded.</p>
            ) : (
              stats.recentFights.map((fight) => {
                const competitorDead = fight.competitor_dead;
                const opponentDead = fight.opponent_dead;
                return (
                  <div
                    key={fight.fight_id}
                    className={styles.recentFightItem}
                    onClick={() => onFightClick(fight)}
                  >
                    <div className={styles.recentFightPlayers}>
                      <span className={competitorDead ? styles.deadName : styles.aliveName}>
                        {competitorDead ? "☠ " : ""}{fight.competitor_name}
                      </span>
                      <span className={styles.vsBadge}>VS</span>
                      <span className={opponentDead ? styles.deadName : styles.aliveName}>
                        {opponentDead ? "☠ " : ""}{fight.opponent_name}
                      </span>
                    </div>
                    <div className={styles.recentFightMeta}>
                      <span>World {fight.world}</span>
                      <span>•</span>
                      <span>{fight.fight_type}</span>
                      <span>•</span>
                      <SyncStatusBadge synced={fight.has_secondary_pov} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Leaderboards and Distribution */}
        <div className={styles.dashboardRightCol}>
          {/* Top Players Leaderboard */}
          <div className={styles.dashboardCard}>
            <h2 className={styles.dashboardCardTitle}>Top Active Players</h2>
            <div className={styles.leaderboardList}>
              {stats.activePlayers.length === 0 ? (
                <p className={styles.emptyText}>No active players.</p>
              ) : (
                [...stats.activePlayers].sort((a, b) => {
                  const winRateA = a.fight_count > 0 ? a.wins / a.fight_count : 0;
                  const winRateB = b.fight_count > 0 ? b.wins / b.fight_count : 0;
                  if (winRateB !== winRateA) return winRateB - winRateA;
                  if (b.wins !== a.wins) return b.wins - a.wins;
                  return a.losses - b.losses;
                }).map((player, idx) => {
                  const total = player.fight_count;
                  const winRate = total > 0 ? (player.wins / total) * 100 : 0;
                  return (
                    <div
                      key={player.player_name}
                      className={styles.leaderboardItem}
                      onClick={() => onPlayerClick(player.player_name)}
                    >
                      <div className={styles.leaderboardLeft}>
                        <span className={`${styles.rankBadge} ${styles[`rank${idx + 1}`] || ""}`}>
                          #{idx + 1}
                        </span>
                        <strong className={styles.leaderboardName}>{player.player_name}</strong>
                      </div>
                      <div className={styles.leaderboardStats}>
                        <span className={styles.leaderboardFights}>{player.fight_count} fight{player.fight_count === 1 ? "" : "s"}</span>
                        <span className={styles.leaderboardRecord}>
                          {player.wins}W - {player.losses}L ({winRate.toFixed(0)}% WR)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Fight Type Breakdown */}
          <div className={styles.dashboardCard}>
            <h2 className={styles.dashboardCardTitle}>Popular Match Types</h2>
            <div className={styles.fightTypesList}>
              {stats.fightTypes.length === 0 ? (
                <p className={styles.emptyText}>No match types recorded.</p>
              ) : (
                stats.fightTypes.map((type) => {
                  const maxCount = Math.max(...stats.fightTypes.map(t => t.count)) || 1;
                  const percentage = (type.count / maxCount) * 100;
                  return (
                    <div key={type.fight_type} className={styles.fightTypeItem}>
                      <div className={styles.fightTypeHeader}>
                        <span className={styles.fightTypeName}>{type.fight_type}</span>
                        <span className={styles.fightTypeCount}>{type.count} fight{type.count === 1 ? "" : "s"}</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plugin details footer */}
      <section className={styles.pluginGuideCard}>
        <h3>Connect Your RuneLite Plugin</h3>
        <p>
          Open RuneLite settings, find the <strong>PvP Performance Tracker</strong> plugin and enable the "Upload Fights to PvP-Hub.com" setting to automatically upload your fights. Public visibility follows your chosen upload delay, so fights can appear a little later after the in-game tracker finishes.
        </p>
      </section>

      <section className={styles.privacyCard}>
        <h3>Privacy</h3>
        <p>
          We do not collect any personal data all except the fight logs generated by the PvP Performance Tracker plugin. View the source code{" "}
          <a
            className={styles.privacyLink}
            href="https://github.com/LogicalSoIutions/osrs-pvp-performance-tracker-website"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>{" "}
          and DM LogicalSolutions on Discord to see the server running live over Discord to see that there are no IP&apos;s being logged if you really so feel the need.
        </p>
      </section>
    </div>
  );
}

function PlayerDashboard({
  stats,
  loading,
  onPlayerClick,
}: {
  stats: PlayerStats | null;
  loading: boolean;
  onPlayerClick: (name: string) => void;
}) {
  const [weaponPageStart, setWeaponPageStart] = useState(0);
  const [matchupPageStart, setMatchupPageStart] = useState(0);

  if (loading) {
    return (
      <div className={styles.statsLoading}>
        <div className={styles.spinner} />
        <p>Loading player statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const winRatePercent = (stats.winRate * 100).toFixed(1);
  const visibleWeaponCount = 10;
  const visibleMatchupCount = 10;
  const cappedWeapons = stats.weaponsUsed;
  const cappedMatchups = stats.headToHead;
  const visibleWeapons = cappedWeapons.slice(weaponPageStart, weaponPageStart + visibleWeaponCount);
  const visibleMatchups = cappedMatchups.slice(matchupPageStart, matchupPageStart + visibleMatchupCount);
  const canScrollWeaponsBack = weaponPageStart > 0;
  const canScrollWeaponsForward = weaponPageStart + visibleWeaponCount < cappedWeapons.length;
  const canScrollMatchupsBack = matchupPageStart > 0;
  const canScrollMatchupsForward = matchupPageStart + visibleMatchupCount < cappedMatchups.length;

  return (
    <div className={styles.dashboardContainer}>
      {/* Player Header Banner */}
      <div className={styles.playerHeaderBanner}>
        <div>
          <span className={styles.eyebrow}>Player Profile</span>
          <h1 className={styles.playerBannerName}>{stats.playerName}</h1>
        </div>
        <div className={styles.playerBannerRecord}>
          <div className={styles.bannerRecordLabel}>Overall Record</div>
          <div className={styles.bannerRecordValue}>
            {stats.wins}W - {stats.losses}L <span className={styles.bannerWinRate}>({winRatePercent}% WR)</span>
          </div>
        </div>
      </div>

      <div className={`${styles.dashboardGrid} ${styles.playerDashboardGrid}`}>
        {/* Left Column: Combat averages cards */}
        <div className={styles.playerStatsCol}>
          <div className={styles.dashboardCard}>
            <h2 className={styles.dashboardCardTitle}>Average Performance (Last {stats.fightCount} Fights)</h2>
            <div className={styles.playerMetricsGrid}>

              {/* Off-Prayer */}
              <div className={styles.metricWidget}>
                <div className={styles.metricWidgetLabel}>Off-Prayer Accuracy</div>
                <div className={styles.metricWidgetValue}>
                  {(stats.averages.offPrayerRatio * 100).toFixed(1)}%
                </div>
                <p className={styles.metricWidgetDesc}>
                  Percentage of attacks landed while opponent was not protecting.
                </p>
              </div>

              {/* Offensive Prayer */}
              <div className={styles.metricWidget}>
                <div className={styles.metricWidgetLabel}>Offensive Prayer Usage</div>
                <div className={styles.metricWidgetValue}>
                  {(stats.averages.offensivePrayerRatio * 100).toFixed(1)}%
                </div>
                <p className={styles.metricWidgetDesc}>
                  Percentage of attacks using the correct offensive prayer (Rigour/Piety/Augury).
                </p>
              </div>

              {/* Magic Luck */}
              <div className={styles.metricWidget}>
                <div className={styles.metricWidgetLabel}>Magic Luck Ratio</div>
                <div className={styles.metricWidgetValue}>
                  {stats.averages.magicLuckRatio.toFixed(2)}x
                </div>
                <p className={styles.metricWidgetDesc}>
                  Expected vs actual Magic hits landed (above 1.0 means lucky hits).
                </p>
              </div>

              {/* Damage Ratio */}
              <div className={styles.metricWidget}>
                <div className={styles.metricWidgetLabel}>Damage Dealt vs Expected</div>
                <div className={styles.metricWidgetValue}>
                  {stats.averages.avgDmgDealt.toFixed(0)} / {stats.averages.avgExpectedDmg.toFixed(0)}
                </div>
                <p className={styles.metricWidgetDesc}>
                  Average damage dealt vs expectation.
                </p>
              </div>

              {/* HP Healed */}
              <div className={styles.metricWidget}>
                <div className={styles.metricWidgetLabel}>Avg Healed per Fight</div>
                <div className={styles.metricWidgetValue}>
                  {stats.averages.avgHpHealed.toFixed(0)} HP
                </div>
                <p className={styles.metricWidgetDesc}>
                  Average hitpoints restored via food, potions, or spec effects.
                </p>
              </div>

              {/* Robe Hits */}
              <div className={styles.metricWidget}>
                <div className={styles.metricWidgetLabel}>Taken in Robes</div>
                <div className={styles.metricWidgetValue}>
                  {(stats.averages.avgRobeHitRatio * 100).toFixed(1)}%
                </div>
                <p className={styles.metricWidgetDesc}>
                  Percentage of range/melee hits taken while wearing magic robes.
                </p>
              </div>

            </div>
          </div>

          <div className={styles.dashboardCard}>
            <div className={styles.listCardHeader}>
              <h2 className={styles.dashboardCardTitle}>Top Match-ups</h2>
              <div className={styles.listArrowControls}>
                <button
                  className={styles.arrowButton}
                  type="button"
                  onClick={() => setMatchupPageStart((current) => Math.max(0, current - visibleMatchupCount))}
                  disabled={!canScrollMatchupsBack}
                  aria-label="Show previous match-ups"
                >
                  ←
                </button>
                <button
                  className={styles.arrowButton}
                  type="button"
                  onClick={() =>
                    setMatchupPageStart((current) =>
                      Math.min(Math.max(0, cappedMatchups.length - visibleMatchupCount), current + visibleMatchupCount),
                    )
                  }
                  disabled={!canScrollMatchupsForward}
                  aria-label="Show more match-ups"
                >
                  →
                </button>
              </div>
            </div>
            <div className={styles.h2hList}>
              {stats.headToHead.length === 0 ? (
                <p className={styles.emptyText}>No head-to-head records.</p>
              ) : (
                visibleMatchups.map((rec) => {
                  const h2hWinRate = (rec.wins / rec.total) * 100;
                  const canOpenOpponent = !isHiddenRsn(rec.opponent);
                  return (
                    <div
                      key={rec.opponent}
                      className={styles.h2hItem}
                      onClick={() => {
                        if (canOpenOpponent) {
                          onPlayerClick(rec.opponent);
                        }
                      }}
                    >
                      <strong className={styles.h2hOpponent}>{rec.opponent}</strong>
                      <div className={styles.h2hStats}>
                        <span className={styles.h2hRecord}>
                          {rec.wins}W - {rec.losses}L
                        </span>
                        <span className={styles.h2hWinRate}>
                          ({h2hWinRate.toFixed(0)}% WR)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Favorite Weapons */}
        <div className={`${styles.dashboardRightCol} ${styles.playerDashboardRightCol}`}>
          {/* Favorite Weapons */}
          <div className={styles.dashboardCard}>
            <div className={styles.listCardHeader}>
              <h2 className={styles.dashboardCardTitle}>Favorite Weapons</h2>
              <div className={styles.listArrowControls}>
                <button
                  className={styles.arrowButton}
                  type="button"
                  onClick={() => setWeaponPageStart((current) => Math.max(0, current - visibleWeaponCount))}
                  disabled={!canScrollWeaponsBack}
                  aria-label="Show previous weapons"
                >
                  ←
                </button>
                <button
                  className={styles.arrowButton}
                  type="button"
                  onClick={() =>
                    setWeaponPageStart((current) =>
                      Math.min(Math.max(0, cappedWeapons.length - visibleWeaponCount), current + visibleWeaponCount),
                    )
                  }
                  disabled={!canScrollWeaponsForward}
                  aria-label="Show more weapons"
                >
                  →
                </button>
              </div>
            </div>
            <div className={styles.weaponsShowcaseList}>
              {stats.weaponsUsed.length === 0 ? (
                <p className={styles.emptyText}>No weapon usage data.</p>
              ) : (
                visibleWeapons.map((wep) => (
                  <div key={wep.name} className={styles.weaponShowcaseItem}>
                    <div className={styles.weaponShowcaseImageWrap}>
                      {wep.src ? (
                        <Image
                          src={`/${wep.src}`}
                          alt={wep.name}
                          width={32}
                          height={32}
                          className={styles.weaponShowcaseImg}
                        />
                      ) : (
                        <span className={styles.weaponShowcaseSymbol}>⚔</span>
                      )}
                    </div>
                    <div className={styles.weaponShowcaseDetails}>
                      <strong className={styles.weaponShowcaseName}>{wep.name}</strong>
                      <span className={styles.weaponShowcaseCount}>{wep.count} attack{wep.count === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

type FightBrowserProps = {
  initialPlayerName?: string | null;
  initialFightId?: string | null;
};

function buildFightBrowserPath(playerName: string | null, fightId: string | null) {
  if (!playerName) {
    return "/";
  }

  const encodedPlayer = encodeURIComponent(playerName);
  if (!fightId) {
    return `/${encodedPlayer}`;
  }

  return `/${encodedPlayer}/${fightId}`;
}

function readFightBrowserRoute() {
  if (typeof window === "undefined") {
    return {
      playerName: null,
      fightId: null,
    };
  }

  const [playerName, fightId] = window.location.pathname
    .split("/")
    .filter(Boolean);

  return {
    playerName: playerName ? decodeURIComponent(playerName) : null,
    fightId: fightId ?? null,
  };
}

export function FightBrowser({
  initialPlayerName = null,
  initialFightId = null,
}: FightBrowserProps) {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [playerFights, setPlayerFights] = useState<FightSummary[]>([]);
  const [routePlayerName, setRoutePlayerName] = useState<string | null>(initialPlayerName);
  const [routeFightId, setRouteFightId] = useState<string | null>(initialFightId);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(initialPlayerName);
  const [selectedFightId, setSelectedFightId] = useState<string | null>(initialFightId);
  const [selectedFight, setSelectedFight] = useState<FightDetail | null>(null);
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [statsLoadingCount, setStatsLoadingCount] = useState(0);

  const selectedPlayerRef = useRef(selectedPlayer);
  const selectedFightIdRef = useRef(selectedFightId);
  const hasLoadedPlayersRef = useRef(false);
  const statsLoading = statsLoadingCount > 0;

  useEffect(() => {
    selectedPlayerRef.current = selectedPlayer;
  }, [selectedPlayer]);

  useEffect(() => {
    selectedFightIdRef.current = selectedFightId;
  }, [selectedFightId]);

  useEffect(() => {
    setRoutePlayerName(initialPlayerName);
    setRouteFightId(initialFightId);
  }, [initialFightId, initialPlayerName]);

  useEffect(() => {
    function handlePopState() {
      const nextRoute = readFightBrowserRoute();
      setRoutePlayerName(nextRoute.playerName);
      setRouteFightId(nextRoute.fightId);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (selectedPlayer || selectedFightId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGlobalStats(null);
      return;
    }

    let cancelled = false;
    async function fetchStats() {
      setStatsLoadingCount((count) => count + 1);
      try {
        const response = await fetch("/api/stats");
        if (response.ok && !cancelled) {
          const data = await response.json();
          setGlobalStats(data);
        }
      } catch (err) {
        console.error("Failed to load global stats:", err);
      } finally {
        setStatsLoadingCount((count) => Math.max(0, count - 1));
      }
    }

    void fetchStats();
    return () => {
      cancelled = true;
    };
  }, [selectedPlayer, selectedFightId]);

  useEffect(() => {
    const player = selectedPlayer;
    if (!player) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlayerStats(null);
      return;
    }

    if (selectedFightId) {
      return;
    }

    let cancelled = false;
    async function fetchPStats() {
      if (!player) return;
      setStatsLoadingCount((count) => count + 1);
      try {
        const response = await fetch(`/api/players/${encodeURIComponent(player)}/stats`);
        if (response.ok && !cancelled) {
          const data = await response.json();
          setPlayerStats(data);
        }
      } catch (err) {
        console.error("Failed to load player stats:", err);
      } finally {
        setStatsLoadingCount((count) => Math.max(0, count - 1));
      }
    }

    void fetchPStats();
    return () => {
      cancelled = true;
    };
  }, [selectedPlayer, selectedFightId]);

  const loadPlayers = useCallback(async (searchText = "") => {
    const query = new URLSearchParams();
    if (searchText.trim()) {
      query.set("search", searchText.trim());
    }

    const response = await fetch(`/api/players?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load players");
    }

    const data = (await response.json()) as PlayerSummary[];
    setPlayers(data);
  }, []);

  const loadPlayerFights = useCallback(async (playerName: string) => {
    const response = await fetch(`/api/players/${encodeURIComponent(playerName)}/fights`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load fights for ${playerName}`);
    }

    const data = (await response.json()) as FightSummary[];
    setPlayerFights(data);
  }, []);

  const loadFight = useCallback(async (fightId: string) => {
    const response = await fetch(`/api/fights/${fightId}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load fight ${fightId}`);
    }

    const data = (await response.json()) as FightDetail;
    if (data.secondary_data) {
      data.full_data._secondaryFight = data.secondary_data;
    }
    setSelectedFight(data);
    setSelectedLogIndex(0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function ensurePlayersLoaded() {
      if (hasLoadedPlayersRef.current) {
        return;
      }

      try {
        setError("");
        await loadPlayers("");
        hasLoadedPlayersRef.current = true;
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
        }
      }
    }

    void ensurePlayersLoaded();

    return () => {
      cancelled = true;
    };
  }, [loadPlayers]);

  useEffect(() => {
    let cancelled = false;
    const currentPlayer = selectedPlayerRef.current;
    const nextPlayer = routePlayerName;
    const shouldKeepExistingFights =
      currentPlayer === nextPlayer &&
      (nextPlayer === null || playerFights.length > 0);

    if (shouldKeepExistingFights) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPlayer(nextPlayer);
    setError("");

    if (!nextPlayer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlayerFights([]);
      return;
    }

    async function syncPlayerRoute(playerName: string) {
      try {
        await loadPlayerFights(playerName);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
        }
      }
    }

    void syncPlayerRoute(nextPlayer);

    return () => {
      cancelled = true;
    };
  }, [loadPlayerFights, playerFights.length, routePlayerName]);

  useEffect(() => {
    let cancelled = false;
    const nextFightId = routeFightId;

    if (selectedFightIdRef.current !== nextFightId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFightId(nextFightId);
    }

    if (!nextFightId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFight(null);
      return;
    }

    if (selectedFight?.fight_id === nextFightId) {
      return;
    }

    async function syncFightRoute(fightId: string) {
      try {
        setError("");
        await loadFight(fightId);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
        }
      }
    }

    void syncFightRoute(nextFightId);

    return () => {
      cancelled = true;
    };
  }, [loadFight, routeFightId, selectedFight?.fight_id]);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.addEventListener("fight_added", (event) => {
      try {
        const newFight = JSON.parse(event.data) as FightSummary;

        // 1. Always refresh players in sidebar
        void loadPlayers("");

        const currentSelectedPlayer = selectedPlayerRef.current;
        const currentSelectedFightId = selectedFightIdRef.current;

        // 2. If a player is selected and is part of this fight, refresh their fights and stats
        if (currentSelectedPlayer) {
          const lowerSelected = currentSelectedPlayer.toLowerCase();
          if (
            newFight.competitor_name.toLowerCase() === lowerSelected ||
            (!isHiddenRsn(newFight.opponent_name) && newFight.opponent_name.toLowerCase() === lowerSelected)
          ) {
            void loadPlayerFights(currentSelectedPlayer);

            // Fetch player stats
            void (async () => {
              try {
                const response = await fetch(`/api/players/${encodeURIComponent(currentSelectedPlayer)}/stats`);
                if (response.ok) {
                  const data = await response.json();
                  setPlayerStats(data);
                }
              } catch (err) {
                console.error("Failed to reload player stats via SSE:", err);
              }
            })();
          }
        } else if (!currentSelectedFightId) {
          // 3. If no player is selected and we're not inside a fight details view, refresh global stats
          void (async () => {
            try {
              const response = await fetch("/api/stats");
              if (response.ok) {
                const data = await response.json();
                setGlobalStats(data);
              }
            } catch (err) {
              console.error("Failed to reload global stats via SSE:", err);
            }
          })();
        }

        // 4. If the user is currently looking at this specific fight, reload the fight data (e.g. secondary POV added)
        if (currentSelectedFightId === newFight.fight_id) {
          void loadFight(currentSelectedFightId);
        }
      } catch (err) {
        console.error("Error processing fight_added event:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [loadPlayers, loadPlayerFights, loadFight]);

  const filteredPlayers = useMemo(
    () => players.filter((player) => player.player_name.toLowerCase().includes(search.toLowerCase())),
    [players, search],
  );

  const filteredPlayerFights = useMemo(() => {
    if (!selectedPlayer) {
      return [];
    }

    return playerFights.filter((fight) => {
      const opponent = fight.competitor_name === selectedPlayer ? fight.opponent_name : fight.competitor_name;
      return opponent.toLowerCase().includes(search.toLowerCase());
    });
  }, [playerFights, search, selectedPlayer]);

  const visibleLogs = selectedFight ? getFightLogs(selectedFight.full_data) : [];
  const selectedLog = visibleLogs[selectedLogIndex] ?? null;

  function updateRoute(playerName: string | null, fightId: string | null) {
    setRoutePlayerName(playerName);
    setRouteFightId(fightId);

    if (typeof window === "undefined") {
      return;
    }

    const nextPath = buildFightBrowserPath(playerName, fightId);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
  }

  function handlePlayerClick(playerName: string) {
    setSelectedPlayer(playerName);
    setSelectedFightId(null);
    setSelectedFight(null);
    setSelectedLogIndex(0);
    setError("");
    updateRoute(playerName, null);
  }

  function handleFightClick(fight: FightSummary) {
    const playerName = selectedPlayer ?? fight.competitor_name;
    setSelectedFightId(fight.fight_id);
    setSelectedLogIndex(0);
    setError("");
    updateRoute(playerName, fight.fight_id);
  }

  function handleBack() {
    setSelectedPlayer(null);
    setSelectedFightId(null);
    setSelectedFight(null);
    setPlayerFights([]);
    setSelectedLogIndex(0);
    setError("");
    updateRoute(null, null);
  }

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div>
            <p className={styles.eyebrow}>OSRS PvP Fight Tracker</p>
            <h1 className={styles.title}>{selectedPlayer ?? "Players"}</h1>
          </div>
        </div>

        <input
          className={styles.searchInput}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={selectedPlayer ? "Search opponent" : "Search player"}
          value={search}
        />

        <div className={styles.sidebarMeta}>
          <span className={styles.metaText}>
            {selectedPlayer
              ? `${filteredPlayerFights.length} fight${filteredPlayerFights.length === 1 ? "" : "s"}`
              : `${filteredPlayers.length} player${filteredPlayers.length === 1 ? "" : "s"}`}
          </span>
          <button
            className={`${styles.backButton} ${selectedPlayer ? "" : styles.hidden}`}
            onClick={handleBack}
            type="button"
          >
            Back
          </button>
        </div>

        <div className={styles.list}>
          {selectedPlayer
            ? filteredPlayerFights.map((fight) => {
              const selectedClass = selectedFightId === fight.fight_id ? styles.cardButtonActive : "";
              const isCompetitor = fight.competitor_name === selectedPlayer;
              const selectedDead = isCompetitor ? fight.competitor_dead : fight.opponent_dead;
              const opponentName = isCompetitor ? fight.opponent_name : fight.competitor_name;
              const opponentDead = isCompetitor ? fight.opponent_dead : fight.competitor_dead;

              return (
                <button
                  className={`${styles.cardButton} ${selectedClass}`}
                  key={fight.fight_id}
                  onClick={() => void handleFightClick(fight)}
                  type="button"
                >
                  <h3 className={styles.fightName}>
                    {selectedDead ? <span className={styles.deathIcon}>☠ </span> : null}
                    {selectedPlayer} vs {opponentDead ? <span className={styles.deathIcon}>☠ </span> : null}
                    {opponentName}
                  </h3>
                  <div className={styles.cardMeta}>
                    W{fight.world}{fight.fight_type !== "NORMAL" ? ` • ${fight.fight_type}` : ""} • {fight.fight_id}
                  </div>
                  <div className={styles.cardMeta}>
                    <SyncStatusBadge synced={fight.has_secondary_pov} />
                  </div>
                </button>
              );
            })
            : filteredPlayers.map((player) => (
              <button
                className={styles.cardButton}
                key={player.player_name}
                onClick={() => handlePlayerClick(player.player_name)}
                type="button"
              >
                <h3 className={styles.playerName}>{player.player_name}</h3>
                <div className={styles.cardMeta}>
                  {player.fight_count} fight{player.fight_count === 1 ? "" : "s"}
                </div>
              </button>
            ))}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.stack}>
          {error ? (
            <section className={styles.emptyState}>
              <h2>Unable to load data</h2>
              <p>{error}</p>
            </section>
          ) : null}

          {!selectedFight ? (
            selectedPlayer ? (
              <PlayerDashboard
                key={selectedPlayer}
                stats={playerStats}
                loading={statsLoading}
                onPlayerClick={handlePlayerClick}
              />
            ) : (
              <HomeDashboard
                stats={globalStats}
                loading={statsLoading}
                onPlayerClick={handlePlayerClick}
                onFightClick={handleFightClick}
              />
            )
          ) : (
            <>
              <section className={styles.topGrid}>
                <div className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Fight Summary</h2>
                    <SyncStatusBadge synced={selectedFight.has_secondary_pov} />
                  </div>
                  <div className={styles.summaryCardContent}>
                    <div className={styles.summaryNameRow}>
                      <div
                        className={`${styles.summaryName} ${styles.summaryNameLeft} ${styles.clickablePlayerName} ${selectedFight.full_data.c.x ? styles.summaryDanger : ""}`}
                        onClick={() => handlePlayerClick(selectedFight.full_data.c.n)}
                      >
                        {selectedFight.full_data.c.x ? "☠ " : ""}
                        {selectedFight.full_data.c.n}
                      </div>
                      <div className={styles.summaryVS}>VS</div>
                      <div
                        className={`${styles.summaryName} ${styles.summaryNameRight} ${!isHiddenRsn(selectedFight.full_data.o.n) ? styles.clickablePlayerName : ""} ${selectedFight.full_data.o.x ? styles.summaryDanger : ""}`}
                        onClick={() => {
                          if (!isHiddenRsn(selectedFight.full_data.o.n)) {
                            handlePlayerClick(selectedFight.full_data.o.n);
                          }
                        }}
                      >
                        {selectedFight.full_data.o.x ? "☠ " : ""}
                        {selectedFight.full_data.o.n}
                      </div>
                    </div>

                    {getSummaryRows(selectedFight.full_data).map((row) => (
                      <div className={styles.summaryStatRow} key={row.index}>
                        <div className={`${styles.summaryValue} ${styles.summaryValueLeft} ${row.leftClass ?? ""}`}>{row.left}</div>
                        <div className={`${styles.summaryIndex} ${styles.tooltipTarget}`} data-tooltip={SUMMARY_TOOLTIPS[row.index]}>{row.index}</div>
                        <div className={`${styles.summaryValue} ${styles.summaryValueRight} ${row.rightClass ?? ""}`}>
                          {row.right}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={`${styles.sectionHeader} ${styles.centeredHeader}`}>
                    <h2 className={styles.sectionTitle}>Attack Summary</h2>
                  </div>
                  <div className={styles.attackSummary}>
                    {[selectedFight.full_data.c.n, selectedFight.full_data.o.n].map((name) => {
                      const logs = visibleLogs.filter((entry) => attackerNameForEntry(selectedFight.full_data, entry) === name);
                      const counts = new Map<string, number>();
                      let melee = 0;
                      let ranged = 0;
                      let magic = 0;

                      for (const entry of logs) {
                        const style = entry.m ?? "UNKNOWN";
                        const weaponId = entry.G?.[3] ?? 0;
                        const key = `${style}|${weaponId}`;
                        counts.set(key, (counts.get(key) ?? 0) + 1);

                        if (style.startsWith("MELEE")) melee += 1;
                        else if (style.startsWith("RANGED")) ranged += 1;
                        else if (style.startsWith("MAGIC")) magic += 1;
                      }

                      const rows = [...counts.entries()].sort((left, right) => right[1] - left[1]);

                      return (
                        <div className={styles.attackColumn} key={name}>
                          <h3 className={styles.clickablePlayerName} onClick={() => handlePlayerClick(name)}>{name}</h3>
                          <p className={styles.metaText}>{melee} Melee Attack(s)</p>
                          <p className={styles.metaText}>{ranged} Ranged Attack(s)</p>
                          <p className={styles.metaText}>{magic} Magic Attack(s)</p>
                          {rows.map(([key, count]) => {
                            const [style, weaponId] = key.split("|");
                            const normalizedWeaponId = normalizeEquipmentItemId(Number(weaponId));
                            const styleIcon = getAttackStyleIcon(style, normalizedWeaponId);
                            const weaponIcon = getWeaponIcon(normalizedWeaponId);
                            return (
                              <div className={styles.attackSummaryRow} key={key}>
                                <span className={styles.attackCount}>{count}x</span>
                                <div className={styles.attackIcons}>
                                  <IconLabel
                                    icon={styleIcon}
                                    text={style}
                                    hideText
                                  />
                                  {weaponIcon ? (
                                    <span className={styles.tooltipTarget} data-tooltip={weaponIcon.label}>
                                      <Image
                                        alt={weaponIcon.alt}
                                        className={styles.iconImage}
                                        height={18}
                                        src={weaponIcon.src}
                                        width={18}
                                      />
                                    </span>
                                  ) : weaponId !== "0" ? (
                                    <span className={styles.metaText}>• wep {normalizedWeaponId ?? weaponId}</span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className={`${styles.fightLogArea} ${selectedLog ? styles.drawerOpen : ""}`}>
                <div className={styles.panel}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Fight Log</h2>
                    <span className={styles.metaText}>
                      Duration {formatElapsedFromTickDelta(Math.max(0, (visibleLogs[visibleLogs.length - 1]?.T ?? 0) - (visibleLogs[0]?.T ?? 0)), false)} • {visibleLogs.length} entries{selectedLog ? " • click a row to inspect" : ""}
                    </span>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Attacker</th>
                          <th>Style</th>
                          <th>Hit Range</th>
                          <th>Accuracy</th>
                          <th>Avg Hit</th>
                          <th>Actual Dmg</th>
                          <th>HP</th>
                          <th>KO Chance</th>
                          <th>Special?</th>
                          <th>Off-Pray?</th>
                          <th>Def Prayer</th>
                          <th>Splash</th>
                          <th>Offensive Pray</th>
                          <th>Time (Tick)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleLogs.map((log, index) => {
                          const hpValue =
                            log.displayHpBefore != null && log.oH != null
                              ? `${log.displayHpBefore}/${log.oH}`
                              : log.displayHpBefore != null
                                ? String(log.displayHpBefore)
                                : "-";

                          return (
                            <tr
                              className={`${styles.tableRow} ${selectedLogIndex === index ? styles.tableRowActive : ""}`}
                              key={`${log.T}-${log.t}-${index}`}
                              onClick={() => setSelectedLogIndex(index)}
                            >
                              <td>{attackerNameForEntry(selectedFight.full_data, log)}</td>
                              <td>
                                <span className={styles.iconLabel}>
                                  <IconLabel
                                    icon={getAttackStyleIcon(log.m, getWeaponItemId(log.G))}
                                    text={log.m ?? "-"}
                                    hideText
                                  />
                                  {(() => {
                                    const weaponId = getWeaponItemId(log.G);
                                    const weaponIcon = getWeaponIcon(weaponId);
                                    return weaponIcon ? (
                                      <span className={styles.tooltipTarget} data-tooltip={weaponIcon.label}>
                                        <Image
                                          alt={weaponIcon.alt}
                                          className={styles.iconImage}
                                          height={18}
                                          src={weaponIcon.src}
                                          width={18}
                                        />
                                      </span>
                                    ) : null;
                                  })()}
                                </span>
                              </td>
                              <td>{`${log.l ?? 0}-${log.h ?? 0}`}</td>
                              <td>{formatPercentNumber((log.a ?? 0) * 100)}</td>
                              <td>{number2.format(log.d ?? 0)}</td>
                              <td>{log.s && (log.m ?? "").startsWith("MAGIC") ? "SPLASH" : (log.aD ?? "-")}</td>
                              <td>{hpValue}</td>
                              <td>
                                {log.displayKoChance != null || log.k != null
                                  ? formatPercentFromRatio(log.displayKoChance ?? log.k ?? 0)
                                  : "-"}
                              </td>
                              <td>{log.m?.includes("SPEC") ? "✔" : ""}</td>
                              <td>{log.O !== log.o ? "✔" : ""}</td>
                              <td>
                                <span className={styles.tablePrayerCell}>
                                  <IconLabel
                                    icon={getOverheadIcon(log.o)}
                                    text={log.o ?? "-"}
                                    hideText
                                  />
                                  {log.E ? <span className={styles.prayerTag}>ELY</span> : null}
                                  {log.S ? <span className={styles.prayerTag}>SOTD</span> : null}
                                </span>
                              </td>
                              <td>{(log.m ?? "").startsWith("MAGIC") ? (log.s ? "Splash" : "Hit") : "-"}</td>
                              <td>
                                <IconLabel
                                  icon={getOffensivePrayerIcon(log.p)}
                                  text={getOffensivePrayerText(log.p)}
                                  hideText
                                />
                              </td>
                              <td>{formatLogTime(log, visibleLogs[0]?.T ?? 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedLog ? (() => {
                  const fight = selectedFight;
                  if (!fight) return null;

                  const attackerName = attackerDataForEntry(fight.full_data, selectedLog).attackerName;
                  const defenderName = attackerDataForEntry(fight.full_data, selectedLog).defenderName;

                  const fightType = fight.full_data.l || "NORMAL";
                  const defaultLevels = DEFAULT_COMBAT_LEVELS_BY_TYPE[fightType] || DEFAULT_COMBAT_LEVELS_BY_TYPE.NORMAL;

                  const aLevels = selectedLog.C || defaultLevels;

                  const isCompetitorAttacker = attackerName === fight.full_data.c?.n;
                  const attackerAttackLogs = isCompetitorAttacker ? fight.full_data.c?.l : fight.full_data.o?.l;
                  const defenderAttackLogs = isCompetitorAttacker ? fight.full_data.o?.l : fight.full_data.c?.l;
                  const matchingDefenderLog = findNearestAttackSnapshot(defenderAttackLogs, selectedLog);
                  const attackerEquipmentSnapshot = findLatestEquipmentSnapshot(attackerAttackLogs, selectedLog, "G");
                  const defenderEquipmentSnapshot = findLatestEquipmentSnapshot(defenderAttackLogs, selectedLog, "G");
                  const observedDefenderSnapshot = findLatestEquipmentSnapshot(attackerAttackLogs, selectedLog, "g");

                  const attackerGear = attackerEquipmentSnapshot?.G ?? selectedLog.G;
                  const attackerRing = attackerEquipmentSnapshot?.R ?? selectedLog.R;
                  const attackerAmmoId = attackerEquipmentSnapshot?.A ?? selectedLog.A;

                  const dGear = defenderEquipmentSnapshot?.G ?? observedDefenderSnapshot?.g ?? selectedLog.g;
                  const defenderRing = defenderEquipmentSnapshot?.R;
                  const defenderAmmoId = defenderEquipmentSnapshot?.A;
                  const dLevels = defenderEquipmentSnapshot?.C || matchingDefenderLog?.C || defaultLevels;

                  // Render single equipment slot
                  const renderSlot = (itemId: number | undefined, slotName: string, placeholder?: string) => {
                    const isRawId = slotName === "Ring" || slotName === "Ammunition";
                    const normalized = itemId && itemId > 0
                      ? (isRawId ? itemId : (itemId > 2048 ? itemId - 2048 : itemId))
                      : 0;
                    const stats = fight.item_stats?.[normalized];

                    if (normalized > 0 && stats && stats.image_url) {
                      const filename = decodeURIComponent(stats.image_url.split('/').pop()?.split('?')[0] || "");
                      return (
                        <div className={`${styles.eqSlot} ${styles.tooltipTarget}`} data-tooltip={`${stats.name} (${slotName})`}>
                          <Image
                            src={`/${filename}`}
                            alt={stats.name}
                            width={32}
                            height={32}
                            className={styles.eqImage}
                          />
                        </div>
                      );
                    }

                    if (placeholder) {
                      return (
                        <div className={`${styles.eqSlotEmpty} ${styles.tooltipTarget}`} data-tooltip={`Empty ${slotName}`}>
                          <Image
                            src={placeholder}
                            alt="Empty"
                            width={32}
                            height={32}
                            className={styles.eqPlaceholder}
                          />
                        </div>
                      );
                    }

                    return (
                      <div className={`${styles.eqSlotEmpty} ${styles.tooltipTarget}`} data-tooltip={`Empty ${slotName}`}>
                        <span className={styles.eqNoSymbol}>🚫</span>
                      </div>
                    );
                  };

                  // Calculate attacker and defender bonuses
                  const aBonuses = calculateBonuses(attackerGear, attackerRing, attackerAmmoId);
                  const dBonuses = calculateBonuses(dGear, defenderRing, defenderAmmoId);

                  function calculateBonuses(
                    gear: number[] | undefined,
                    ringIdFromLog: number | null | undefined,
                    ammoIdFromLog: number | null | undefined
                  ) {
                    const b = {
                      stabAtk: 0, slashAtk: 0, crushAtk: 0, magicAtk: 0, rangedAtk: 0,
                      stabDef: 0, slashDef: 0, crushDef: 0, magicDef: 0, rangedDef: 0,
                      str: 0, rstr: 0, mdmg: 0,
                    };
                    if (!gear) return b;

                    for (const id of gear) {
                      if (id <= 0) continue;
                      const normalized = id > 2048 ? id - 2048 : id;
                      const stats = fight.item_stats?.[normalized];
                      if (stats) {
                        b.stabAtk += Number(stats.stab_attack || 0);
                        b.slashAtk += Number(stats.slash_attack || 0);
                        b.crushAtk += Number(stats.crush_attack || 0);
                        b.magicAtk += Number(stats.magic_attack || 0);
                        b.rangedAtk += Number(stats.ranged_attack || 0);

                        b.stabDef += Number(stats.stab_defence || 0);
                        b.slashDef += Number(stats.slash_defence || 0);
                        b.crushDef += Number(stats.crush_defence || 0);
                        b.magicDef += Number(stats.magic_defence || 0);
                        b.rangedDef += Number(stats.ranged_defence || 0);

                        b.str += Number(stats.strength || 0);
                        b.rstr += Number(stats.ranged_strength || 0);
                        b.mdmg += Number(stats.magic_damage || 0);
                      }
                    }

                    // Ammo strength calculation
                    if (ammoIdFromLog && ammoIdFromLog > 0) {
                      const ammoStats = fight.item_stats?.[ammoIdFromLog];
                      if (ammoStats) {
                        b.rstr += Number(ammoStats.ranged_strength || 0);
                      } else {
                        const weaponId = gear[3] ? (gear[3] > 2048 ? gear[3] - 2048 : gear[3]) : 0;
                        b.rstr += getWeaponAmmoStrength(weaponId);
                      }
                    } else {
                      const weaponId = gear[3] ? (gear[3] > 2048 ? gear[3] - 2048 : gear[3]) : 0;
                      b.rstr += getWeaponAmmoStrength(weaponId);
                    }

                    // Add ring bonuses
                    const ringId = ringIdFromLog && ringIdFromLog > 0 ? ringIdFromLog : getDefaultRing(fightType).id;
                    const ringStats = fight.item_stats?.[ringId];
                    if (ringStats) {
                      b.stabAtk += Number(ringStats.stab_attack || 0);
                      b.slashAtk += Number(ringStats.slash_attack || 0);
                      b.crushAtk += Number(ringStats.crush_attack || 0);
                      b.magicAtk += Number(ringStats.magic_attack || 0);
                      b.rangedAtk += Number(ringStats.ranged_attack || 0);

                      b.stabDef += Number(ringStats.stab_defence || 0);
                      b.slashDef += Number(ringStats.slash_defence || 0);
                      b.crushDef += Number(ringStats.crush_defence || 0);
                      b.magicDef += Number(ringStats.magic_defence || 0);
                      b.rangedDef += Number(ringStats.ranged_defence || 0);

                      b.str += Number(ringStats.strength || 0);
                      b.rstr += Number(ringStats.ranged_strength || 0);
                      b.mdmg += Number(ringStats.magic_damage || 0);
                    }

                    return b;
                  }

                  // Ammo and Ring configuration
                  const aWeaponId = attackerGear ? getWeaponItemId(attackerGear) : null;
                  const aAmmo = aWeaponId ? getWeaponAmmoIconAndName(aWeaponId) : null;
                  const dWeaponId = dGear ? getWeaponItemId(dGear) : null;
                  const dAmmo = dWeaponId ? getWeaponAmmoIconAndName(dWeaponId) : null;

                  const defaultRingObj = getDefaultRing(fightType);

                  return (
                    <div className={styles.drawer} key={selectedLogIndex}>
                      <div className={styles.popoutContainer}>
                        {/* Attacker column */}
                        <div className={styles.popoutColumn}>
                          <div className={styles.popoutFighterHeader}>
                            <span className={styles.tooltipTarget} data-tooltip={selectedLog.m ?? undefined}>
                              <Image
                                src={getAttackStyleIcon(selectedLog.m, aWeaponId).src}
                                alt="Attacker Style"
                                width={18}
                                height={18}
                                className={styles.popoutHeaderIcon}
                              />
                            </span>
                            <div className={styles.popoutNameText}>
                              <span className={styles.popoutRoleLabel}>Attacker</span>
                              <strong>{attackerName}</strong>
                            </div>
                          </div>

                          <div className={styles.popoutPraysLine}>
                            <div className={styles.prayerRow}>
                              <span className={styles.prayerTitle}>Overhead:</span>
                              <IconLabel
                                icon={getOverheadIcon(selectedLog.O)}
                                text={selectedLog.O ? (selectedLog.O.charAt(0) + selectedLog.O.slice(1).toLowerCase()) : "N/A"}
                              />
                            </div>
                            <div className={styles.prayerRow}>
                              <span className={styles.prayerTitle}>Offensive:</span>
                              <IconLabel
                                icon={getOffensivePrayerIcon(selectedLog.p)}
                                text={getOffensivePrayerText(selectedLog.p)}
                              />
                            </div>
                          </div>

                          {/* Skill levels */}
                          <div className={styles.popoutLevelsGrid}>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Attack Level">
                              <Image src="/Attack_icon.png" alt="Atk" width={14} height={14} />
                              <span>{aLevels.a}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Strength Level">
                              <Image src="/Strength_icon.png" alt="Str" width={14} height={14} />
                              <span>{aLevels.s}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Defence Level">
                              <Image src="/Defence_icon.png" alt="Def" width={14} height={14} />
                              <span>{aLevels.d}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Ranged Level">
                              <Image src="/Ranged_icon.png" alt="Range" width={14} height={14} />
                              <span>{aLevels.r}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Magic Level">
                              <Image src="/Magic_icon.png" alt="Mage" width={14} height={14} />
                              <span>{aLevels.m}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Hitpoints Level">
                              <Image src="/Hitpoints_icon.png" alt="HP" width={14} height={14} />
                              <span>{aLevels.h}</span>
                            </div>
                          </div>

                          {/* Equipment Layout Grid */}
                          <div className={styles.equipmentGrid}>
                            {/* Row 1 */}
                            <div />
                            {renderSlot(attackerGear?.[0], "Head")}
                            <div />

                            {/* Row 2 */}
                            {renderSlot(attackerGear?.[1], "Cape")}
                            {renderSlot(attackerGear?.[2], "Amulet")}
                            {attackerAmmoId && attackerAmmoId > 0 ? (
                              renderSlot(attackerAmmoId, "Ammunition")
                            ) : aAmmo ? (
                              <div className={`${styles.eqSlot} ${styles.tooltipTarget}`} data-tooltip={`${aAmmo.name} (Ammunition)`}>
                                <Image src={aAmmo.src} alt={aAmmo.name} width={32} height={32} />
                              </div>
                            ) : renderSlot(undefined, "Ammunition")}

                            {/* Row 3 */}
                            {renderSlot(attackerGear?.[3], "Weapon")}
                            {renderSlot(attackerGear?.[4], "Torso")}
                            {renderSlot(attackerGear?.[5], "Shield")}

                            {/* Row 4 */}
                            <div />
                            {renderSlot(attackerGear?.[7], "Legs")}
                            <div />

                            {/* Row 5 */}
                            {renderSlot(attackerGear?.[9], "Hands")}
                            {renderSlot(attackerGear?.[10], "Feet")}
                            {attackerRing && attackerRing > 0 ? (
                              renderSlot(attackerRing, "Ring")
                            ) : (
                              <div className={`${styles.eqSlot} ${styles.tooltipTarget}`} data-tooltip={`${defaultRingObj.name} (Ring)`}>
                                <Image src={defaultRingObj.src} alt={defaultRingObj.name} width={32} height={32} />
                              </div>
                            )}
                          </div>

                          {/* Bonuses */}
                          <div className={styles.popoutBonuses}>
                            <h4 className={styles.bonusHeader}>Attack bonus</h4>
                            <div className={styles.bonusLine}>Stab: {formatSignedNumber(aBonuses.stabAtk)}</div>
                            <div className={styles.bonusLine}>Slash: {formatSignedNumber(aBonuses.slashAtk)}</div>
                            <div className={styles.bonusLine}>Crush: {formatSignedNumber(aBonuses.crushAtk)}</div>
                            <div className={styles.bonusLine}>Magic: {formatSignedNumber(aBonuses.magicAtk)}</div>
                            <div className={styles.bonusLine}>Range: {formatSignedNumber(aBonuses.rangedAtk)}</div>

                            <h4 className={styles.bonusHeader}>Defence bonus</h4>
                            <div className={styles.bonusLine}>Stab: {formatSignedNumber(aBonuses.stabDef)}</div>
                            <div className={styles.bonusLine}>Slash: {formatSignedNumber(aBonuses.slashDef)}</div>
                            <div className={styles.bonusLine}>Crush: {formatSignedNumber(aBonuses.crushDef)}</div>
                            <div className={styles.bonusLine}>Magic: {formatSignedNumber(aBonuses.magicDef)}</div>
                            <div className={styles.bonusLine}>Range: {formatSignedNumber(aBonuses.rangedDef)}</div>

                            <h4 className={styles.bonusHeader}>Other bonuses</h4>
                            <div className={styles.bonusLine}>Melee strength: {formatSignedNumber(aBonuses.str)}</div>
                            <div className={styles.bonusLine}>Ranged strength: {formatSignedNumber(aBonuses.rstr)}</div>
                            <div className={styles.bonusLine}>Magic damage: {formatSignedNumber(aBonuses.mdmg, number1)}%</div>
                          </div>
                        </div>

                        {/* Defender column */}
                        <div className={styles.popoutColumn}>
                          <div className={styles.popoutFighterHeader}>
                            <div className={styles.popoutNameText}>
                              <span className={styles.popoutRoleLabel}>Defender</span>
                              <strong>{defenderName}</strong>
                            </div>
                          </div>

                          <div className={styles.popoutPraysLine}>
                            <div className={styles.prayerRow}>
                              <span className={styles.prayerTitle}>Overhead:</span>
                              <IconLabel
                                icon={getOverheadIcon(selectedLog.o)}
                                text={selectedLog.o ? (selectedLog.o.charAt(0) + selectedLog.o.slice(1).toLowerCase()) : "N/A"}
                              />
                            </div>
                            <div className={styles.prayerRow}>
                              <span className={styles.prayerTitle}>Offensive:</span>
                              {defenderEquipmentSnapshot ?? matchingDefenderLog ? (
                                <IconLabel
                                  icon={getOffensivePrayerIcon((defenderEquipmentSnapshot ?? matchingDefenderLog)?.p)}
                                  text={getOffensivePrayerText((defenderEquipmentSnapshot ?? matchingDefenderLog)?.p)}
                                />
                              ) : (
                                <span className={styles.popoutNA}>N/A</span>
                              )}
                            </div>
                          </div>

                          {/* Skill levels */}
                          <div className={styles.popoutLevelsGrid}>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Attack Level">
                              <Image src="/Attack_icon.png" alt="Atk" width={14} height={14} />
                              <span>{dLevels.a}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Strength Level">
                              <Image src="/Strength_icon.png" alt="Str" width={14} height={14} />
                              <span>{dLevels.s}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Defence Level">
                              <Image src="/Defence_icon.png" alt="Def" width={14} height={14} />
                              <span>{dLevels.d}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Ranged Level">
                              <Image src="/Ranged_icon.png" alt="Range" width={14} height={14} />
                              <span>{dLevels.r}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Magic Level">
                              <Image src="/Magic_icon.png" alt="Mage" width={14} height={14} />
                              <span>{dLevels.m}</span>
                            </div>
                            <div className={`${styles.levelItem} ${styles.tooltipTarget}`} data-tooltip="Hitpoints Level">
                              <Image src="/Hitpoints_icon.png" alt="HP" width={14} height={14} />
                              <span>{dLevels.h}</span>
                            </div>
                          </div>

                          {/* Equipment Layout Grid */}
                          <div className={styles.equipmentGrid}>
                            {/* Row 1 */}
                            <div />
                            {renderSlot(dGear?.[0], "Head")}
                            <div />

                            {/* Row 2 */}
                            {renderSlot(dGear?.[1], "Cape")}
                            {renderSlot(dGear?.[2], "Amulet")}
                            {defenderAmmoId && defenderAmmoId > 0 ? (
                              renderSlot(defenderAmmoId, "Ammunition")
                            ) : dAmmo ? (
                              <div className={`${styles.eqSlot} ${styles.tooltipTarget}`} data-tooltip={`${dAmmo.name} (Ammunition)`}>
                                <Image src={dAmmo.src} alt={dAmmo.name} width={32} height={32} />
                              </div>
                            ) : renderSlot(undefined, "Ammunition")}

                            {/* Row 3 */}
                            {renderSlot(dGear?.[3], "Weapon")}
                            {renderSlot(dGear?.[4], "Torso")}
                            {renderSlot(dGear?.[5], "Shield")}

                            {/* Row 4 */}
                            <div />
                            {renderSlot(dGear?.[7], "Legs")}
                            <div />

                            {/* Row 5 */}
                            {renderSlot(dGear?.[9], "Hands")}
                            {renderSlot(dGear?.[10], "Feet")}
                            {defenderRing && defenderRing > 0 ? (
                              renderSlot(defenderRing, "Ring")
                            ) : (
                              <div className={`${styles.eqSlot} ${styles.tooltipTarget}`} data-tooltip={`${defaultRingObj.name} (Ring)`}>
                                <Image src={defaultRingObj.src} alt={defaultRingObj.name} width={32} height={32} />
                              </div>
                            )}
                          </div>

                          {/* Bonuses */}
                          <div className={styles.popoutBonuses}>
                            <h4 className={styles.bonusHeader}>Attack bonus</h4>
                            <div className={styles.bonusLine}>Stab: {formatSignedNumber(dBonuses.stabAtk)}</div>
                            <div className={styles.bonusLine}>Slash: {formatSignedNumber(dBonuses.slashAtk)}</div>
                            <div className={styles.bonusLine}>Crush: {formatSignedNumber(dBonuses.crushAtk)}</div>
                            <div className={styles.bonusLine}>Magic: {formatSignedNumber(dBonuses.magicAtk)}</div>
                            <div className={styles.bonusLine}>Range: {formatSignedNumber(dBonuses.rangedAtk)}</div>

                            <h4 className={styles.bonusHeader}>Defence bonus</h4>
                            <div className={styles.bonusLine}>Stab: {formatSignedNumber(dBonuses.stabDef)}</div>
                            <div className={styles.bonusLine}>Slash: {formatSignedNumber(dBonuses.slashDef)}</div>
                            <div className={styles.bonusLine}>Crush: {formatSignedNumber(dBonuses.crushDef)}</div>
                            <div className={styles.bonusLine}>Magic: {formatSignedNumber(dBonuses.magicDef)}</div>
                            <div className={styles.bonusLine}>Range: {formatSignedNumber(dBonuses.rangedDef)}</div>

                            <h4 className={styles.bonusHeader}>Other bonuses</h4>
                            <div className={styles.bonusLine}>Melee strength: {formatSignedNumber(dBonuses.str)}</div>
                            <div className={styles.bonusLine}>Ranged strength: {formatSignedNumber(dBonuses.rstr)}</div>
                            <div className={styles.bonusLine}>Magic damage: {formatSignedNumber(dBonuses.mdmg, number1)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : null}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
