import type { APIRoute } from "astro";
import { createClient } from "@libsql/client";

const db = createClient({
  url: import.meta.env.TURSO_DB_URL ?? "",
  authToken: import.meta.env.TURSO_TOKEN ?? "",
});

async function ensureCouponsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  const existing = await db.execute({
    sql: "SELECT code FROM coupons WHERE code = ?",
    args: ["TESTEPAGAMENTO"],
  });

  if (!existing.rows.length) {
    await db.execute({
      sql: "INSERT INTO coupons (code, discount_percent, active, max_uses, used_count, created_at) VALUES (?, ?, 1, NULL, 0, ?)",
      args: ["TESTEPAGAMENTO", 99, Date.now()],
    });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureCouponsTable();

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ valid: false, error: "Código do cupom obrigatório" }), { status: 400 });
    }

    const result = await db.execute({
      sql: "SELECT discount_percent, active, max_uses, used_count FROM coupons WHERE code = ?",
      args: [code.toUpperCase()],
    });

    if (!result.rows.length) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom não encontrado" }), { status: 200 });
    }

    const row = result.rows[0];
    const active = row.active as number;
    const maxUses = row.max_uses as number | null;
    const usedCount = row.used_count as number;

    if (!active) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom inativo" }), { status: 200 });
    }

    if (maxUses !== null && usedCount >= maxUses) {
      return new Response(JSON.stringify({ valid: false, error: "Cupom esgotado" }), { status: 200 });
    }

    const discountPercent = row.discount_percent as number;

    return new Response(
      JSON.stringify({
        valid: true,
        discountPercent,
        code: code.toUpperCase(),
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Coupon error:", error);
    return new Response(JSON.stringify({ valid: false, error: "Erro interno" }), { status: 500 });
  }
};
