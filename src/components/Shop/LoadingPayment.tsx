import { useState, useEffect } from "react";

interface OrderData {
  nome: string;
  email: string;
  itens: any[];
  total: number;
  orderId: string;
}

function getOrderData(): OrderData | null {
  try {
    const raw = localStorage.getItem("lastOrder");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function LoadingPayment() {
  const [orderData] = useState<OrderData | null>(getOrderData);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("paymentId");
    if (!paymentId) return;

    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelled) return;
        try {
          const res = await fetch("/api/asaas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getPayment", paymentId }),
          });
          const data = await res.json();
          if (data.status === "RECEIVED" || data.status === "CONFIRMED") {
            localStorage.removeItem("cart");
            window.location.href = "/success";
            return;
          }
        } catch {}
      }
    };
    poll();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-black px-4 py-4">
        <div className="max-w-md mx-auto">
          <a href="/">
            <img src="/logos/zaylo-logo.png" alt="Zaylo" className="h-8" />
          </a>
        </div>
      </header>

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-65px)]">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          {/* Spinner */}
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          <h1 className="text-2xl text-gray-900 mb-2" style={{ fontFamily: "var(--font-body)" }}>
            Processando pagamento
          </h1>

          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-body)" }}>
            Seu pedido está sendo confirmado. Assim que o pagamento for aprovado, você será redirecionado.
          </p>

          {orderData && (
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Resumo do pedido
              </p>
              <p className="text-sm text-gray-800" style={{ fontFamily: "var(--font-body)" }}>
                {orderData.itens.length} {orderData.itens.length === 1 ? "produto" : "produtos"}
              </p>
              <p className="text-lg text-gray-900 font-semibold mt-2" style={{ fontFamily: "var(--font-body)" }}>
                R$ {orderData.total.toFixed(2)}
              </p>
            </div>
          )}

          <a
            href="/"
            className="block mt-6 text-gray-400 text-sm hover:text-gray-600 transition"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Voltar para loja
          </a>
        </div>
      </div>
    </div>
  );
}
