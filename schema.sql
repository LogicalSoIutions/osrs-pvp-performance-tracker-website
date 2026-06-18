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
    secondary_public_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fights_fight_id ON fights (fight_id);
CREATE INDEX IF NOT EXISTS idx_fights_competitor ON fights (competitor_name);
CREATE INDEX IF NOT EXISTS idx_fights_opponent ON fights (opponent_name);
CREATE INDEX IF NOT EXISTS idx_fights_time ON fights (last_fight_time DESC);

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
);

CREATE INDEX IF NOT EXISTS idx_fight_uploads_fight_id ON fight_uploads (fight_id);
CREATE INDEX IF NOT EXISTS idx_fight_uploads_created_at ON fight_uploads (created_at ASC);
