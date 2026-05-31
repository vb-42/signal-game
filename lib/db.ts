import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  return neon(url);
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  completed_signals: number;
  total_attempts: number;
  completed_at: string;
}

export async function initDb() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      completed_signals INTEGER NOT NULL DEFAULT 0,
      total_attempts INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, username, completed_signals, total_attempts, completed_at
    FROM leaderboard
    ORDER BY completed_signals DESC, total_attempts ASC, completed_at ASC
    LIMIT 50
  `;
  return rows as LeaderboardEntry[];
}

export async function insertLeaderboardEntry(
  username: string,
  completedSignals: number,
  totalAttempts: number
): Promise<LeaderboardEntry> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO leaderboard (username, completed_signals, total_attempts)
    VALUES (${username}, ${completedSignals}, ${totalAttempts})
    RETURNING id, username, completed_signals, total_attempts, completed_at
  `;
  return rows[0] as LeaderboardEntry;
}
