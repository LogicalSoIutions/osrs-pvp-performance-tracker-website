import { Pool, type PoolClient } from "pg";
import type { FightDetail, FightPerformance, FightSummary, PlayerSummary, DashboardStats, PlayerStats, UploadedFightPayload } from "@/src/types/fights";
import { collectFightItemIdsForMerge } from "@/src/lib/fight-calc";
import { mergeFightPair } from "@/src/lib/fight-merge";

declare global {
  var __pvpTrackerPool: Pool | undefined;
}

const pool =
  global.__pvpTrackerPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pvpTrackerPool = pool;
}

let schemaReady: Promise<void> | null = null;
const HIDDEN_RSN = "Hidden";

type SummaryRow = {
  id: number;
  fight_id: string;
  competitor_name: string;
  opponent_name: string;
  last_fight_time: string | number;
  fight_type: FightSummary["fight_type"];
  world: number;
  competitor_dead: boolean;
  opponent_dead: boolean;
  has_secondary_pov: boolean;
  is_public?: boolean;
  created_at: string;
};

type UploadRow = {
  fight_id: string;
  competitor_name: string;
  opponent_name: string;
  last_fight_time: string | number;
  fight_type: FightSummary["fight_type"];
  world: number;
  competitor_dead: boolean;
  opponent_dead: boolean;
  full_data: FightPerformance;
  public_delay_seconds: number;
  public_at: string;
  created_at: string;
};

type InsertFightResult = {
  fight: FightSummary;
  isPublic: boolean;
};

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS fights (
          id SERIAL PRIMARY KEY,
          fight_id VARCHAR(10) NOT NULL UNIQUE,
          competitor_name VARCHAR(12) NOT NULL,
          opponent_name VARCHAR(12) NOT NULL,
          last_fight_time BIGINT NOT NULL,
          fight_type VARCHAR(20) NOT NULL,
          world INT NOT NULL,
          competitor_dead BOOLEAN NOT NULL,
          opponent_dead BOOLEAN NOT NULL,
          full_data JSONB NOT NULL,
          secondary_data JSONB NULL,
          public_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query("ALTER TABLE fights ADD COLUMN IF NOT EXISTS secondary_data JSONB NULL");
      await pool.query("ALTER TABLE fights ADD COLUMN IF NOT EXISTS public_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
      await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_fights_fight_id ON fights (fight_id)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_fights_competitor ON fights (competitor_name)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_fights_opponent ON fights (opponent_name)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_fights_time ON fights (last_fight_time DESC)");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS fight_uploads (
          id SERIAL PRIMARY KEY,
          fight_id VARCHAR(10) NOT NULL,
          competitor_name VARCHAR(12) NOT NULL,
          opponent_name VARCHAR(12) NOT NULL,
          last_fight_time BIGINT NOT NULL,
          fight_type VARCHAR(20) NOT NULL,
          world INT NOT NULL,
          competitor_dead BOOLEAN NOT NULL,
          opponent_dead BOOLEAN NOT NULL,
          full_data JSONB NOT NULL,
          public_delay_seconds INT NOT NULL DEFAULT 0,
          public_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (fight_id, competitor_name, opponent_name)
        )
      `);
      await pool.query("ALTER TABLE fight_uploads ADD COLUMN IF NOT EXISTS public_delay_seconds INT NOT NULL DEFAULT 0");
      await pool.query("ALTER TABLE fight_uploads ADD COLUMN IF NOT EXISTS public_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_fight_uploads_fight_id ON fight_uploads (fight_id)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_fight_uploads_created_at ON fight_uploads (created_at ASC)");
    })();
  }

  await schemaReady;
}

function mapSummary(row: SummaryRow): FightSummary {
  return {
    id: row.id,
    fight_id: row.fight_id,
    competitor_name: row.competitor_name,
    opponent_name: row.has_secondary_pov ? row.opponent_name : HIDDEN_RSN,
    last_fight_time: Number(row.last_fight_time),
    fight_type: row.fight_type,
    world: row.world,
    competitor_dead: row.competitor_dead,
    opponent_dead: row.opponent_dead,
    has_secondary_pov: row.has_secondary_pov,
    created_at: row.created_at,
  };
}

function sanitizeFightPerformance(fight: FightPerformance, hasSecondaryPov: boolean): FightPerformance {
  if (hasSecondaryPov) {
    return {
      ...fight,
      _secondaryFight: undefined,
    };
  }

  return {
    ...fight,
    o: {
      ...fight.o,
      n: HIDDEN_RSN,
    },
    _secondaryFight: undefined,
  };
}

function getPublicDelaySeconds(fight: UploadedFightPayload): number {
  return Math.max(0, Math.min(18000, Math.trunc(fight.publicDelaySeconds ?? 0)));
}

function stripUploadOnlyFields(fight: UploadedFightPayload): FightPerformance {
  return {
    c: fight.c,
    o: fight.o,
    t: fight.t,
    fightID: fight.fightID,
    l: fight.l,
    w: fight.w,
    _secondaryFight: fight._secondaryFight,
  };
}

async function upsertFight(client: Pool | PoolClient, fight: UploadedFightPayload): Promise<InsertFightResult> {
  await upsertFightUpload(client, fight);
  const uploads = await getFightUploads(client, fight.fightID);
  const selected = await selectCanonicalPair(client, fight.fightID, uploads);
  const mergeItemStats = await getItemStatsForIdsWithClient(
    client,
    collectFightItemIdsForMerge(selected.primary.full_data, selected.secondary?.full_data ?? null),
  );
  const mergedFight = mergeFightPair(selected.primary.full_data, selected.secondary?.full_data ?? null, mergeItemStats);
  const publicAt = new Date(Math.max(
    Date.parse(selected.primary.public_at),
    selected.secondary ? Date.parse(selected.secondary.public_at) : 0,
  ));

  const query = `
    INSERT INTO fights (
      fight_id,
      competitor_name,
      opponent_name,
      last_fight_time,
      fight_type,
      world,
      competitor_dead,
      opponent_dead,
      full_data,
      secondary_data,
      public_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (fight_id) DO UPDATE
    SET
      competitor_name = EXCLUDED.competitor_name,
      opponent_name = EXCLUDED.opponent_name,
      last_fight_time = EXCLUDED.last_fight_time,
      fight_type = EXCLUDED.fight_type,
      world = EXCLUDED.world,
      competitor_dead = EXCLUDED.competitor_dead,
      opponent_dead = EXCLUDED.opponent_dead,
      full_data = EXCLUDED.full_data,
      secondary_data = EXCLUDED.secondary_data,
      public_at = EXCLUDED.public_at
    RETURNING id, fight_id, competitor_name, opponent_name, last_fight_time, fight_type, world, competitor_dead, opponent_dead, secondary_data IS NOT NULL AS has_secondary_pov, public_at <= NOW() AS is_public, created_at
  `;

  const values = [
    mergedFight.fightID,
    mergedFight.c.n,
    mergedFight.o.n,
    mergedFight.t,
    mergedFight.l,
    mergedFight.w,
    mergedFight.c.x,
    mergedFight.o.x,
    JSON.stringify(mergedFight),
    selected.secondary ? JSON.stringify(selected.secondary.full_data) : null,
    publicAt.toISOString(),
  ];

  const result = await client.query<SummaryRow>(query, values);
  return {
    fight: mapSummary(result.rows[0]),
    isPublic: Boolean(result.rows[0]?.is_public),
  };
}

async function upsertFightUpload(client: Pool | PoolClient, fight: UploadedFightPayload) {
  const publicDelaySeconds = getPublicDelaySeconds(fight);
  const persistedFight = stripUploadOnlyFields(fight);
  const query = `
    INSERT INTO fight_uploads (
      fight_id,
      competitor_name,
      opponent_name,
      last_fight_time,
      fight_type,
      world,
      competitor_dead,
      opponent_dead,
      full_data,
      public_delay_seconds,
      public_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::integer, NOW() + ($10::integer * INTERVAL '1 second'))
    ON CONFLICT (fight_id, competitor_name, opponent_name) DO UPDATE
    SET
      last_fight_time = GREATEST(fight_uploads.last_fight_time, EXCLUDED.last_fight_time),
      competitor_dead = fight_uploads.competitor_dead OR EXCLUDED.competitor_dead,
      opponent_dead = fight_uploads.opponent_dead OR EXCLUDED.opponent_dead,
      fight_type = EXCLUDED.fight_type,
      world = EXCLUDED.world,
      full_data = EXCLUDED.full_data,
      public_delay_seconds = GREATEST(fight_uploads.public_delay_seconds, EXCLUDED.public_delay_seconds),
      public_at = GREATEST(fight_uploads.public_at, EXCLUDED.public_at)
  `;

  await client.query(query, [
    persistedFight.fightID,
    persistedFight.c.n,
    persistedFight.o.n,
    persistedFight.t,
    persistedFight.l,
    persistedFight.w,
    persistedFight.c.x,
    persistedFight.o.x,
    JSON.stringify(persistedFight),
    publicDelaySeconds,
  ]);
}

async function getFightUploads(client: Pool | PoolClient, fightId: string): Promise<UploadRow[]> {
  const result = await client.query<UploadRow>(
    `
      SELECT
        fight_id,
        competitor_name,
        opponent_name,
        last_fight_time,
        fight_type,
        world,
        competitor_dead,
        opponent_dead,
        full_data,
        public_delay_seconds,
        public_at,
        created_at
      FROM fight_uploads
      WHERE fight_id = $1
      ORDER BY created_at ASC, competitor_name ASC, opponent_name ASC
    `,
    [fightId],
  );

  return result.rows;
}

async function getExistingFightIdentity(client: Pool | PoolClient, fightId: string) {
  const result = await client.query<{ competitor_name: string; opponent_name: string }>(
    `
      SELECT competitor_name, opponent_name
      FROM fights
      WHERE fight_id = $1
      LIMIT 1
    `,
    [fightId],
  );

  return result.rows[0] ?? null;
}

async function selectCanonicalPair(client: Pool | PoolClient, fightId: string, uploads: UploadRow[]) {
  const existing = await getExistingFightIdentity(client, fightId);
  const primary =
    (existing
      ? uploads.find(
          (upload) =>
            upload.competitor_name === existing.competitor_name
            && upload.opponent_name === existing.opponent_name,
        )
      : null) ?? uploads[0];

  const secondary =
    uploads.find(
      (upload) =>
        upload.competitor_name === primary.opponent_name
        && upload.opponent_name === primary.competitor_name,
    ) ?? null;

  return { primary, secondary };
}

export async function insertFightsBulk(fights: UploadedFightPayload[]): Promise<InsertFightResult[]> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted: InsertFightResult[] = [];

    for (const fight of fights) {
      inserted.push(await upsertFight(client, fight));
    }

    await client.query("COMMIT");
    return inserted;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPlayerSummaries(search = ""): Promise<PlayerSummary[]> {
  await ensureSchema();
  const trimmed = search.trim();
  const values: string[] = [];
  let whereClause = "";

  if (trimmed) {
    values.push(`%${trimmed}%`);
    whereClause = "WHERE player_name ILIKE $1";
  }

  const query = `
    WITH player_fights AS (
      SELECT competitor_name AS player_name, last_fight_time FROM fights WHERE public_at <= NOW()
      UNION ALL
      SELECT opponent_name AS player_name, last_fight_time FROM fights WHERE public_at <= NOW() AND secondary_data IS NOT NULL
    )
    SELECT
      player_name,
      COUNT(*)::int AS fight_count,
      MAX(last_fight_time)::bigint AS latest_fight_time
    FROM player_fights
    ${whereClause}
    GROUP BY player_name
    ORDER BY latest_fight_time DESC, player_name ASC
  `;

  const result = await pool.query<{
    player_name: string;
    fight_count: number;
    latest_fight_time: string | number;
  }>(query, values);

  return result.rows.map((row): PlayerSummary => ({
    player_name: row.player_name,
    fight_count: Number(row.fight_count),
    latest_fight_time: Number(row.latest_fight_time),
  }));
}

export async function getPlayerFights(playerName: string): Promise<FightSummary[]> {
  await ensureSchema();
  const query = `
    SELECT
      id,
      fight_id,
      competitor_name,
      opponent_name,
      last_fight_time,
      fight_type,
      world,
      competitor_dead,
      opponent_dead,
      secondary_data IS NOT NULL AS has_secondary_pov,
      created_at
    FROM fights
    WHERE public_at <= NOW() AND (competitor_name = $1 OR (secondary_data IS NOT NULL AND opponent_name = $1))
    ORDER BY last_fight_time DESC
  `;

  const result = await pool.query<SummaryRow>(query, [playerName]);
  return result.rows.map(mapSummary);
}

export async function getFightByFightId(fightId: string): Promise<FightDetail | null> {
  await ensureSchema();
  const query = `
    SELECT
      id,
      fight_id,
      competitor_name,
      opponent_name,
      last_fight_time,
      fight_type,
      world,
      competitor_dead,
      opponent_dead,
      full_data,
      secondary_data,
      secondary_data IS NOT NULL AS has_secondary_pov,
      created_at
    FROM fights
    WHERE fight_id = $1 AND public_at <= NOW()
    LIMIT 1
  `;

  const result = await pool.query<
    SummaryRow & {
      full_data: FightPerformance;
      secondary_data: FightPerformance | null;
    }
  >(query, [fightId]);

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    ...mapSummary(row),
    full_data: sanitizeFightPerformance(row.full_data, row.has_secondary_pov),
    secondary_data: row.has_secondary_pov && row.secondary_data ? sanitizeFightPerformance(row.secondary_data, true) : null,
  };
}

export type ItemStatsRow = {
  id: string;
  name: string;
  slot: string;
  members: boolean | null;
  stab_attack: number;
  slash_attack: number;
  crush_attack: number;
  magic_attack: number;
  ranged_attack: number;
  stab_defence: number;
  slash_defence: number;
  crush_defence: number;
  magic_defence: number;
  ranged_defence: number;
  strength: number;
  ranged_strength: number;
  magic_damage: string | number;
  prayer: number;
  weight: string | number | null;
  wiki_path: string | null;
  wiki_url: string | null;
  image_url: string | null;
  source_page: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  item_id?: number;
};

export async function getItemStatsForIds(itemIds: number[]): Promise<Record<number, ItemStatsRow>> {
  await ensureSchema();
  return getItemStatsForIdsWithClient(pool, itemIds);
}

async function getItemStatsForIdsWithClient(
  client: Pool | PoolClient,
  itemIds: number[],
): Promise<Record<number, ItemStatsRow>> {
  const cleanIds = Array.from(new Set(itemIds.filter(id => id && id > 0)));
  if (cleanIds.length === 0) {
    return {};
  }

  const query = `
    SELECT DISTINCT ON (m.id)
      m.id AS item_id,
      s.*
    FROM item_map m
    JOIN item_stats s 
      ON LOWER(SPLIT_PART(s.name, '#', 1)) = LOWER(REGEXP_REPLACE(m.name, '\\s+\\d+$', ''))
    WHERE m.id = ANY($1::int[])
  `;

  const result = await client.query<ItemStatsRow & { item_id: number }>(query, [cleanIds]);
  const mapping: Record<number, ItemStatsRow> = {};
  for (const row of result.rows) {
    mapping[row.item_id] = row;
  }
  return mapping;
}

export async function getGlobalStats(): Promise<DashboardStats> {
  await ensureSchema();
  
  // 1. Total fights
  const fightsCountRes = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM fights WHERE public_at <= NOW()");
  const totalFights = parseInt(fightsCountRes.rows[0]?.count || "0", 10);

  // 2. Total players
  const playersCountRes = await pool.query<{ count: string }>(`
    SELECT COUNT(DISTINCT player_name)::text AS count FROM (
      SELECT competitor_name AS player_name FROM fights WHERE public_at <= NOW()
      UNION ALL
      SELECT opponent_name AS player_name FROM fights WHERE public_at <= NOW() AND secondary_data IS NOT NULL
    ) p
  `);
  const totalPlayers = parseInt(playersCountRes.rows[0]?.count || "0", 10);

  // 3. Active players
  const activePlayersRes = await pool.query<{
    player_name: string;
    fight_count: number;
    wins: number;
    losses: number;
    latest_fight_time: string;
  }>(`
    SELECT
      player_name,
      COUNT(*)::int AS fight_count,
      SUM(CASE WHEN is_winner THEN 1 ELSE 0 END)::int AS wins,
      SUM(CASE WHEN NOT is_winner THEN 1 ELSE 0 END)::int AS losses,
      MAX(last_fight_time)::bigint AS latest_fight_time
    FROM (
      SELECT competitor_name AS player_name, NOT competitor_dead AS is_winner, last_fight_time FROM fights WHERE public_at <= NOW()
      UNION ALL
      SELECT opponent_name AS player_name, NOT opponent_dead AS is_winner, last_fight_time FROM fights WHERE public_at <= NOW() AND secondary_data IS NOT NULL
    ) sub
    GROUP BY player_name
    ORDER BY fight_count DESC, player_name ASC
    LIMIT 5
  `);
  const activePlayers = activePlayersRes.rows.map(row => ({
    player_name: row.player_name,
    fight_count: row.fight_count,
    wins: row.wins,
    losses: row.losses,
    latest_fight_time: Number(row.latest_fight_time),
  }));

  // 4. Recent fights
  const recentFightsRes = await pool.query<SummaryRow>(`
    SELECT
      id,
      fight_id,
      competitor_name,
      opponent_name,
      last_fight_time,
      fight_type,
      world,
      competitor_dead,
      opponent_dead,
      secondary_data IS NOT NULL AS has_secondary_pov,
      created_at
    FROM fights
    WHERE public_at <= NOW()
    ORDER BY last_fight_time DESC
    LIMIT 10
  `);
  const recentFights = recentFightsRes.rows.map(mapSummary);

  // 5. Fight types
  const fightTypesRes = await pool.query<{ fight_type: string; count: number }>(`
    SELECT
      fight_type,
      COUNT(*)::int AS count
    FROM fights
    WHERE public_at <= NOW()
    GROUP BY fight_type
    ORDER BY count DESC
  `);
  const fightTypes = fightTypesRes.rows;

  return {
    totalFights,
    totalPlayers,
    activePlayers,
    recentFights,
    fightTypes,
  };
}

export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
  await ensureSchema();

  // Fetch the last 50 fights involving the player
  const result = await pool.query<{
    full_data: FightPerformance;
    secondary_data: FightPerformance | null;
  }>(
    `
      SELECT full_data, secondary_data
      FROM fights
      WHERE public_at <= NOW() AND (competitor_name = $1 OR (secondary_data IS NOT NULL AND opponent_name = $1))
      ORDER BY last_fight_time DESC
      LIMIT 50
    `,
    [playerName],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const fights = result.rows;
  let wins = 0;
  let losses = 0;
  const fightTypesMap = new Map<string, number>();

  // Averages aggregations
  let totalAttacks = 0;
  let totalOffPray = 0;
  let totalOffensivePray = 0;
  let totalOffensivePrayAttacks = 0; // only when POVs are available
  let totalMagicAttacks = 0;
  let totalMagicHits = 0;
  let totalDmgDealt = 0;
  let totalExpectedDmg = 0;
  let totalHpHealed = 0;
  let totalHpHealedCount = 0; // only when POVs are available
  let totalRobeHits = 0;
  let totalRobeAttacksTaken = 0;
  let totalKoChance = 0;
  let totalKoChanceCount = 0;

  // Weapons used map
  const weaponsCount = new Map<number, number>();

  // Head-to-head records map
  const h2hMap = new Map<string, { wins: number; losses: number }>();

  for (const row of fights) {
    const fight = row.full_data;
    const secondary = row.secondary_data;
    
    // Determine player role: competitor 'c' or opponent 'o'
    const isCompetitor = fight.c.n === playerName;
    const self = isCompetitor ? fight.c : fight.o;
    const enemy = isCompetitor ? fight.o : fight.c;

    const opponentName = secondary ? enemy.n : HIDDEN_RSN;

    // Win/Loss
    const dead = self.x;
    if (dead) {
      losses++;
    } else {
      wins++;
    }

    // Head-to-head
    const currentH2H = h2hMap.get(opponentName) ?? { wins: 0, losses: 0 };
    if (dead) {
      currentH2H.losses++;
    } else {
      currentH2H.wins++;
    }
    h2hMap.set(opponentName, currentH2H);

    // Fight type
    const fType = fight.l || "NORMAL";
    fightTypesMap.set(fType, (fightTypesMap.get(fType) ?? 0) + 1);

    // Off-prayer: self.s / self.a
    totalAttacks += self.a || 0;
    totalOffPray += self.s || 0;

    // Offensive prayer: only available if competitor POV is available
    let selfOffensivePray = 0;
    let hasOffensivePray = false;
    if (isCompetitor) {
      selfOffensivePray = self.p || 0;
      hasOffensivePray = true;
    } else if (secondary && secondary.c && secondary.c.n === playerName) {
      selfOffensivePray = secondary.c.p || 0;
      hasOffensivePray = true;
    }

    if (hasOffensivePray) {
      totalOffensivePray += selfOffensivePray;
      totalOffensivePrayAttacks += self.a || 0;
    }

    // Magic Luck: self.m / self.M
    totalMagicAttacks += self.M || 0;
    totalMagicHits += self.m || 0;

    // Damage Dealt & Expected
    totalDmgDealt += self.h || 0;
    totalExpectedDmg += self.d || 0;

    // HP Healed
    let selfHpHealed = 0;
    let hasHpHealed = false;
    if (isCompetitor) {
      selfHpHealed = self.H || 0;
      hasHpHealed = true;
    } else if (secondary && secondary.c && secondary.c.n === playerName) {
      selfHpHealed = secondary.c.H || 0;
      hasHpHealed = true;
    }

    if (hasHpHealed) {
      totalHpHealed += selfHpHealed;
      totalHpHealedCount++;
    }

    // Robe hits: self.rh / (enemy.a - enemy.z)
    const robeAttacksTaken = enemy.a - enemy.z;
    if (robeAttacksTaken > 0) {
      totalRobeHits += self.rh || 0;
      totalRobeAttacksTaken += robeAttacksTaken;
    }

    // KO Chances
    const competitorLogs = fight.c?.l ?? [];
    const logs = [...(fight.c?.l ?? []), ...(fight.o?.l ?? [])];
    let fightKoSurvival = 1;
    let hasKoEntries = false;

    for (const entry of logs) {
      if (!entry || !entry.f) continue;
      const isEntryCompetitorAttacker = competitorLogs.includes(entry);
      const isSelfAttacker = isCompetitor ? isEntryCompetitorAttacker : !isEntryCompetitorAttacker;

      if (isSelfAttacker) {
        const chance = entry.displayKoChance ?? entry.k ?? null;
        if (chance != null) {
          fightKoSurvival *= (1 - chance);
          hasKoEntries = true;
        }
      }
    }

    if (hasKoEntries) {
      totalKoChance += (1 - fightKoSurvival);
      totalKoChanceCount++;
    }

    // Weapons used count
    for (const entry of logs) {
      if (!entry || !entry.f) continue;
      const isEntryCompetitorAttacker = competitorLogs.includes(entry);
      const isSelfAttacker = isCompetitor ? isEntryCompetitorAttacker : !isEntryCompetitorAttacker;

      if (isSelfAttacker) {
        const weaponId = entry.G?.[3];
        if (weaponId && weaponId > 0) {
          const normalized = weaponId > 2048 ? weaponId - 2048 : weaponId;
          weaponsCount.set(normalized, (weaponsCount.get(normalized) ?? 0) + 1);
        }
      }
    }
  }

  // Formatting Fight Types
  const fightTypes = Array.from(fightTypesMap.entries()).map(([fight_type, count]) => ({
    fight_type,
    count,
  })).sort((a, b) => b.count - a.count);

  // Formatting Head-to-Head
  const headToHead = Array.from(h2hMap.entries()).map(([opponent, rec]) => ({
    opponent,
    wins: rec.wins,
    losses: rec.losses,
    total: rec.wins + rec.losses,
  })).sort((a, b) => b.total - a.total).slice(0, 5);

  // Weapons used details
  const weaponIds = Array.from(weaponsCount.keys());
  const itemStats = weaponIds.length > 0 ? await getItemStatsForIds(weaponIds) : {};
  const weaponsUsed = Array.from(weaponsCount.entries()).map(([id, count]) => {
    const stats = itemStats[id];
    let name = `Weapon ${id}`;
    let src: string | null = null;
    if (stats) {
      name = stats.name;
      const lastPart = stats.image_url ? stats.image_url.split('/').pop() : undefined;
      src = lastPart ? decodeURIComponent(lastPart.split('?')[0]) : null;
    }
    return { name, count, src };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  const totalFightsCount = fights.length;

  return {
    playerName,
    fightCount: totalFightsCount,
    wins,
    losses,
    winRate: totalFightsCount > 0 ? wins / totalFightsCount : 0,
    fightTypes,
    averages: {
      offPrayerRatio: totalAttacks > 0 ? totalOffPray / totalAttacks : 0,
      offensivePrayerRatio: totalOffensivePrayAttacks > 0 ? totalOffensivePray / totalOffensivePrayAttacks : 0,
      magicLuckRatio: totalMagicAttacks > 0 ? totalMagicHits / totalMagicAttacks : 0,
      avgDmgDealt: totalFightsCount > 0 ? totalDmgDealt / totalFightsCount : 0,
      avgExpectedDmg: totalFightsCount > 0 ? totalExpectedDmg / totalFightsCount : 0,
      avgHpHealed: totalHpHealedCount > 0 ? totalHpHealed / totalHpHealedCount : 0,
      avgRobeHitRatio: totalRobeAttacksTaken > 0 ? totalRobeHits / totalRobeAttacksTaken : 0,
      avgKoChance: totalKoChanceCount > 0 ? totalKoChance / totalKoChanceCount : 0,
    },
    weaponsUsed,
    headToHead,
  };
}
