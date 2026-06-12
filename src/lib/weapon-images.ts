const WEAPON_IMAGE_VARIANTS_BY_ITEM_ID: Record<number, number> = {
  1263: 1249, // Dragon spear (p)
  3176: 1249, // Dragon spear (kp)
  5716: 1249, // Dragon spear (p+)
  5730: 1249, // Dragon spear (p++)
  20000: 4587, // Dragon scimitar (or)
  20406: 4587, // Dragon scimitar (Last Man Standing)
  20431: 4675, // Ancient staff (Last Man Standing)
  28031: 4587, // Dragon scimitar (cr)
  28041: 1249, // Dragon spear (cr)
  28043: 1249, // Dragon spear (cr)(p)
  28045: 1249, // Dragon spear (cr)(p+)
  28047: 1249, // Dragon spear (cr)(p++)
};

export const WEAPON_IMAGES_BY_ITEM_ID: Record<number, string> = {
  861: "/Magic_shortbow.png", // MAGIC_SHORTBOW
  1215: "/Dragon_dagger.png", // DRAGON_DAGGER
  1231: "/Dragon_dagger.png", // DRAGON_DAGGER
  1305: "/Dragon_longsword.png", // DRAGON_LONGSWORD
  4151: "/Abyssal_whip.png", // ABYSSAL_WHIP
  4153: "/Granite_maul.png", // GRANITE_MAUL
  4214: "/Crystal_bow.png", // CRYSTAL_BOW
  4215: "/Crystal_bow.png", // CRYSTAL_BOW
  4216: "/Crystal_bow.png", // CRYSTAL_BOW
  4217: "/Crystal_bow.png", // CRYSTAL_BOW
  4218: "/Crystal_bow.png", // CRYSTAL_BOW
  4219: "/Crystal_bow.png", // CRYSTAL_BOW
  4220: "/Crystal_bow.png", // CRYSTAL_BOW
  4221: "/Crystal_bow.png", // CRYSTAL_BOW
  4222: "/Crystal_bow.png", // CRYSTAL_BOW
  4223: "/Crystal_bow.png", // CRYSTAL_BOW
  4710: "/Ahrim's_staff.png", // AHRIMS_STAFF
  4734: "/Karil's_crossbow.png", // KARILS_CROSSBOW
  4755: "/Verac's_flail.png", // VERACS_FLAIL
  4934: "/Karil's_crossbow.png", // KARILS_CROSSBOW
  4935: "/Karil's_crossbow.png", // KARILS_CROSSBOW
  4936: "/Karil's_crossbow.png", // KARILS_CROSSBOW
  4937: "/Karil's_crossbow.png", // KARILS_CROSSBOW
  4938: "/Karil's_crossbow.png", // KARILS_CROSSBOW
  5680: "/Dragon_dagger.png", // DRAGON_DAGGER
  5698: "/Dragon_dagger.png", // DRAGON_DAGGER
  9185: "/Rune_crossbow.png", // RUNE_CROSSBOW
  11235: "/Dark_bow.png", // DARK_BOW
  11749: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11750: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11751: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11752: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11753: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11754: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11755: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11756: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11757: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11758: "/Crystal_bow.png", // CRYSTAL_BOW_I
  11785: "/Armadyl_crossbow.png", // ARMADYL_CROSSBOW
  11791: "/Staff_of_the_dead.png", // STAFF_OF_THE_DEAD
  11802: "/Armadyl_godsword.png", // ARMADYL_GODSWORD
  11998: "/Smoke_battlestaff.png", // SMOKE_BATTLESTAFF
  12765: "/Dark_bow.png", // DARK_BOW
  12766: "/Dark_bow.png", // DARK_BOW
  12767: "/Dark_bow.png", // DARK_BOW
  12768: "/Dark_bow.png", // DARK_BOW
  12788: "/Magic_shortbow.png", // MAGIC_SHORTBOW_I
  12848: "/Granite_maul.png", // GRANITE_MAUL
  12926: "/Toxic_blowpipe.png", // TOXIC_BLOWPIPE
  13265: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  13267: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  13269: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  13271: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  13576: "/Dragon_warhammer.png", // DRAGON_WARHAMMER
  13652: "/Dragon_claws.png", // DRAGON_CLAWS
  19478: "/Light_ballista.png", // LIGHT_BALLISTA
  19481: "/Heavy_ballista.png", // HEAVY_BALLISTA
  20368: "/Armadyl_godsword.png", // ARMADYL_GODSWORD
  20405: "/Abyssal_whip.png", // ABYSSAL_WHIP
  20407: "/Dragon_dagger.png", // DRAGON_DAGGER
  20408: "/Dark_bow.png", // DARK_BOW
  20557: "/Granite_maul.png", // GRANITE_MAUL
  20593: "/Armadyl_godsword.png", // ARMADYL_GODSWORD
  20784: "/Dragon_claws.png", // DRAGON_CLAWS
  20785: "/Dragon_warhammer.png", // DRAGON_WARHAMMER
  21003: "/Elder_maul.png", // ELDER_MAUL
  21006: "/Kodai_wand.png", // KODAI_WAND
  21012: "/Dragon_hunter_crossbow.png", // DRAGON_HUNTER_CROSSBOW
  21205: "/Elder_maul.png", // ELDER_MAUL
  21902: "/Dragon_crossbow.png", // DRAGON_CROSSBOW
  22324: "/Ghrazi_rapier.png", // GHRAZI_RAPIER
  22613: "/Vesta's_blighted_longsword.png", // VESTAS_LONGSWORD
  22622: "/Statius's_warhammer_(bh).png", // STATIUS_WARHAMMER
  22636: "/Morrigan's_javelin_(bh).png", // MORRIGANS_JAVELIN
  22647: "/Zuriel's_staff_(bh).png", // ZURIELS_STAFF
  23601: "/Rune_crossbow.png", // RUNE_CROSSBOW
  23611: "/Armadyl_crossbow.png", // ARMADYL_CROSSBOW
  23613: "/Staff_of_the_dead.png", // STAFF_OF_THE_DEAD
  23615: "/Vesta's_blighted_longsword.png", // VESTAS_LONGSWORD
  23617: "/Zuriel's_staff_(bh).png", // ZURIELS_STAFF
  23619: "/Morrigan's_javelin_(bh).png", // MORRIGANS_JAVELIN
  23620: "/Statius's_warhammer_(bh).png", // STATIUS_WARHAMMER
  23626: "/Kodai_wand.png", // KODAI_WAND
  23628: "/Ghrazi_rapier.png", // GHRAZI_RAPIER
  23630: "/Heavy_ballista.png", // HEAVY_BALLISTA
  23653: "/Ahrim's_staff.png", // AHRIMS_STAFF
  23971: "/Crystal_helm_(deadman).png", // CRYSTAL_HELM
  23979: "/Crystal_legs_(deadman).png", // CRYSTAL_LEGS
  23983: "/Crystal_bow.png", // CRYSTAL_BOW
  24225: "/Granite_maul.png", // GRANITE_MAUL
  24227: "/Granite_maul.png", // GRANITE_MAUL
  24417: "/Inquisitor's_mace.png", // INQUISITORS_MACE
  24424: "/Volatile_nightmare_staff.png", // VOLATILE_NIGHTMARE_STAFF
  24617: "/Vesta's_blighted_longsword.png", // VESTAS_LONGSWORD
  25865: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25867: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25869: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25884: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25886: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25888: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25890: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25892: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25894: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  25896: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  26219: "/Osmumten's_fang.png", // OSMUMTENS_FANG
  26233: "/Ancient_godsword.png", // ANCIENT_GODSWORD
  26374: "/Zaryte_crossbow.png", // ZARYTE_CROSSBOW
  27184: "/Ancient_godsword.png", // ANCIENT_GODSWORD
  27186: "/Zaryte_crossbow.png", // ZARYTE_CROSSBOW
  27187: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  27188: "/Light_ballista.png", // LIGHT_BALLISTA
  27189: "/Verac's_flail.png", // VERACS_FLAIL
  27198: "/Inquisitor's_mace.png", // INQUISITORS_MACE
  27246: "/Osmumten's_fang.png", // OSMUMTENS_FANG
  27690: "/Voidwaker.png", // VOIDWAKER
  27861: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  27863: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  27865: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  27867: "/Abyssal_dagger.png", // ABYSSAL_DAGGER
  27869: "/Voidwaker.png", // VOIDWAKER
  28869: "/Hunters'_sunlight_crossbow.png", // HUNTERS_SUNLIGHT_CROSSBOW
  28988: "/Blue_moon_spear.png", // BLUE_MOON_SPEAR
  28997: "/Dual_macuahuitl.png", // DUAL_MACUAHUITL
  29000: "/Eclipse_atlatl.png", // ECLIPSE_ATLATL
  29577: "/Burning_claws.png", // BURNING_CLAWS
  29591: "/Scorching_bow.png", // SCORCHING_BOW
  29594: "/Purging_staff.png", // PURGING_STAFF
  29605: "/Armadyl_godsword.png", // ARMADYL_GODSWORD
  29607: "/Voidwaker.png", // VOIDWAKER
  29609: "/Volatile_nightmare_staff.png", // VOLATILE_NIGHTMARE_STAFF
  29611: "/Dark_bow.png", // DARK_BOW
  29796: "/Noxious_halberd.png", // NOXIOUS_HALBERD
  29849: "/Blue_moon_spear.png", // BLUE_MOON_SPEAR
  29850: "/Dual_macuahuitl.png", // DUAL_MACUAHUITL
  29851: "/Eclipse_atlatl.png", // ECLIPSE_ATLATL
  30955: "/Arkan_blade.png", // ARKAN_BLADE
  33021: "/Bow_of_faerdhinen.png", // BOW_OF_FAERDHINEN
  33168: "/Crystal_legs_(deadman).png", // CRYSTAL_LEGS
  33170: "/Crystal_helm_(deadman).png", // CRYSTAL_HELM
  33174: "/Osmumten's_fang.png", // OSMUMTENS_FANG
  33178: "/Noxious_halberd.png", // NOXIOUS_HALBERD
  33184: "/Purging_staff.png", // PURGING_STAFF
  33200: "/Burning_claws.png", // BURNING_CLAWS
};

export function getWeaponImageByItemId(itemId?: number | null): string | null {
  if (!itemId || itemId <= 0) {
    return null;
  }

  const visited = new Set<number>();
  let currentId = itemId;

  while (!visited.has(currentId)) {
    visited.add(currentId);

    const directImage = WEAPON_IMAGES_BY_ITEM_ID[currentId];
    if (directImage) {
      return directImage;
    }

    const canonicalId = WEAPON_IMAGE_VARIANTS_BY_ITEM_ID[currentId];
    if (!canonicalId) {
      break;
    }

    currentId = canonicalId;
  }

  return null;
}
