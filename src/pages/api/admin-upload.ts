import type { APIRoute } from "astro";
import { createClient } from "@libsql/client";

const db = createClient({
  url: import.meta.env.TURSO_DB_URL ?? "",
  authToken: import.meta.env.TURSO_TOKEN ?? "",
});

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN ?? "";
const GITHUB_OWNER = import.meta.env.GITHUB_OWNER ?? "";
const GITHUB_REPO = import.meta.env.GITHUB_REPO ?? "";
const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH ?? "main";

async function verifySession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const result = await db.execute({
    sql: "SELECT expires_at FROM admin_sessions WHERE id = ?",
    args: [sessionId],
  });
  if (!result.rows.length) return false;
  const expiresAt = result.rows[0].expires_at as number;
  if (Date.now() > expiresAt) {
    await db.execute({
      sql: "DELETE FROM admin_sessions WHERE id = ?",
      args: [sessionId],
    });
    return false;
  }
  return true;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionId = cookies.get("admin_session")?.value;
    if (!sessionId || !(await verifySession(sessionId))) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });
    }

    const body = await request.json();
    const { content, filename } = body;

    if (!content || !filename) {
      return new Response(JSON.stringify({ error: "Conteúdo e nome do arquivo obrigatórios" }), { status: 400 });
    }

    if (!filename.endsWith(".md")) {
      return new Response(JSON.stringify({ error: "Apenas arquivos .md são aceitos" }), { status: 400 });
    }

    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: "GitHub token não configurado" }), { status: 500 });
    }

    const path = `src/content/blog/${filename}`;
    const base64Content = Buffer.from(content, "utf-8").toString("base64");

    const githubRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message: `Adicionar post: ${filename}`,
          content: base64Content,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    const githubData = await githubRes.json();

    if (!githubRes.ok) {
      console.error("GitHub API error:", githubData);
      return new Response(
        JSON.stringify({ error: githubData.message || "Erro ao enviar para o GitHub" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${path}`,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Admin upload error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500 });
  }
};
