export type FightType = "LMS_MAXMED" | "LMS_ZERK" | "LMS_1DEF" | "NORMAL";

export type HeadIconValue = string | null;

export type CombatLevels = {
  a: number;
  s: number;
  d: number;
  r: number;
  m: number;
  h: number;
};

export type FightLogEntry = {
  t: number;
  T: number;
  f: boolean;
  G?: number[];
  O?: HeadIconValue;
  m?: string;
  d: number;
  a: number;
  h: number;
  l: number;
  s: boolean;
  C?: CombatLevels | null;
  k?: number | null;
  eH?: number | null;
  oH?: number | null;
  mC: number;
  aD: number | null;
  g?: number[];
  o?: HeadIconValue;
  R?: number | null;
  A?: number | null;
  E: boolean;
  S: boolean;
  p: number;
  expectedHits: number;
  GMS: boolean;
  displayHpBefore?: number | null;
  displayHpAfter?: number | null;
  displayKoChance?: number | null;
  isPartOfTickGroup: boolean;
};

export type Fighter = {
  n: string;
  a: number;
  s: number;
  d: number;
  h: number;
  z: number;
  m: number;
  M: number;
  p: number;
  g: number;
  y: number;
  H: number;
  rh: number;
  x: boolean;
  l: FightLogEntry[];
};

export type FightPerformance = {
  c: Fighter;
  o: Fighter;
  t: number;
  fightID: string;
  l: FightType;
  w: number;
  _secondaryFight?: FightPerformance | null;
};

export type FightSummary = {
  id: number;
  fight_id: string;
  competitor_name: string;
  opponent_name: string;
  last_fight_time: number;
  fight_type: FightType;
  world: number;
  competitor_dead: boolean;
  opponent_dead: boolean;
  has_secondary_pov: boolean;
  created_at: string;
};

export type ItemStats = {
  id: number;
  name: string;
  image_url: string | null;
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

export type FightDetail = FightSummary & {
  full_data: FightPerformance;
  secondary_data: FightPerformance | null;
  item_stats?: Record<number, ItemStats>;
};

export type PlayerSummary = {
  player_name: string;
  fight_count: number;
  latest_fight_time: number;
};

export type DashboardStats = {
  totalFights: number;
  totalPlayers: number;
  activePlayers: {
    player_name: string;
    fight_count: number;
    wins: number;
    losses: number;
    latest_fight_time: number;
  }[];
  recentFights: FightSummary[];
  fightTypes: {
    fight_type: string;
    count: number;
  }[];
};

export type PlayerStats = {
  playerName: string;
  fightCount: number;
  wins: number;
  losses: number;
  winRate: number;
  fightTypes: { fight_type: string; count: number }[];
  averages: {
    offPrayerRatio: number;
    offensivePrayerRatio: number;
    magicLuckRatio: number;
    avgDmgDealt: number;
    avgExpectedDmg: number;
    avgHpHealed: number;
    avgRobeHitRatio: number;
    avgKoChance: number;
  };
  weaponsUsed: { name: string; count: number; src: string | null }[];
  headToHead: { opponent: string; wins: number; losses: number; total: number }[];
};

