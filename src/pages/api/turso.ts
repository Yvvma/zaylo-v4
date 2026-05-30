import { createClient } from "@libsql/client";

const db = createClient({
  url: import.meta.env.TURSO_DB_URL ?? "",
  authToken: import.meta.env.TURSO_TOKEN ?? "",
});

// ─── Setup table if not exists ────────────────────────────────────────────────
export async function setupBlingTokensTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bling_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      refresh_expires_at INTEGER NOT NULL DEFAULT 0
    )
  `);
  // Add column if missing (older schema)
  await db.execute("ALTER TABLE bling_tokens ADD COLUMN refresh_expires_at INTEGER NOT NULL DEFAULT 0").catch(() => {});
}

// ─── Save tokens ──────────────────────────────────────────────────────────────
export async function saveBlingTokens(
  access_token: string,
  refresh_token: string,
  expires_in: number
) {
  const expires_at = Date.now() + expires_in * 1000 - 300_000; // 5min buffer
  const refresh_expires_at = Date.now() + 25 * 24 * 60 * 60 * 1000; // 25 days
  await db.execute({
    sql: `INSERT INTO bling_tokens (id, access_token, refresh_token, expires_at, refresh_expires_at)
          VALUES (1, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            expires_at = excluded.expires_at,
            refresh_expires_at = excluded.refresh_expires_at`,
    args: [access_token, refresh_token, expires_at, refresh_expires_at],
  });
}

// ─── Get tokens ───────────────────────────────────────────────────────────────
export async function getBlingTokens(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  refresh_expires_at: number;
} | null> {
  const result = await db.execute("SELECT * FROM bling_tokens WHERE id = 1");
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    access_token: row.access_token as string,
    refresh_token: row.refresh_token as string,
    expires_at: row.expires_at as number,
    refresh_expires_at: (row.refresh_expires_at as number) ?? 0,
  };
}

// ─── Melhor Envio tokens ──────────────────────────────────────────────────────

export async function setupMETokensTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS me_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      refresh_expires_at INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db.execute("ALTER TABLE me_tokens ADD COLUMN refresh_expires_at INTEGER NOT NULL DEFAULT 0").catch(() => {});
}

export async function saveMETokens(
  access_token: string,
  refresh_token: string,
  expires_in: number
) {
  const expires_at = Date.now() + expires_in * 1000 - 60_000;
  const refresh_expires_at = Date.now() + 25 * 24 * 60 * 60 * 1000;
  await db.execute({
    sql: `INSERT INTO me_tokens (id, access_token, refresh_token, expires_at, refresh_expires_at)
          VALUES (1, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            expires_at = excluded.expires_at,
            refresh_expires_at = excluded.refresh_expires_at`,
    args: [access_token, refresh_token, expires_at, refresh_expires_at],
  });
}

export async function getMETokens(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  refresh_expires_at: number;
} | null> {
  const result = await db.execute("SELECT * FROM me_tokens WHERE id = 1");
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    access_token: row.access_token as string,
    refresh_token: row.refresh_token as string,
    expires_at: row.expires_at as number,
    refresh_expires_at: (row.refresh_expires_at as number) ?? 0,
  };
}
