import type { APIRoute } from "astro";
import { cpfTemPedidoPago } from "./turso";
import { createClient } from "@libsql/client";

const TURSO_URL = import.meta.env.TURSO_DB_URL ?? "";
const TURSO_TOKEN = import.meta.env.TURSO_TOKEN ?? "";

let _db: ReturnType<typeof createClient> | null = null;
function db() {
  if (!_db) {
    if (!TURSO_URL) throw new Error("TURSO_DB_URL not configured");
    _db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  }
  return _db;
}

async function ensureCouponsTable() {
  await db().execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  const seeds = [
    { code: "TESTEPAGAMENTO", discount: 99, maxUses: null },
    { code: "WELCOME10", discount: 10, maxUses: null },
    ...Array.from({ length: 20 }, (_, i) => ({
      code: `INFLU${String(i + 1).padStart(4, "0")}ZYL`,
      discount: 100,
      maxUses: 1,
    })),
  ];

  for (const s of seeds) {
    const exists = await db().execute({ sql: "SELECT code FROM coupons WHERE code = ?", args: [s.code] });
    if (!exists.rows.length) {
      await db().execute({
        sql: "INSERT INTO coupons (code, discount_percent, active, max_uses, used_count, created_at) VALUES (?, ?, 1, ?, 0, ?)",
        args: [s.code, s.discount, s.maxUses, Date.now()],
      });
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureCouponsTable();

    const body = await request.json();
    const { code, cpfCnpj } = body;

    if (!code) {
      return new Response(JSON.stringify({ valid: false, error: "Código do cupom obrigatório" }), { status: 400 });
    }

    const result = await db().execute({
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
    const upperCode = code.toUpperCase();

    if (upperCode === "WELCOME10") {
      if (!cpfCnpj) {
        return new Response(JSON.stringify({ valid: false, error: "Preencha seus dados antes de aplicar este cupom" }), { status: 200 });
      }
      const jaCliente = await cpfTemPedidoPago(cpfCnpj);
      if (jaCliente) {
        return new Response(JSON.stringify({ valid: false, error: "Cupom exclusivo para novos clientes" }), { status: 200 });
      }
    }

    await db().execute({
      sql: "UPDATE coupons SET used_count = used_count + 1 WHERE code = ?",
      args: [upperCode],
    });

    return new Response(
      JSON.stringify({ valid: true, discountPercent, code: upperCode }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Coupon error:", error);
    return new Response(JSON.stringify({ valid: false, error: "Erro interno" }), { status: 500 });
  }
};
