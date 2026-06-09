# Zaylo v4 — E-commerce PET (Astro 5 + React 19)

E-commerce brasileiro de acessórios PET, SSR-first, deploy em Vercel.

---

## 1. Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Astro 5.4 (`output: server`) |
| UI Islands | React 19 (Framer Motion 12) |
| Estilização | Tailwind CSS v4 (Vite plugin) |
| Database | Turso (libSQL, raw SQL) |
| Pagamentos | Asaas (PIX, boleto, cartão de crédito) |
| ERP | Bling v3 (OAuth2) |
| Frete | Melhor Envio (OAuth2) |
| Email | Resend (transactional) |
| Blog upload | GitHub API (admin envia .md ao repositório) |
| Deploy | Vercel (`@astrojs/vercel`, serverless) |
| Fontes | Helvetica Now, Roboto, SF Pro (self-hosted) |

---

## 2. Arquitetura

```
request → Vercel Edge → Astro SSR → React islands (client:load/client:only)
                              │
                    ┌─────────┴──────────┐
                    │                     │
              Páginas SSR           API Routes
             (index, produtos,     (/api/asaas,
              checkout, blog…)      /api/bling-auth,
                                    /api/melhor-envio…)
                    │                     │
                    └─────────┬───────────┘
                              │
                    ┌─────────┴──────────┐
                    │         │          │
                  Turso     Asaas     Bling/ME
                (orders,   (payments)  (ERP/shipping)
                 coupons,
                 tokens,
                 admin)
```

- Toda rota não-API é SSR (exceto `produtos/[slug]` e `blog/[slug]`, que são prerendered via `getStaticPaths`)
- React entra como ilhas interativas: carrinho, checkout, galeria, admin
- API routes funcionam como serverless functions no Vercel

---

## 3. Estrutura de diretórios

```
src/
├── texts.json              # Strings de UI (português, dot-notation)
├── text.ts                 # Helper tx() para resolver dot-paths
├── styles/global.css       # Tailwind + fontes customizadas
├── data/
│   ├── products.ts         # Definição estática dos 6 produtos (tipado)
│   └── bling-produtos.ts   # Mapeamento Bling ID → SKU
├── content/
│   ├── config.ts           # Schema Zod para coleção blog
│   └── blog/*.md           # Posts do blog (frontmatter + markdown)
├── layouts/
│   ├── Layout.astro        # Layout principal (preto, Header + Footer)
│   └── ShopLayout.astro    # Layout mínimo (CSS + CartProvider)
├── pages/
│   ├── index.astro                  # Homepage
│   ├── produtos.astro               # Vitrine
│   ├── produtos/[slug].astro        # Página de produto (prerendered)
│   ├── checkout.astro               # Checkout
│   ├── loading-payment.astro        # Polling de pagamento
│   ├── success.astro                # Confirmação pós-compra
│   ├── payment.astro                # Info formas de pagamento
│   ├── blog.astro                   # Listagem blog
│   ├── blog/[slug].astro            # Post blog (prerendered)
│   ├── blog/admin.astro             # Admin de blog (protegido)
│   ├── revendedor/index.astro       # B2B
│   ├── sobre/index.astro            # Sobre
│   ├── ajuda/index.astro            # Ajuda/trocas
│   ├── privacidade/index.astro      # Privacidade
│   └── login/{index,signup,forgot}.astro  # Login UI (sem backend)
└── pages/api/              # 13 endpoints serverless (ver §7)
```

---

## 4. Catálogo de produtos

6 produtos definidos estaticamente em `src/data/products.ts`:

| Slug | Nome | Varia cor | Varia tam | Imagens |
|------|------|-----------|-----------|---------|
| `bungee-harness` | Bungee Harness | sim | sim | sim |
| `bungee-harness-no-pull` | Bungee Harness No Pull | sim | sim | sim |
| `double-leash` | Double Leash | sim | não | sim |
| `freedom-leash` | Freedom Leash | sim | não | sim |
| `ozy-vest` | Ozy Vest | não | sim (numérico) | sim |
| `steel-bowl` | Steel Bowl | sim | não | sim |

Cada variante possui: `{ color, size?, images, sku, blingId? }`.  
Produto possui `shipping: { weight, width, height, length, insuranceValue }`.

---

## 5. Sistema de carrinho (`CartContext.tsx`)

- **Estado global** via React Context + fallback síncrono (`let store` fora da árvore React, usado por `checkout.astro` e `success.astro`)
- **Persistência**: `localStorage` chave `"zaylo-cart"`, serializa JSON a cada mutação
- **Operações**: add, remove, update quantity, clear, cálculo de total, armazenamento de frete
- **Consumidores**: `CartSidebar`, `CartBar`, `CheckoutPage`, `ProductDetail`, `ShopPage`, `ProductCard`

---

## 6. Rotas e estratégia SSR

| Rota | Estratégia | Descrição |
|------|-----------|-----------|
| `/` | SSR | Homepage (6 seções) |
| `/produtos` | SSR | Vitrine com filtros |
| `/produtos/[slug]` | **Prerendered** | `getStaticPaths()` → 6 páginas |
| `/checkout` | SSR | SPA de checkout |
| `/loading-payment` | SSR | Polling Asaas |
| `/success` | SSR | Lê localStorage |
| `/blog` | SSR | `astro:content` |
| `/blog/[slug]` | **Prerendered** | 5 posts |
| `/blog/admin` | SSR | Painel (sessão) |
| `/revendedor` | SSR | Landing B2B (SPA) |
| `/sobre`, `/ajuda`, `/privacidade` | SSR | Páginas conteúdo |
| `/login/*` | SSR | Forms sem backend |
| `/api/*` | SSR | Serverless functions |

---

## 7. API routes (13 endpoints)

| Endpoint | Método | Função |
|----------|--------|--------|
| `/api/admin-auth` | POST, GET | Login admin + verificação de sessão (cookie) |
| `/api/admin-upload` | POST | Upload .md para blog via GitHub API |
| `/api/asaas` | POST | Proxy Asaas (customer, payment, installment, getPayment, PIX QR code) + saveOrder |
| `/api/bling-auth` | POST, GET | OAuth2: authorize, callback, refresh + createVenda |
| `/api/coupon` | POST | Validar cupom na tabela `coupons` |
| `/api/influencer-order` | POST | Pipeline completa: order → Bling → ME → email |
| `/api/melhor-envio-auth` | POST, GET | OAuth2 ME + addToCart, checkout, generate, searchOrder, tracking |
| `/api/melhor-envio` | POST | Cálculo de frete (proxy) |
| `/api/melhor-envio-webhook` | POST | Webhook ME: salva tracking code + email |
| `/api/order-store` | GET | Re-exporta saveOrder/getOrder |
| `/api/resend` | POST | Envio de emails HTML (confirmação, admin, tracking, influencer) |
| `/api/turso` | (shared) | Cliente DB + setup tables + CRUD |
| `/api/webhook` | POST | Asaas `PAYMENT_RECEIVED` → salva pedido → Bling → ME → email |

---

## 8. Database (Turso / libSQL)

Tabelas gerenciadas em `src/pages/api/turso.ts`:

| Tabela | Finalidade |
|--------|------------|
| `bling_tokens` | Tokens OAuth2 Bling |
| `me_tokens` | Tokens OAuth2 Melhor Envio |
| `orders` | Pedidos (cliente, endereço, itens, pagamento, status, tracking) |
| `admin` | Credenciais admin (username + hash) |
| `coupons` | Cupons (INFLUXXXXZYL, WELCOME10, TESTEPAGAMENTO) |

---

## 9. Integrações

### 9.1 Asaas (pagamentos)
- Proxy em `/api/asaas.ts`
- Cartão (à vista + parcelado), boleto, PIX
- PIX via `getPixQrCode`
- Webhook `PAYMENT_RECEIVED` → pipeline completa
- Loading-payment faz polling até confirmação

### 9.2 Bling (ERP)
- OAuth2 completo em `/api/bling-auth.ts`
- `createVenda()` envia pedido para API v3
- Tokens persistidos com auto-refresh
- Rate-limit: 1 req / 100ms

### 9.3 Melhor Envio (frete)
- OAuth2 em `/api/melhor-envio-auth.ts`
- Cálculo via `calculateShipment()`
- Geração de etiqueta: addToCart → checkout → generate
- Webhook salva código de rastreio + email

### 9.4 Resend (email)
- Templates HTML inline: confirmação, admin, tracking, influencer
- Usa Resend React Email API

### 9.5 GitHub API (blog)
- Admin faz upload de `.md` para `src/content/blog/` via GitHub Contents API
- Autenticado por `import.meta.env.GH_TOKEN`

---

## 10. Fluxo de compra completo

```
1. Usuário navega /produtos → adiciona ao carrinho (CartContext + localStorage)
2. Vai para /checkout → preenche dados + frete (calcula via /api/melhor-envio)
3. Escolhe pagamento:
   ├─ PIX → /api/asaas (createPixPayment) → /loading-payment (polling)
   ├─ Boleto → /api/asaas (createBoletoPayment) → /loading-payment
   └─ Cartão → /api/asaas (createCreditCardPayment ou createInstallmentPayment)
4. Confirmação → /success
5. Webhook Asaas (PAYMENT_RECEIVED) → saveOrder → Bling (createVenda) → ME (etiqueta) → Resend (email)
```

---

## 11. Configuração

### Variáveis de ambiente

```
PUBLIC_ASAAS_URL
ASAAS_API_KEY
PUBLIC_ASAAS_ACCESS_TOKEN
PUBLIC_ASAAS_WALLET_ID
ME_FROM_NAME / EMAIL / POSTAL_CODE / PHONE / DOCUMENT
TURSO_DB_URL / TURSO_DB_AUTH_TOKEN
RESEND_API_KEY
GH_TOKEN
BLING_CLIENT_ID / BLING_CLIENT_SECRET
ME_CLIENT_ID / ME_CLIENT_SECRET / ME_REDIRECT_URI
```

### Desenvolvimento

```bash
npm install
npm run dev
```

### Build

```bash
npm run build    # Saída em dist/
npm run preview  # Preview local do build
```

---

## 12. Observações técnicas

- **Login**: páginas UI-only (`LoginPage`, `SignupPage`, `ForgotPasswordPage`) — sem integração com backend
- **ContactForm**: usa `data-netlify="true"`, mas o deploy é Vercel — precisa migrar
- **Litco Skateboarding**: textos placeholder remanescentes em páginas `sobre`, `ajuda`, `privacidade`
- **Stripe**: dependência presente em `package.json` mas não utilizada no código
- **ContentPageWrapper**: referência a `.module.css` que não existe (usa Tailwind inline)
- **CartContext**: fallback síncrono global permite acesso ao carrinho fora da árvore React (necessário para `checkout.astro` e `success.astro`)
