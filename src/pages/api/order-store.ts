import { createClient } from "@libsql/client";

const db = createClient({
  url: import.meta.env.TURSO_DB_URL ?? "",
  authToken: import.meta.env.TURSO_TOKEN ?? "",
});

export async function setupOrderTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_data (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
}

export async function saveOrder(orderId: string, data: any) {
  await setupOrderTable();
  await db.execute({
    sql: `INSERT INTO order_data (id, data, created_at)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data`,
    args: [orderId, JSON.stringify(data), Date.now()],
  });
}

export async function getOrder(orderId: string) {
  await setupOrderTable();
  const result = await db.execute({
    sql: "SELECT data FROM order_data WHERE id = ?",
    args: [orderId],
  });
  if (!result.rows.length) return null;
  return JSON.parse(result.rows[0].data as string);
}
