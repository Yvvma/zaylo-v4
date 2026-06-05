import type { APIRoute } from "astro";
import { setupBlingTokensTable, saveBlingTokens, getBlingTokens } from "./turso";
import { getOrder } from "./order-store";
import { buscarBlingId } from "../../data/bling-produtos";

const BLING_BASIC_AUTH = import.meta.env.BLING_BASIC_AUTH ?? "";
const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
const BLING_AUTH_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";
const BLING_ID = import.meta.env.BLING_ID ?? "";
const BLING_REDIRECT_URI = import.meta.env.BLING_REDIRECT_URI ?? "";
const BLING_BASE = "https://developer.bling.com.br/api/bling";

// ─── Internal request helper ───────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function blingRequest(method: string, path: string, body?: unknown, tentativa = 1) {
  const token = await getBlingAccessToken();
  const res = await fetch(`${BLING_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = JSON.stringify(data);
    // Rate limit: retry com backoff (max 3 tentativas)
    if (msg.includes("Too many requests") && tentativa < 3) {
      const espera = tentativa * 2000;
      console.warn(`[Bling] Rate limited, retrying in ${espera}ms (tentativa ${tentativa})`);
      await sleep(espera);
      return blingRequest(method, path, body, tentativa + 1);
    }
    throw new Error(`Bling ${method} ${path} failed: ${msg}`);
  }
  return data;
}

// ─── Get valid access token ───────────────────────────────────────────────────

export async function getBlingAccessToken(): Promise<string> {
  await setupBlingTokensTable();

  const tokens = await getBlingTokens();

  if (!tokens) {
    throw new Error("Bling not authorized — visit /api/bling-auth to authorize");
  }

  if (tokens.access_token && Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }

  if (tokens.refresh_expires_at && Date.now() > tokens.refresh_expires_at) {
    throw new Error("Bling refresh token expired (25d) — visit /api/bling-auth to re-authorize");
  }

  console.log("[Bling] access_token expired, refreshing...");
  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: BLING_BASIC_AUTH,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Bling refresh failed: ${JSON.stringify(data)}`);

  await saveBlingTokens(data.access_token, data.refresh_token, data.expires_in ?? 21600);
  console.log("[Bling] Tokens refreshed and saved to Turso");

  return data.access_token as string;
}

// ─── Contato: busca por CPF/CNPJ ou cria, retorna id ─────────────────────────

async function upsertContato(dados: {
  nome: string;
  email: string;
  cpfCnpj: string;
  telefone?: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro?: string;
    cidade: string;
    uf: string;
  };
}): Promise<number | null> {
  const cpf = dados.cpfCnpj.replace(/\D/g, "");
  const tipoPessoa = cpf.length === 14 ? "J" : "F";

  function formatarDoc(num: string): string {
    if (num.length === 11) return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (num.length === 14) return num.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return num;
  }

  async function buscarPorDoc(numero: string): Promise<number | null> {
    const formatado = formatarDoc(numero);
    for (const doc of [numero, formatado]) {
      try {
        const search = await blingRequest("GET", `/contatos?numeroDocumento=${encodeURIComponent(doc)}`) as any;
        const found = search?.data?.[0];
        if (found?.id) {
          const foundDoc = (found.numeroDocumento ?? "").replace(/\D/g, "");
          if (foundDoc === numero) {
            console.log("[Bling] Contato encontrado por documento:", found.id);
            return found.id as number;
          }
        }
      } catch (e) {
        console.warn("[Bling] Busca por documento falhou:", e);
      }
    }
    return null;
  }

  // Tenta buscar por documento (sem formatação e formatado)
  if (cpf) {
    const idEncontrado = await buscarPorDoc(cpf);
    if (idEncontrado) return idEncontrado;
  }

  // Se não achou, tenta criar
  try {
    const end = dados.endereco;
    const addressObj = end ? {
      endereco: end.logradouro,
      numero: end.numero,
      complemento: end.complemento ?? "",
      bairro: end.bairro ?? "",
      municipio: end.cidade,
      uf: end.uf,
      cep: end.cep?.replace(/\D/g, "") ?? "",
    } : undefined;

    const created = await blingRequest("POST", "/contatos", {
      nome: dados.nome,
      email: dados.email,
      numeroDocumento: cpf || undefined,
      tipo: tipoPessoa,
      situacao: "A",
      cliente: true,
      telefone: dados.telefone?.replace(/\D/g, "") || undefined,
      endereco: addressObj ? {
        geral: addressObj,
        cobranca: addressObj,
      } : undefined,
    }) as any;

    const newId = created?.data?.id;
    if (newId) {
      console.log("[Bling] Contato criado:", newId);
      return newId as number;
    }
  } catch (e: any) {
    console.warn("[Bling] Criação de contato falhou:", e?.message);
    const msg = e?.message ?? "";
    // CPF já cadastrado → buscar pelo documento novamente, validando o match
    if (msg.includes("CPF já está cadastrado") && cpf) {
      console.log("[Bling] CPF já existe, buscando por documento:", cpf);
      const idEncontrado = await buscarPorDoc(cpf);
      if (idEncontrado) return idEncontrado;

      // Fallback: busca por nome do request, mas valida documento
      console.log("[Bling] Busca por documento falhou no fallback, tentando por nome:", dados.nome);
      try {
        const search = await blingRequest("GET", `/contatos?nome=${encodeURIComponent(dados.nome)}`) as any;
        const found = search?.data?.[0];
        if (found?.id) {
          const foundDoc = (found.numeroDocumento ?? "").replace(/\D/g, "");
          if (foundDoc === cpf) {
            console.log("[Bling] Contato validado por nome+documento:", found.id);
            return found.id as number;
          }
          console.warn("[Bling] Contato encontrado por nome mas documento não confere, ignorando");
        }
      } catch (e2) {
        console.warn("[Bling] Busca por nome falhou:", e2);
      }
    }
  }

  return null;
}

// ─── Venda ────────────────────────────────────────────────────────────────────

export async function createVenda(dados: {
  nome: string;
  email: string;
  cpfCnpj: string;
  telefone?: string;
  itens: Array<{ blingId: number; quantidade: number; valor: number }>;
  total: number;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro?: string;
    cidade: string;
    uf: string;
  };
  condicaoPagamento?: string;
  observacao?: string;
  descontoValor?: number;
}) {
  const today = new Date().toISOString().split("T")[0];
  const telefone = dados.telefone?.replace(/\D/g, "") || undefined;

  const contatoId = await upsertContato({
    nome: dados.nome,
    email: dados.email,
    cpfCnpj: dados.cpfCnpj,
    telefone: dados.telefone,
    endereco: dados.endereco,
  });

  const venda = await blingRequest("POST", "/pedidos/vendas", {
    data: today,
    dataSaida: today,
    situacao: { id: 6 },
    contato: contatoId
      ? { id: contatoId, telefone }
      : {
          nome: dados.nome,
          email: dados.email,
          numeroDocumento: dados.cpfCnpj.replace(/\D/g, ""),
          tipo: dados.cpfCnpj.replace(/\D/g, "").length === 14 ? "J" : "F",
          situacao: "A",
          cliente: true,
          telefone,
          endereco: {
            endereco: dados.endereco.logradouro,
            numero: dados.endereco.numero,
            complemento: dados.endereco.complemento ?? "",
            bairro: dados.endereco.bairro ?? "",
            municipio: dados.endereco.cidade,
            uf: dados.endereco.uf,
            cep: dados.endereco.cep.replace(/\D/g, ""),
          },
        },
    itens: dados.itens.map((item) => ({
      produto: { id: item.blingId },
      quantidade: item.quantidade,
      valor: item.valor,
    })),
    transporte: {
      enderecoEntrega: {
        endereco: dados.endereco.logradouro,
        numero: dados.endereco.numero,
        complemento: dados.endereco.complemento ?? "",
        bairro: dados.endereco.bairro ?? "",
        cep: dados.endereco.cep.replace(/\D/g, ""),
        municipio: dados.endereco.cidade,
        uf: dados.endereco.uf,
      },
    },
    ...(dados.descontoValor ? { desconto: { valor: dados.descontoValor, unidade: "R$" } } : {}),
    pagamento: {
      formaPagamento: "Dinheiro",
      ...(dados.condicaoPagamento ? { condicaoPagamento: dados.condicaoPagamento } : {}),
    },
    observacao: dados.observacao,
  }) as any;

  return {
    venda,
    contatoId,
  };
}

// ─── NFe — stubbed ────────────────────────────────────────────────────────────

export async function createNFe(vendaId: number) {
  console.log("[NFe] Stub — would create NFe for venda:", vendaId);
  return { stubbed: true, vendaId };
}

// ─── OAuth authorization (GET) ────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    const authUrl = new URL(BLING_AUTH_URL);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", BLING_ID);
    authUrl.searchParams.set("redirect_uri", BLING_REDIRECT_URI);
    authUrl.searchParams.set("state", "zaylo");
    return Response.redirect(authUrl.toString(), 302);
  }

  try {
    const res = await fetch(BLING_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: BLING_BASIC_AUTH,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: BLING_REDIRECT_URI,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(JSON.stringify(data));

    await setupBlingTokensTable();
    await saveBlingTokens(data.access_token, data.refresh_token, data.expires_in ?? 21600);

    console.log("[Bling] Authorized and tokens saved to Turso");

    return new Response(
      JSON.stringify({ ok: true, message: "Bling authorized! Tokens saved to Turso." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// ─── API actions (POST) ───────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "createVenda": {
        let vendaData = data;

        // If orderId is provided, look up full order data from Turso
        if (data.orderId) {
          const orderMeta = (await getOrder(data.orderId)) ?? {};
          const {
            nome = "Cliente",
            email = "",
            cpfCnpj = "",
            telefone = "",
            itens = [],
            total = 0,
            endereco = {},
          } = orderMeta;

          vendaData = {
            nome,
            email,
            cpfCnpj,
            telefone,
            itens: itens.map((i: any) => ({
              blingId: buscarBlingId(i.slug, i.corVarianteSelecionada, i.tamanhoSelecionado) ?? i.blingId ?? i.produtoId ?? i.id,
              quantidade: i.quantidade,
              valor: i.preco,
            })),
            total,
            endereco: {
              cep: endereco.cep,
              logradouro: endereco.logradouro,
              numero: endereco.numero,
              complemento: endereco.complemento,
              bairro: endereco.bairro,
              cidade: endereco.cidade,
              uf: endereco.uf,
            },
          };
        }

        const result = await createVenda(vendaData);
        return new Response(JSON.stringify(result), { status: 200 });
      }
      case "createNFe": {
        const result = await createNFe(data.vendaId);
        return new Response(JSON.stringify(result), { status: 200 });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
    }
  } catch (error: any) {
    console.error("Bling API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
