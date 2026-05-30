import type { APIRoute } from "astro";
import { createClient } from "@libsql/client";
import { randomBytes } from "node:crypto";

const db = createClient({
  url: import.meta.env.TURSO_DB_URL ?? "",
  authToken: import.meta.env.TURSO_TOKEN ?? "",
});

function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

async function setupTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    await setupTables();

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username e senha obrigatórios" }), { status: 400 });
    }

    const result = await db.execute({
      sql: "SELECT * FROM admin WHERE id = 1",
      args: [],
    });

    if (!result.rows.length) {
      console.error("[admin-auth] Nenhum admin encontrado no Turso (id=1)");
      return new Response(JSON.stringify({ error: "Nenhum admin cadastrado" }), { status: 401 });
    }

    const row = result.rows[0];
    const storedUser = row.username as string;
    const storedPassword = row.password as string;

    console.log("[admin-auth] Turso row (raw):", JSON.stringify(row, null, 2));
    console.log("[admin-auth] Colunas disponíveis:", Object.keys(row));
    console.log("[admin-auth] Input:", {
      username: `"${username}"`,
      password: `"${password}"`,
    });

    if (username !== storedUser || password !== storedPassword) {
      console.log("[admin-auth] Match: false");
      return new Response(JSON.stringify({ error: "Credenciais inválidas" }), { status: 401 });
    }

    console.log("[admin-auth] Match: true");

    const sessionId = generateSessionId();
    const expiresAt = Date.now() + 30 * 60 * 1000;

    await db.execute({
      sql: "INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES (?, ?, ?)",
      args: [sessionId, 1, expiresAt],
    });

    cookies.set("admin_session", sessionId, {
      path: "/",
      maxAge: 30 * 60,
      httpOnly: true,
      sameSite: "lax",
    });

    return new Response(JSON.stringify({ ok: true, username: storedUser }), { status: 200 });
  } catch (error: any) {
    console.error("Admin auth error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  try {
    await setupTables();

    const sessionId = cookies.get("admin_session")?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
    }

    const result = await db.execute({
      sql: "SELECT admin_id, expires_at FROM admin_sessions WHERE id = ?",
      args: [sessionId],
    });

    if (!result.rows.length) {
      cookies.delete("admin_session", { path: "/" });
      return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
    }

    const row = result.rows[0];
    const expiresAt = row.expires_at as number;

    if (Date.now() > expiresAt) {
      await db.execute({
        sql: "DELETE FROM admin_sessions WHERE id = ?",
        args: [sessionId],
      });
      cookies.delete("admin_session", { path: "/" });
      return new Response(JSON.stringify({ authenticated: false, expired: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ authenticated: true, adminId: row.admin_id }), { status: 200 });
  } catch (error: any) {
    console.error("Admin verify error:", error);
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }
};
