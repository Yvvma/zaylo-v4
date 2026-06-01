import { createClient } from "@libsql/client";

function getDb() {
  const url = import.meta.env.TURSO_DB_URL ?? "";
  const authToken = import.meta.env.TURSO_TOKEN ?? "";
  if (!url) throw new Error("TURSO_DB_URL not configured");
  return createClient({ url, authToken });
}

let _db: ReturnType<typeof createClient> | null = null;
function db() {
  if (!_db) _db = getDb();
  return _db;
}

// ─── Setup table if not exists ────────────────────────────────────────────────
export async function setupBlingTokensTable() {
  await db().execute(`
    CREATE TABLE IF NOT EXISTS bling_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      refresh_expires_at INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db().execute("ALTER TABLE bling_tokens ADD COLUMN refresh_expires_at INTEGER NOT NULL DEFAULT 0").catch(() => {});
}

// ─── Save tokens ──────────────────────────────────────────────────────────────
export async function saveBlingTokens(
  access_token: string,
  refresh_token: string,
  expires_in: number
) {
  const expires_at = Date.now() + expires_in * 1000 - 300_000; // 5min buffer
  const refresh_expires_at = Date.now() + 25 * 24 * 60 * 60 * 1000; // 25 days
  await db().execute({
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
  const result = await db().execute("SELECT * FROM bling_tokens WHERE id = 1");
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
  await db().execute(`
    CREATE TABLE IF NOT EXISTS me_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      refresh_expires_at INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db().execute("ALTER TABLE me_tokens ADD COLUMN refresh_expires_at INTEGER NOT NULL DEFAULT 0").catch(() => {});
}

export async function saveMETokens(
  access_token: string,
  refresh_token: string,
  expires_in: number
) {
  const expires_at = Date.now() + expires_in * 1000 - 60_000;
  const refresh_expires_at = Date.now() + 25 * 24 * 60 * 60 * 1000;
  await db().execute({
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
  const result = await db().execute("SELECT * FROM me_tokens WHERE id = 1");
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    access_token: row.access_token as string,
    refresh_token: row.refresh_token as string,
    expires_at: row.expires_at as number,
    refresh_expires_at: (row.refresh_expires_at as number) ?? 0,
  };
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export async function setupOrdersTable() {
  await db().execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      cpf_cnpj TEXT,
      telefone TEXT,
      cep TEXT,
      logradouro TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      total REAL NOT NULL,
      frete_preco REAL,
      frete_servico TEXT,
      condicao_pagamento TEXT,
      observacao TEXT,
      cupom TEXT,
      desconto_percent INTEGER,
      desconto_valor REAL,
      email_sent INTEGER NOT NULL DEFAULT 0,
      bling_processed INTEGER NOT NULL DEFAULT 0,
      me_processed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);
  await db().execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id),
      produto_id TEXT,
      slug TEXT,
      titulo TEXT,
      quantidade INTEGER NOT NULL,
      preco REAL NOT NULL,
      peso REAL,
      tamanho TEXT,
      cor TEXT,
      bling_id INTEGER
    )
  `);
}

export async function saveOrderNormalized(orderId: string, data: any) {
  await setupOrdersTable();
  const e = data.endereco ?? {};
  const frete = data.freteSelecionado ?? {};
  await db().execute({
    sql: `INSERT INTO orders (
            id, nome, email, cpf_cnpj, telefone,
            cep, logradouro, numero, complemento, bairro, cidade, uf,
            total, frete_preco, frete_servico, condicao_pagamento, observacao,
            cupom, desconto_percent, desconto_valor,
            email_sent, bling_processed, me_processed, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0,?)
          ON CONFLICT(id) DO UPDATE SET
            nome=excluded.nome, email=excluded.email, cpf_cnpj=excluded.cpf_cnpj,
            telefone=excluded.telefone, cep=excluded.cep, logradouro=excluded.logradouro,
            numero=excluded.numero, complemento=excluded.complemento, bairro=excluded.bairro,
            cidade=excluded.cidade, uf=excluded.uf, total=excluded.total,
            frete_preco=excluded.frete_preco, frete_servico=excluded.frete_servico,
            condicao_pagamento=excluded.condicao_pagamento, observacao=excluded.observacao,
            cupom=excluded.cupom, desconto_percent=excluded.desconto_percent,
            desconto_valor=excluded.desconto_valor`,
    args: [
      orderId,
      data.nome ?? "", data.email ?? "", data.cpfCnpj ?? null, data.telefone ?? null,
      e.cep ?? null, e.logradouro ?? null, e.numero ?? null, e.complemento ?? null,
      e.bairro ?? null, e.cidade ?? null, e.uf ?? null,
      data.total ?? 0, frete.price ?? null, frete.name ?? null,
      data.condicaoPagamento ?? null, data.observacao ?? null,
      data.cupom ?? null, data.descontoPercent ?? null, data.descontoValor ?? null,
      Date.now(),
    ],
  });
  await db().execute({ sql: "DELETE FROM order_items WHERE order_id = ?", args: [orderId] });
  for (const item of (data.itens ?? [])) {
    await db().execute({
      sql: `INSERT INTO order_items (order_id, produto_id, slug, titulo, quantidade, preco, peso, tamanho, cor, bling_id)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        orderId,
        String(item.id ?? item.produtoId ?? ""),
        item.slug ?? null, item.titulo ?? null,
        item.quantidade ?? 1, item.preco ?? 0,
        item.peso ?? null, item.tamanhoSelecionado ?? null,
        item.corVarianteSelecionada ?? null, item.blingId ?? null,
      ],
    });
  }
}

export async function getOrderNormalized(orderId: string) {
  await setupOrdersTable();
  const row = (await db().execute({ sql: "SELECT * FROM orders WHERE id = ?", args: [orderId] })).rows[0];
  if (!row) return null;
  const items = (await db().execute({ sql: "SELECT * FROM order_items WHERE order_id = ?", args: [orderId] })).rows;
  return {
    nome: row.nome, email: row.email, cpfCnpj: row.cpf_cnpj, telefone: row.telefone,
    total: row.total, condicaoPagamento: row.condicao_pagamento, observacao: row.observacao,
    cupom: row.cupom, descontoPercent: row.desconto_percent, descontoValor: row.desconto_valor,
    endereco: {
      cep: row.cep, logradouro: row.logradouro, numero: row.numero,
      complemento: row.complemento, bairro: row.bairro, cidade: row.cidade, uf: row.uf,
    },
    freteSelecionado: { price: row.frete_preco, name: row.frete_servico },
    emailSent: row.email_sent, blingProcessed: row.bling_processed, meProcessed: row.me_processed,
    itens: items.map(i => ({
      id: i.produto_id, slug: i.slug, titulo: i.titulo,
      quantidade: i.quantidade, preco: i.preco, peso: i.peso,
      tamanhoSelecionado: i.tamanho, corVarianteSelecionada: i.cor, blingId: i.bling_id,
    })),
  };
}

export async function cpfTemPedidoPago(cpfCnpj: string): Promise<boolean> {
  await setupOrdersTable();
  const cpf = cpfCnpj.replace(/\D/g, "");
  if (!cpf) return false;
  const result = await db().execute({
    sql: "SELECT id FROM orders WHERE cpf_cnpj = ? AND bling_processed = 1 LIMIT 1",
    args: [cpf],
  });
  return result.rows.length > 0;
}
