import { useState, useEffect, useCallback } from "react";
import { getShippingSpecs, calculatePackageDimensions } from "../../data/products";

type PaymentMethod = "CREDIT_CARD" | "BOLETO" | "PIX" | "INFLUENCER";

interface CartItem {
  id: number;
  title: string;
  price: number;
  mainImg?: string;
  quantity: number;
  selectedVariantImage?: string;
  selectedVariantColor?: string;
  selectedVariantSku?: string;
  selectedSize?: string;
  weight?: number;
  dimensions?: { width: number; height: number; length: number };
  slug?: string;
}

interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city: string;
  state: string;
}

interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  deliveryTime: string;
  company: string;
  serviceId?: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.length <= 10
    ? d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
    : d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function formatCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, "$1-$2");
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function createAsaasCustomer(data: AsaasCustomer) {
  const res = await fetch("/api/asaas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "createCustomer", ...data }),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(responseData.errors?.[0]?.description ?? "Falha ao criar cliente");
  return responseData;
}

async function createAsaasPayment(payload: Record<string, unknown>) {
  const res = await fetch("/api/asaas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "createPayment", ...payload }),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(responseData.errors?.[0]?.description ?? "Falha ao criar pagamento");
  }
  return responseData;
}

async function createAsaasInstallment(payload: Record<string, unknown>) {
  const res = await fetch("/api/asaas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "createInstallment", ...payload }),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(responseData.errors?.[0]?.description ?? "Falha ao criar parcelamento");
  }
  return responseData;
}

async function fetchPixQrCode(paymentId: string) {
  const res = await fetch("/api/asaas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getPixQrCode", paymentId }),
  });
  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(responseData.errors?.[0]?.description ?? "Falha ao buscar QR Code");
  }
  return responseData;
}

async function fetchAddressByCEP(cep: string) {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return data;
}

async function calculateShipping(items: CartItem[], postalCode: string) {
  const res = await fetch("/api/melhor-envio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "calculateShipment",
      from: { postal_code: "13574020" },
      to: { postal_code: postalCode },
      products: items.map(item => {
        const specs = item.slug ? getShippingSpecs(item.slug, item.selectedSize) : null;
        return {
          id: String(item.id),
          width: specs?.width ?? 10,
          height: specs?.height ?? 10,
          length: specs?.length ?? 15,
          weight: specs?.weight ?? item.weight ?? 0.3,
          insurance_value: item.price * item.quantity,
          quantity: item.quantity,
        };
      }),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Shipping calculation error");
    return [];
  }

  // Parse Melhor Envio response — only Correios
  const options: ShippingOption[] = [];
  if (Array.isArray(data)) {
    data.forEach((item: any) => {
      const companyName = item.company?.name || item.name || "";
      if (companyName !== "Correios") return;
      if (item.price && item.delivery_time !== undefined) {
        options.push({
          id: item.id || item.company?.id + "_" + item.service,
          name: companyName,
          price: parseFloat(item.price),
          currency: item.currency || "BRL",
          deliveryTime: item.delivery_time + " dias úteis",
          company: companyName,
          serviceId: item.id, // Save service ID for buying shipment
        });
      }
    });
  }
  return options;
}

async function pollPaymentConfirmed(paymentId: string, timeoutMs = 60000): Promise<boolean> {
  const interval = 3000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, interval));
    const res = await fetch("/api/asaas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPayment", paymentId }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.status === "CONFIRMED" || data.status === "RECEIVED") return true;
    if (data.status === "DECLINED" || data.status === "REFUNDED" || data.status === "CHARGEBACK") return false;
  }
  return false;
}

// No shipment/email logic here — handled server-side by /api/webhook after Asaas confirms payment

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 10000);
    const done = setTimeout(onDone, 11200);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onDone]);

  return (
    <div
      style={{ transition: "opacity 1.2s ease" }}
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 max-w-xs ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <img src="/logos/zaylo-logo.png" alt="Zaylo" className="h-5 mt-0.5 invert shrink-0" />
      <p className="text-sm text-gray-700 leading-snug">{message}</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
      />
    </div>
  );
}

// Accordion for payment
function Accordion({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="border-t border-gray-200 px-4 py-4 bg-white">{children}</div>}
    </div>
  );
}

// ─── Read cart from localStorage directly ─────────────────────────────────────

function useCartDirect() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        const items = JSON.parse(stored) as CartItem[];
        setCartItems(items);
        setTotalPrice(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
      } catch (e) {
        setCartItems([]);
        setTotalPrice(0);
      }
    }
  }, []);

  return { cartItems, totalPrice };
}

// ─── Main component ───────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const { cartItems, totalPrice } = useCartDirect();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");

  // Accordion states - only for payment
  const [paymentOpen, setPaymentOpen] = useState(true);

  // Payment result
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [boletoPdfUrl, setBoletoPdfUrl] = useState<string | null>(null);
  const [boletoBarCode, setBoletoBarCode] = useState<string | null>(null);

  // Customer fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  // Address
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // Shipping
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Credit card
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const MAX_INSTALLMENTS = 6;
  const MONTHLY_INTEREST = 0.0349;
  const [installmentCount, setInstallmentCount] = useState(1);

  // Retorna o valor de CADA parcela com juros
  function calcInstallmentAmount(n: number): number {
    if (n <= 1) return total;
    return total * (MONTHLY_INTEREST * Math.pow(1 + MONTHLY_INTEREST, n)) / (Math.pow(1 + MONTHLY_INTEREST, n) - 1);
  }
  // Total cobrado com juros
  function calcTotalWithInterest(n: number): number {
    if (n <= 1) return total;
    return calcInstallmentAmount(n) * n;
  }

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToastMsg(msg), []);

  // Coupon
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  // Auto-switch payment method based on coupon
  useEffect(() => {
    if (appliedCoupon?.discountPercent === 100) {
      setPaymentMethod("INFLUENCER");
    } else if (!appliedCoupon && paymentMethod === "INFLUENCER") {
      setPaymentMethod("CREDIT_CARD");
    }
  }, [appliedCoupon]);

  const shippingPrice = selectedShipping?.price || 0;
  const subtotalWithShipping = totalPrice + shippingPrice;
  const discountAmount = appliedCoupon ? subtotalWithShipping * (appliedCoupon.discountPercent / 100) : 0;
  const total = subtotalWithShipping - discountAmount;

  const handleCEPBlur = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    const data = await fetchAddressByCEP(clean);
    if (data) {
      setAddress(data.logradouro ?? "");
      setDistrict(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
    }
    setCepLoading(false);

    // Calculate shipping when CEP is filled
    if (clean.length === 8 && cartItems.length > 0) {
      setShippingLoading(true);
      const options = await calculateShipping(cartItems, clean);
      setShippingOptions(options);
      setShippingLoading(false);
    }
  };

  function saveLastOrder() {
    const paymentObs = paymentMethod === "CREDIT_CARD"
      ? `Cartão de Crédito${installmentCount > 1 ? ` - ${installmentCount}x` : ""}`
      : "PIX";
    const paymentCond = paymentMethod === "CREDIT_CARD" && installmentCount > 1 ? `${installmentCount}x` : "1x";

    localStorage.setItem("lastOrder", JSON.stringify({
      nome: name,
      email: email,
      itens: cartItems,
      total,
      totalPrice,
      fretePreco: shippingPrice,
      descontoPercent: appliedCoupon?.discountPercent ?? null,
      descontoValor: appliedCoupon ? discountAmount : 0,
      freteSelecionado: selectedShipping,
      condicaoPagamento: paymentCond,
      observacao: paymentObs,
      endereco: { cep, logradouro: address, numero: addressNumber, complemento: complement, bairro: district, cidade: city, uf: state },
    }));
  }

  const handleSubmit = async () => {
    setError(null);

    if (!selectedShipping) {
      setError("Selecione um frete antes de finalizar o pedido.");
      return;
    }

    if (!address.trim()) {
      setError("O campo Endereço é obrigatório.");
      return;
    }
    if (!addressNumber.trim()) {
      setError("O campo Número é obrigatório.");
      return;
    }
    if (!district.trim()) {
      setError("O campo Bairro é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    // Pedido de influencer (100% de desconto) — pula Asaas
    if (appliedCoupon?.discountPercent === 100) {
      try {
        const orderId = `ZY${Date.now()}`;
        const orderData = {
          nome: name, email, cpfCnpj: cpf.replace(/\D/g, ""),
          telefone: phone.replace(/\D/g, ""),
          itens: cartItems.map(i => ({
            id: i.id, slug: (i as any).slug, titulo: i.title,
            quantidade: i.quantity, preco: i.price, peso: i.weight,
            tamanhoSelecionado: i.selectedSize, corVarianteSelecionada: i.selectedVariantColor,
          })),
          total: 0,
          endereco: { cep, logradouro: address, numero: addressNumber, complemento: complement, bairro: district, cidade: city, uf: state },
          freteSelecionado: selectedShipping,
          condicaoPagamento: "1x",
          cupom: appliedCoupon.code,
          descontoPercent: 100,
          descontoValor: totalPrice + shippingPrice,
        };
        const res = await fetch("/api/influencer-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, orderData }),
        });
        if (!res.ok) throw new Error("Falha ao processar pedido");
        saveLastOrder();
        localStorage.removeItem("cart");
        window.location.href = "/success";
      } catch (err: any) {
        setError(err.message ?? "Ocorreu um erro. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const customer = await createAsaasCustomer({
        name,
        email,
        cpfCnpj: cpf.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        postalCode: cep.replace(/\D/g, ""),
        address,
        addressNumber,
        complement,
        province: district,
        city,
        state,
      });

      // Generate short order ID (max 100 chars for Asaas externalReference)
      const orderId = `ZY${Date.now()}`;

      // Save full order metadata server-side keyed by orderId
      await fetch("/api/asaas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveOrder",
          orderId,
          orderData: {
            nome: name,
            email: email,
            cpfCnpj: cpf.replace(/\D/g, ""),
            itens: cartItems.map(i => ({
              id: i.id,
              slug: i.slug,
              titulo: i.title,
              quantidade: i.quantity,
              preco: i.price,
              peso: i.weight,
              tamanhoSelecionado: i.selectedSize,
              corVarianteSelecionada: i.selectedVariantColor,
              produtoId: i.id,
            })),
            total,
            telefone: phone.replace(/\D/g, ""),
            endereco: { cep, logradouro: address, numero: addressNumber, complemento: complement, bairro: district, cidade: city, uf: state },
            freteSelecionado: selectedShipping,
            condicaoPagamento: paymentMethod === "CREDIT_CARD" && installmentCount > 1 ? `${installmentCount}x` : "1x",
            observacao: paymentMethod === "CREDIT_CARD"
              ? `Cartão de Crédito${installmentCount > 1 ? ` - ${installmentCount}x` : ""}`
              : "PIX",
            cupom: appliedCoupon?.code ?? null,
            descontoPercent: appliedCoupon?.discountPercent ?? null,
            descontoValor: appliedCoupon ? discountAmount : null,
          },
        }),
      });

      const basePayload: Record<string, unknown> = {
        customer: customer.id,
        billingType: paymentMethod,
        value: total,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        description: `Pedido via loja - ${paymentMethod === "CREDIT_CARD" ? `Cartão de Crédito${installmentCount > 1 ? ` ${installmentCount}x` : ""}` : "PIX"}`,
        externalReference: orderId,
      };

      if (paymentMethod === "CREDIT_CARD") {
        const [expiryMonth, expiryYear] = expiry.split("/");
        const creditCard = {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth,
          expiryYear: `20${expiryYear}`,
          ccv: cvv,
        } as AsaasCreditCard;
        const creditCardHolderInfo = {
          name,
          email,
          cpfCnpj: cpf.replace(/\D/g, ""),
          postalCode: cep.replace(/\D/g, ""),
          addressNumber,
          phone: phone.replace(/\D/g, ""),
        };

        if (installmentCount > 1) {
          const totalWithInterest = calcTotalWithInterest(installmentCount);
          const installment = await createAsaasInstallment({
            installmentCount,
            customer: customer.id,
            value: calcInstallmentAmount(installmentCount),
            totalValue: totalWithInterest,
            billingType: "CREDIT_CARD",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            description: basePayload.description,
            paymentExternalReference: orderId,
            creditCard,
            creditCardHolderInfo,
            remoteIp: "127.0.0.1",
          });

          if (!installment?.id) {
            throw new Error("Falha ao criar parcelamento");
          }
        } else {
          const payment = await createAsaasPayment({
            ...basePayload,
            creditCard,
            creditCardHolderInfo,
          });

          const isConfirmed =
            payment.status === "CONFIRMED" || payment.status === "RECEIVED"
              ? true
              : await pollPaymentConfirmed(payment.id);

          if (!isConfirmed) {
            throw new Error("Pagamento não confirmado. Verifique os dados do cartão.");
          }
        }

        saveLastOrder();
        localStorage.removeItem("cart");
        window.location.href = "/success";
      } else if (paymentMethod === "PIX") {
        const payment = await createAsaasPayment(basePayload);
        setPixPaymentId(payment.id);
        const pixData = await fetchPixQrCode(payment.id);
        setPixQrCode(pixData.encodedImage);
        setPixCopyPaste(pixData.payload);
        saveLastOrder();
        // Poll for payment confirmation and redirect
        pollPaymentConfirmed(payment.id, 120000).then((confirmed) => {
          if (confirmed) {
            localStorage.removeItem("cart");
            window.location.href = "/success";
          }
        });
      } else {
        const payment = await createAsaasPayment(basePayload);
        setBoletoPdfUrl(payment.bankSlipUrl);
        setBoletoBarCode(payment.nossoNumero ?? "");
        saveLastOrder();
        localStorage.removeItem("cart");
        localStorage.setItem("lastOrderBoleto", JSON.stringify({ pdfUrl: payment.bankSlipUrl, barCode: payment.nossoNumero ?? "" }));
      }
    } catch (err: any) {
      setError(err.message ?? "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Pix result screen ──
  if (pixQrCode || pixCopyPaste) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pagamento via PIX</h2>
              <p className="text-xs text-gray-500">Copie o código ou escaneie o QR Code</p>
            </div>
          </div>

          {pixQrCode && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 mb-4">
              <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-full h-auto" />
            </div>
          )}

          {pixCopyPaste && (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Código PIX</label>
              <div className="relative">
                <textarea
                  readOnly
                  value={pixCopyPaste}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-700 resize-none h-20 font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(pixCopyPaste)}
                  className="absolute right-2 top-2 text-xs font-medium text-green-600 hover:text-green-800"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500">
              Valor: <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">O código expira em 30 minutos</p>
          </div>

          <button
            onClick={() => {
              setPixQrCode(null);
              setPixCopyPaste(null);
            }}
            className="w-full border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
          >
            Voltar ao checkout
          </button>
        </div>
      </div>
    );
  }

  // ── Boleto result screen ──
  if (boletoPdfUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Boleto gerado!</h2>
          <p className="text-sm text-gray-500 mb-6">Vencimento em 3 dias úteis</p>
          {boletoBarCode && (
            <p className="text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 break-all">
              {boletoBarCode}
            </p>
          )}
          <a href={boletoPdfUrl} target="_blank" rel="noreferrer" className="block w-full bg-gray-900 text-white text-sm font-medium rounded-xl py-3 hover:bg-gray-800 transition-colors">
            Abrir boleto PDF
          </a>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex-col flex items-center justify-center text-gray-400 text-sm">
        Seu carrinho está vazio.
        <a href="/" className="text-blue-500 hover:text-blue-700">
          Voltar ao Website
        </a>
      </div>
    );
  }

  // ── Main checkout layout ──
  return (
    <div className="min-h-screen bg-gray-50 ">
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}
      {/* Simple Header */}
      <header className="bg-white border-b border-black px-4 py-4">
        <div className="max-w-5xl mx-auto">
         
            <img src="/logos/zaylo-logo.png" alt="Zaylo" className="h-8 invert" />
          
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Customer & Address forms */}
          <div className="lg:col-span-2 space-y-4">

            {/* Contact Section - No accordion */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Contato</h2>
              <div className="space-y-3">
                <InputField label="Nome completo" id="name" value={name} onChange={setName} required placeholder="João da Silva" />
                <InputField label="E-mail" id="email" type="email" value={email} onChange={setEmail} required placeholder="joao@email.com" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Telefone" id="phone" value={phone} onChange={(v) => setPhone(formatPhone(v))} required placeholder="(11) 91234-5678" />
                  <InputField label="CPF / CNPJ" id="cpf" value={cpf} onChange={(v) => setCpf(formatCPF(v))} required placeholder="000.000.000-00" />
                </div>
              </div>
            </div>

            {/* Address Section - No accordion */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Endereço de entrega</h2>
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="cep" className="text-xs font-medium text-gray-600">CEP <span className="text-red-500">*</span></label>
                  <input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    onBlur={handleCEPBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                  />
                  {cepLoading && <span className="text-xs text-gray-400">Buscando...</span>}
                </div>
                <InputField label="Logradouro" id="address" value={address} onChange={setAddress} required placeholder="Rua Exemplo" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Número" id="addressNumber" value={addressNumber} onChange={setAddressNumber} required placeholder="123" />
                  <InputField label="Complemento" id="complement" value={complement} onChange={setComplement} placeholder="Apto 4B (opcional)" />
                </div>
                <InputField label="Bairro" id="district" value={district} onChange={setDistrict} required placeholder="Centro" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Cidade" id="city" value={city} onChange={setCity} required placeholder="São Paulo" />
                  <InputField label="Estado" id="state" value={state} onChange={setState} required placeholder="SP" maxLength={2} />
                </div>
              </div>

              {/* Shipping Section - Always visible after address */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 mt-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Frete</h2>

                {!cep || cep.length < 9 ? (
                  <p className="text-sm text-gray-400">Preencha o CEP acima para calcular o frete</p>
                ) : shippingLoading ? (
                  <p className="text-sm text-gray-400">Calculando fretes...</p>
                ) : shippingOptions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Selecione uma opção de frete</p>
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedShipping?.id === option.id
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShipping?.id === option.id}
                            onChange={() => setSelectedShipping(option)}
                            className="w-4 h-4 text-gray-900"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{option.name}</p>
                            <p className="text-xs text-gray-500">{option.deliveryTime}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(option.price)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Nenhum frete disponível para este CEP.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        const clean = cep.replace(/\D/g, "");
                        if (clean.length === 8 && cartItems.length > 0) {
                          setShippingLoading(true);
                          const options = await calculateShipping(cartItems, clean);
                          setShippingOptions(options);
                          setShippingLoading(false);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <Accordion title="Pagamento" isOpen={paymentOpen} onToggle={() => setPaymentOpen(!paymentOpen)}>
              <div className="space-y-4">
                {/* Payment method buttons - stacked vertically */}
                <div className="flex flex-col gap-2">
                  {appliedCoupon?.discountPercent === 100 ? (
                    <>
                      {(["CREDIT_CARD", "PIX", "BOLETO"] as PaymentMethod[]).map((m) => {
                        const icons: Record<PaymentMethod, React.ReactNode> = {
                          CREDIT_CARD: (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          ),
                          PIX: (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          ),
                          BOLETO: (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ),
                        };
                        const labels: Record<PaymentMethod, string> = {
                          CREDIT_CARD: "Cartão de crédito",
                          PIX: "PIX",
                          BOLETO: "Boleto",
                        };
                        return (
                          <button
                            key={m}
                            type="button"
                            disabled
                            className="py-2.5 px-3 text-xs font-medium rounded-lg border border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            {icons[m]}
                            {labels[m]}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("INFLUENCER")}
                        className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          paymentMethod === "INFLUENCER"
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-amber-200 text-amber-700 hover:border-amber-400"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        INFLUENCER
                      </button>
                    </>
                  ) : (
                    (["CREDIT_CARD", "PIX", "BOLETO"] as PaymentMethod[]).map((m) => {
                      const icons: Record<PaymentMethod, React.ReactNode> = {
                        CREDIT_CARD: (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        ),
                        PIX: (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        ),
                        BOLETO: (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ),
                      };
                      const labels: Record<PaymentMethod, string> = {
                        CREDIT_CARD: "Cartão de crédito",
                        PIX: "PIX",
                        BOLETO: "Boleto",
                      };
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                            paymentMethod === m
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {icons[m]}
                          {labels[m]}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Credit card form */}
                {paymentMethod === "CREDIT_CARD" && appliedCoupon?.discountPercent !== 100 && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <InputField
                          label="Número do cartão"
                          id="cardNumber"
                          value={cardNumber}
                          onChange={(v) => setCardNumber(formatCardNumber(v))}
                          required
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <InputField
                          label="Nome no cartão"
                          id="cardName"
                          value={cardName}
                          onChange={(v) => setCardName(v.toUpperCase())}
                          required
                          placeholder="JOÃO DA SILVA"
                        />
                      </div>
                      <InputField
                        label="Validade"
                        id="expiry"
                        value={expiry}
                        onChange={(v) => setExpiry(formatExpiry(v))}
                        required
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                      <InputField
                        label="CVV"
                        id="cvv"
                        value={cvv}
                        onChange={setCvv}
                        required
                        placeholder="123"
                        maxLength={4}
                      />
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          Parcelamento
                        </label>
                        <select
                          value={installmentCount}
                          onChange={(e) => setInstallmentCount(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"
                        >
                          {Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                {n === 1
                                  ? `1x de ${formatCurrency(total)} (sem juros)`
                                  : `${n}x de ${formatCurrency(calcInstallmentAmount(n))} (${formatCurrency(calcTotalWithInterest(n))})`
                                }
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "PIX" && appliedCoupon?.discountPercent !== 100 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                    Após confirmar, você receberá um QR Code para pagar via PIX. O pagamento é confirmado instantaneamente.
                  </div>
                )}

                {paymentMethod === "BOLETO" && appliedCoupon?.discountPercent !== 100 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                    O boleto bancário será gerado após a confirmação. O prazo de vencimento é de <strong>3 dias úteis</strong>.
                  </div>
                )}

                {paymentMethod === "INFLUENCER" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    Cupom de influencer ativado — pedido será <strong>100% gratuito</strong>, sem necessidade de pagamento.
                  </div>
                )}
              </div>
            </Accordion>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedShipping}
              className="w-full bg-gray-900 text-white font-medium text-sm rounded-xl py-3.5 hover:bg-gray-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Aguardando confirmação..."
                : appliedCoupon?.discountPercent === 100
                  ? "Finalizar compra com 100% de desconto"
                  : `Finalizar pedido · ${paymentMethod === "CREDIT_CARD" && installmentCount > 1 ? `${installmentCount}x de ${formatCurrency(calcInstallmentAmount(installmentCount))}` : formatCurrency(total)}`}
            </button>

            {appliedCoupon?.discountPercent !== 100 && (
              <p className="text-center text-xs text-gray-400">
                Pagamento processado com segurança via{" "}
                <span className="font-medium text-gray-500">Asaas</span>
              </p>
            )}
            <div className="text-center
            justify-center items-center flex flex-row gap-2 text-xs font-body text-gray-400">
            <a href='/privacidade'>Politica de Privacidade</a>
            <a href='/ajuda'>Ajuda</a>
           
            </div>
          </div>

          {/* Right column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 border border-gray-200 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Resumo do pedido</h2>

              {/* Products list */}
              <ul className="divide-y divide-gray-100 mb-4">
                {cartItems.map((item, i) => (
                  <li key={i} className="flex gap-3 py-3">
                    {(item.mainImg || item.selectedVariantImage) && (
                      <img
                        src={item.selectedVariantImage || item.mainImg}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      {(item.selectedVariantColor || item.selectedSize) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.selectedVariantColor}
                          {item.selectedVariantColor && item.selectedSize && " / "}
                          {item.selectedSize}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              {/* Coupon */}
              <div className="pt-2 border-t border-gray-100 mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600 font-medium">✓ {appliedCoupon.code} ({appliedCoupon.discountPercent}% off)</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-gray-600">Remover</button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setCouponOpen(!couponOpen)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar cupom de desconto
                    </button>
                    {couponOpen && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Código do cupom"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!cpf || cpf.replace(/\D/g, "").length < 11) {
                              showToast("Preencha seus dados antes de aplicar o cupom.");
                              return;
                            }
                            const res = await fetch("/api/coupon", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ code: couponCode, cpfCnpj: cpf.replace(/\D/g, "") }),
                            });
                            const data = await res.json();
                            if (data.valid) {
                              setAppliedCoupon({ code: data.code, discountPercent: data.discountPercent });
                              setCouponOpen(false);
                            } else {
                              showToast(data.error ?? "Cupom inválido");
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Frete</span>
                  {selectedShipping ? (
                    <span>{formatCurrency(shippingPrice)}</span>
                  ) : (
                    <span className="text-gray-400">Calcular no endereço</span>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({appliedCoupon.discountPercent}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-right">
                    {paymentMethod === "CREDIT_CARD" && installmentCount > 1 ? (
                      <>{formatCurrency(calcTotalWithInterest(installmentCount))}<br /><span className="text-xs font-normal text-gray-500">{installmentCount}x de {formatCurrency(calcInstallmentAmount(installmentCount))}</span></>
                    ) : (
                      formatCurrency(total)
                    )}
                  </span>
                </div>
                {appliedCoupon?.discountPercent === 100 ? (
                  <p className="text-xs text-green-600 pt-1 font-medium">100% de desconto — pedido gratuito</p>
                ) : paymentMethod && (
                  <p className="text-xs text-gray-400 pt-1">
                    {paymentMethod === "CREDIT_CARD"
                      ? `Cartão de Crédito${installmentCount > 1 ? ` - ${installmentCount}x` : ""}`
                      : "PIX"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;