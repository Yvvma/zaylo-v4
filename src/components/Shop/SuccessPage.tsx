import { useState, useEffect } from "react";

interface OrderData {
  nome: string;
  email: string;
  itens: any[];
  total: number;
  totalPrice: number;
  fretePreco: number;
  descontoPercent?: number | null;
  descontoValor?: number;
  freteSelecionado: any;
  shipmentOrderId?: string;
  orderId?: string;
  trackingCode?: string;
  labelUrl?: string;
  condicaoPagamento?: string;
  observacao?: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}

function getOrderData(): OrderData | null {
  const orderData = localStorage.getItem("lastOrder");
  if (orderData) {
    try {
      return JSON.parse(orderData);
    } catch {
      return null;
    }
  }
  return null;
}

export default function SuccessPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const data = getOrderData();
    setOrderData(data);
  }, []);

  return (
    <div className="min-h-screen bg-white ">
      {/* Header */}
      <header className="bg-white border-b border-black px-4 py-4">
        <div className="max-w-md mx-auto">
          <a href="/">
            <img src="/logos/zaylo-logo.png" alt="Zaylo" className="h-8" />
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-65px)] ">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1
            className="text-2xl text-gray-900 mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Pedido Confirmado!
          </h1>

          <p
            className="text-sm text-gray-500 mb-6"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Você receberá o código de rastreio por e-mail.
          </p>

          {/* Order summary */}
          {orderData && (
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: "var(--font-body)" }}>
                Resumo do pedido
              </p>
              <ul className="divide-y divide-gray-200">
                {orderData.itens.map((item: any, i: number) => (
                  <li key={i} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate" style={{ fontFamily: "var(--font-body)" }}>
                        {item.title || item.titulo}
                      </p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-body)" }}>
                        {item.selectedSize && `Tam: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedVariantColor && " | "}
                        {item.selectedVariantColor}
                        {` x${item.quantity || item.quantidade}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 ml-4 whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                      R$ {((item.price || item.preco) * (item.quantity || item.quantidade)).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 pt-3 mt-2 border-t border-gray-200">
                {orderData.fretePreco > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Frete</span>
                    <span>R$ {orderData.fretePreco.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>R$ {(orderData.totalPrice ?? orderData.total).toFixed(2)}</span>
                </div>
                {(orderData.descontoValor ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Desconto{orderData.descontoPercent ? ` (${orderData.descontoPercent}%)` : ""}</span>
                    <span>- R$ {(orderData.descontoValor ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-body)" }}>Total</span>
                  <span className="text-lg font-semibold text-gray-900" style={{ fontFamily: "var(--font-body)" }}>
                    R$ {orderData.total.toFixed(2)}
                  </span>
                </div>
                {orderData.observacao && (
                  <p className="text-xs text-gray-500 pt-1" style={{ fontFamily: "var(--font-body)" }}>
                    {orderData.observacao}
                  </p>
                )}
                {orderData.condicaoPagamento && orderData.condicaoPagamento !== "1x" && (
                  <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-body)" }}>
                    Parcelado em {orderData.condicaoPagamento}
                  </p>
                )}
              </div>
              {orderData.trackingCode && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: "var(--font-body)" }}>
                    Código de rastreio
                  </p>
                  <p className="text-sm font-mono text-gray-800" style={{ fontFamily: "var(--font-body)" }}>
                    {orderData.trackingCode}
                  </p>
                </div>
              )}
              {orderData.orderId && (
                <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "var(--font-body)" }}>
                  Pedido: {orderData.orderId}
                </p>
              )}
            </div>
          )}

          {/* Back to home */}
          <a
            href="/"
            className="block mt-6 text-gray-400 text-sm hover:text-gray-600 transition"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Continuar Comprando
          </a>
        </div>
      </div>
    </div>
  );
}