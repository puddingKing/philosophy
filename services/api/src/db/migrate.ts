import { query } from './pool'

export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS philosophers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      name_en VARCHAR(256),
      era VARCHAR(64),
      school VARCHAR(128),
      avatar_url TEXT,
      summary TEXT,
      biography TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS works (
      id VARCHAR(128) PRIMARY KEY,
      philosopher_id VARCHAR(64) NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
      title VARCHAR(256) NOT NULL,
      year VARCHAR(32),
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_works_philosopher_id ON works(philosopher_id);
  `)
  console.log('Database migration completed.')
}
