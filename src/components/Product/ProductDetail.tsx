import { motion, AnimatePresence } from 'framer-motion';
import texts from "../../texts.json";
import React, { useCallback, useState, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, Ruler, ZoomIn } from "lucide-react";
import { useCart } from "../Shop/CartContext";
import Accordion from "../UI/Accordion";
import { products } from "../../data/products";

function formatCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, "$1-$2");
}

const colorSwatchMap: Record<string, string> = {
  black: "#000000",
  rose: "#f08a9d",
  "black lemon": "#121212",
  candy: "#ff69b4",
  "space gray": "#6b7280",
  "space rose": "#d6a5c0",
  "zaylo white": "#004a6a",
  "black yellow": "#1f1f1f",
};

const getVariantColor = (color?: string) => {
  if (!color) return "#ccc";
  const normalized = color.trim().toLowerCase();
  if (colorSwatchMap[normalized]) return colorSwatchMap[normalized];
  if (/^[a-z]+$/.test(normalized)) return normalized;
  return "#ccc";
};

const getVariantStyle = (color?: string): React.CSSProperties => {
  if (!color) return { backgroundColor: "#ccc" };
  const normalized = color.trim().toLowerCase();
  if (normalized === "black lemon") {
    return { background: "linear-gradient(to right, #000000 50%, #ffff00 50%)" };
  }
  return { backgroundColor: getVariantColor(color) };
};

const SIZE_GUIDE = [
  { size: "PP", chest: "32-40 cm (13-16 in)", neck: "20-28 cm (8-11 in)" },
  { size: "P",  chest: "38-46 cm (15-18 in)", neck: "24-34 cm (9-14 in)" },
  { size: "M",  chest: "46-56 cm (18-22 in)", neck: "28-40 cm (11-16 in)" },
  { size: "G",  chest: "56-68 cm (22-27 in)", neck: "36-50 cm (14-20 in)" },
];

type MosaicRow =
  | { type: "duo"; images: [string, string] }
  | { type: "full"; image: string }
  | { type: "wide"; image: string }
  | { type: "offset"; tall: string; sq: string };

function buildMosaicRows(images: string[]): MosaicRow[] {
  const rows: MosaicRow[] = [];
  let i = 0;
  const patterns: Array<"duo" | "full" | "wide" | "offset"> = ["duo", "full", "duo", "wide", "offset"];
  let p = 0;
  while (i < images.length) {
    const pattern = patterns[p % patterns.length];
    if (pattern === "duo" && i + 1 < images.length) {
      rows.push({ type: "duo", images: [images[i], images[i + 1]] });
      i += 2;
    } else if (pattern === "full" && i < images.length) {
      rows.push({ type: "full", image: images[i] });
      i += 1;
    } else if (pattern === "wide" && i < images.length) {
      rows.push({ type: "wide", image: images[i] });
      i += 1;
    } else if (pattern === "offset" && i + 1 < images.length) {
      rows.push({ type: "offset", tall: images[i], sq: images[i + 1] });
      i += 2;
    } else {
      rows.push({ type: "full", image: images[i] });
      i += 1;
    }
    p++;
  }
  return rows;
}

const PRODUCT_SPECS: Record<string, { weight: number; dimensions: { width: number; height: number; length: number } }> = {
  "bungee-harness": { weight: 0.06, dimensions: { width: 21, height: 9, length: 2 } },
  "bungee-harness-p": { weight: 0.08, dimensions: { width: 21, height: 9, length: 2 } },
  "bungee-harness-m": { weight: 0.115, dimensions: { width: 21, height: 9, length: 2 } },
  "bungee-harness-g": { weight: 0.195, dimensions: { width: 21, height: 9, length: 2 } },
  "guia-leash": { weight: 0.165, dimensions: { width: 22, height: 16, length: 2 } },
  "double-leash": { weight: 0.28, dimensions: { width: 22, height: 16, length: 2 } },
  "guia-bungee": { weight: 0.24, dimensions: { width: 12, height: 22.5, length: 2 } },
  "guia-freedom": { weight: 0.305, dimensions: { width: 24, height: 16, length: 2 } },
  "ozy-vest-xs": { weight: 0.225, dimensions: { width: 20, height: 11, length: 3 } },
  "ozy-vest-s": { weight: 0.22, dimensions: { width: 21.5, height: 11, length: 3 } },
  "ozy-vest-m": { weight: 0.30, dimensions: { width: 25.5, height: 11, length: 3 } },
  "ozy-vest-l": { weight: 0.34, dimensions: { width: 28, height: 11, length: 3 } },
  "ozy-vest-xl": { weight: 0.35, dimensions: { width: 32, height: 11, length: 3 } },
};

function getProductSpec(slug: string) {
  if (PRODUCT_SPECS[slug]) return PRODUCT_SPECS[slug];
  for (const key of Object.keys(PRODUCT_SPECS)) {
    if (slug.includes(key)) return PRODUCT_SPECS[key];
  }
  return { weight: 0.3, dimensions: { width: 20, height: 15, length: 10 } };
}

// ─── Sequential Scroll Hook ──────────────────────────────────────────────────
/**
 * Implements "chained" scroll behaviour on desktop:
 *
 *   Scrolling DOWN:
 *     1. Scroll LEFT panel until its bottom
 *     2. Scroll RIGHT panel until its bottom
 *     3. Release page so user can reach the footer
 *
 *   Scrolling UP (from footer / after release):
 *     1. Scroll RIGHT panel back to top
 *     2. Scroll LEFT panel back to top
 *     3. Re-lock the page at the product section
 *
 * The outer page is locked (overflow: hidden on html/body) while inside the
 * product section so that wheel / touch events never escape to the page scroll
 * until both panels are exhausted.
 */
function useSequentialScroll(
  leftRef: React.RefObject<HTMLDivElement | null>,
  rightRef: React.RefObject<HTMLDivElement | null>,
  isDesktop: boolean
) {
  // Track whether we've "released" the page scroll (both panels at bottom)
  const releasedRef = useRef(false);

  useEffect(() => {
    if (!isDesktop) return;

    const html = document.documentElement;

    const lockPage = () => {
      html.style.overflow = "hidden";
    };

    const unlockPage = () => {
      html.style.overflow = "";
    };

    // Start locked
    lockPage();

    const isAtBottom = (el: HTMLDivElement) =>
      Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 2;

    const isAtTop = (el: HTMLDivElement) => el.scrollTop <= 0;

    const handleWheel = (e: WheelEvent) => {
      const left = leftRef.current;
      const right = rightRef.current;
      if (!left || !right) return;

      const dy = e.deltaY;

      // ── Scrolling DOWN ──────────────────────────────────────────────
      if (dy > 0) {
        // If page is already released, let it scroll naturally
        if (releasedRef.current) return;

        // Left panel not exhausted → feed it
        if (!isAtBottom(left)) {
          e.preventDefault();
          left.scrollTop += dy;
          return;
        }

        // Left exhausted, right not exhausted → feed right
        if (!isAtBottom(right)) {
          e.preventDefault();
          right.scrollTop += dy;
          return;
        }

        // Both exhausted → release page
        releasedRef.current = true;
        unlockPage();
        // Let the event propagate so the page scrolls this tick
      }

      // ── Scrolling UP ────────────────────────────────────────────────
      if (dy < 0) {
        // If page hasn't scrolled back to top yet, let it scroll naturally
        if (releasedRef.current && window.scrollY > 0) return;

        // Page is at top but was released → re-lock and start scrolling panels up
        if (releasedRef.current && window.scrollY <= 0) {
          releasedRef.current = false;
          lockPage();
        }

        // Right panel not at top → feed it first (reverse order)
        if (!isAtTop(right)) {
          e.preventDefault();
          right.scrollTop += dy; // dy is negative
          return;
        }

        // Right at top, left not at top → feed left
        if (!isAtTop(left)) {
          e.preventDefault();
          left.scrollTop += dy;
          return;
        }

        // Both at top → nothing to do, stay locked at top of page
        e.preventDefault();
      }
    };

    // Touch support
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const left = leftRef.current;
      const right = rightRef.current;
      if (!left || !right) return;

      const dy = touchStartY - e.touches[0].clientY; // positive = scroll down
      touchStartY = e.touches[0].clientY;

      if (dy > 0) {
        if (releasedRef.current) return;
        if (!isAtBottom(left)) { e.preventDefault(); left.scrollTop += dy; return; }
        if (!isAtBottom(right)) { e.preventDefault(); right.scrollTop += dy; return; }
        releasedRef.current = true;
        unlockPage();
      }

      if (dy < 0) {
        if (releasedRef.current && window.scrollY > 0) return;
        if (releasedRef.current && window.scrollY <= 0) {
          releasedRef.current = false;
          lockPage();
        }
        if (!isAtTop(right)) { e.preventDefault(); right.scrollTop += dy; return; }
        if (!isAtTop(left)) { e.preventDefault(); left.scrollTop += dy; return; }
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      unlockPage(); // always restore on unmount
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDesktop, leftRef, rightRef]);
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── InfoPanelContent (top-level component to prevent remount on parent re-render) ───
interface InfoPanelProps {
  product: any;
  selectedVariant: any;
  setSelectedVariant: (v: any) => void;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  selectedSize: string | null;
  setSelectedSize: (s: string | null) => void;
  setShowMedidas: (v: boolean) => void;
  adding: boolean;
  added: boolean;
  handleAddToCart: () => void;
  cep: string;
  setCep: (v: string) => void;
  shippingResult: any[];
  shippingLoading: boolean;
  calculateShipping: () => void;
  relatedProducts: any[];
  uniqueColors: any[];
  emblaApi: any;
  setSelectedIndex: (i: number) => void;
}

function InfoPanelContent({
  product,
  selectedVariant,
  setSelectedVariant,
  quantity,
  setQuantity,
  selectedSize,
  setSelectedSize,
  setShowMedidas,
  adding,
  added,
  handleAddToCart,
  cep,
  setCep,
  shippingResult,
  shippingLoading,
  calculateShipping,
  relatedProducts,
  uniqueColors,
  emblaApi,
  setSelectedIndex,
}: InfoPanelProps) {
  const sizes = ["PP", "P", "M", "G"];

  return (
    <>
      <nav className="flex items-center gap-1.5 text-[10px] text-black font-body font-light uppercase tracking-widest mb-5">
        <a href="/" className="text-black">Início</a>
        <span className="text-gray-300">|</span>
        <a href="/produtos" className="text-black">Produtos</a>
        <span className="text-gray-300">|</span>
        <a href={`/produtos?categoria=${encodeURIComponent(product.category)}`} className="text-black font-heading font-medium">
          {product.category}
        </a>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-black leading-tight">{product.title}</h1>
          <span className="font-body font-light text-black text-sm">{selectedVariant?.color}</span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <p className="text-sm tracking-tighter font-body text-black border border-black/50 rounded-sm px-2 bg-black/5">
            R$ {product.price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">até 3x de R$ {(product.price / 3).toFixed(2)} sem juros</p>
        </div>
      </div>

      <div className="h-px bg-gray-100 my-5" />

      {uniqueColors.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-widest font-body font-light text-gray-500 mb-2">Cor</p>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map((variant: any) => (
              <button
                key={variant.color}
                onClick={() => { setSelectedVariant(variant); setQuantity(1); setSelectedIndex(0); emblaApi?.scrollTo(0); }}
                className={`w-10 h-10 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                  selectedVariant?.color === variant.color ? "ring-2 ring-[#02BED0]" : "border-gray-200 hover:border-gray-400"
                }`}
                title={variant.color}
                aria-label={`Cor ${variant.color}`}
              >
                <div className="w-6 h-6 rounded-full" style={getVariantStyle(variant.color)} />
              </button>
            ))}
          </div>
        </div>
      )}

      {product.category !== "Bowl" && product.category !== "Coleira" && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest font-body font-light text-gray-500">Tamanhos</p>
            <button onClick={() => setShowMedidas(true)} className="flex items-center gap-1 text-xs underline text-gray-500 hover:text-black transition-colors cursor-pointer">
              <Ruler size={13} /> Medidas
            </button>
          </div>
          <div className="flex gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-8 h-8 rounded-md border-2 text-xs font-body font-light transition-all duration-200 cursor-pointer ${
                  selectedSize === size ? "border-black bg-black/60 text-white" : "border-gray-200 text-black hover:border-gray-500"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <span className="text-sm tracking-tight font-body font-light text-black">{"Quantidade"}:</span>
        <div className="flex items-center">
          <button onClick={() => setQuantity((p) => Math.max(1, p - 1))} className="w-9 h-9 flex items-center justify-center text-black hover:bg-gray-100 transition-colors cursor-pointer text-lg border border-gray-200 rounded-l-md">−</button>
          <span className="w-9 text-center font-body text-black text-sm select-none border-y border-gray-200 h-9 flex items-center justify-center">{quantity}</span>
          <button onClick={() => setQuantity((p) => p + 1)} className="w-9 h-9 flex items-center justify-center text-black hover:bg-gray-100 transition-colors cursor-pointer text-lg border border-gray-200 rounded-r-md">+</button>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart} disabled={adding || added} className={`w-full text-white font-body font-light uppercase tracking-tight py-3 rounded-sm text-sm transition-colors cursor-pointer mb-5 ${adding ? "bg-gray-400" : added ? "bg-green-500" : "bg-[#02BED0] hover:bg-gray-900"}`}>
        {adding ? "Adicionando..." : added ? "Adicionado!" : "Adicionar ao Carrinho"}
      </motion.button>

      <div className="bg-[#f5f5f5] rounded-xl px-5 py-4 mb-5">
        <p className="text-[10px] uppercase tracking-widest font-body text-gray-500 mb-3">Calcule o frete e Prazo</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="00000-000"
            maxLength={9}
            value={cep}
            onChange={(e) => setCep(formatCEP(e.target.value))}
            className="flex-1 border rounded-full border-gray-400 font-body px-3 py-2 text-sm outline-none focus:border-gray-600 placeholder:text-gray-400"
          />
          <button
            onClick={calculateShipping}
            disabled={shippingLoading || cep.replace(/\D/g, "").length < 8}
            className="px-5 py-2 bg-[#131819] text-white text-sm font-heading font-bold uppercase rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {shippingLoading ? "..." : "Calcular"}
          </button>
        </div>
        {shippingResult.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {shippingResult
              .filter((o: any) => o.company?.name === "Correios" && o.custom_price && parseFloat(o.custom_price) > 0)
              .map((option: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <span className="text-xs font-body text-gray-600">{option.company?.name}</span>
                  <span className="text-xs font-heading font-bold text-black">{option.custom_price ? `R$ ${parseFloat(option.custom_price).toFixed(2)}` : "-"}</span>
                  <span className="text-xs font-body text-gray-500">{option.delivery_range?.min ? `${option.delivery_range.min}-${option.delivery_range.max} dias` : "-"}</span>
                </div>
              ))}
          </div>
        )}
        <a target="_blank" rel="noopener noreferrer" href="https://buscacepinter.correios.com.br/app/endereco/index.php" className="inline-block mt-3 px-4 py-1 bg-[#131819] text-white text-xs font-heading font-medium tracking-tight uppercase rounded-full hover:bg-gray-700 transition-colors">
          Não sei meu CEP
        </a>
      </div>

      <div className="border-t border-gray-100">
        <Accordion items={[
          { id: "description", title: "Descrição", content: product.description || "Descrição não disponível" },
          { id: "technical-sheet", title: "Ficha Técnica", content: product.technicalSheet || "Ficha técnica não disponível" },
        ]} />
      </div>

      <div className="flex flex-col items-center gap-3 py-6 bg-[#f5f5f5] rounded-xl mt-4">
        <h2 className="text-base font-heading font-bold text-black">Precisa de ajuda?</h2>
        <a href="mailto:contato@zaylo.com.br" className="flex flex-row justify-center items-center gap-2 border-black px-3 py-1.5 border rounded-full text-sm font-heading font-medium text-black/80">
          <img src="/logos/favicon-zaylo.png" className="w-5 invert" alt="" /> Fale conosco
        </a>
      </div>

      {relatedProducts.length > 0 && (
        <div className="md:hidden bg-[#f5f5f5] rounded-3xl p-5 mt-6 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {relatedProducts.map((related: any) => (
              <a key={related.id} href={`/produtos/${related.slug}`} className="group block">
                <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-50 flex items-center justify-center">
                    <img src={related.variants?.[0]?.images?.[0] || "/path/to/fallback.jpg"} alt={related.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-body text-black text-xs mb-1 line-clamp-2">{related.title}</h3>
                  <p className="font-body font-light text-black text-xs">R$ {related.price.toFixed(2)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetail({ product }: any) {
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showMedidas, setShowMedidas] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cep, setCep] = useState("");
  const [shippingResult, setShippingResult] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Refs for the two scrollable panels
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Detect desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Activate the sequential scroll logic only on desktop
  useSequentialScroll(leftPanelRef, rightPanelRef, isDesktop);

  const handleAddToCart = () => {
    const needsSize = selectedVariant?.sizes?.length > 0 && selectedVariant.sizes[0] !== "Único";
    if (needsSize && !selectedSize) {
      alert("Selecione um tamanho antes de adicionar ao carrinho.");
      return;
    }
    setAdding(true);
    setTimeout(() => {
      const sizeToAdd = selectedSize || (selectedVariant?.sizes?.[0] === "Único" ? "Único" : "M");
      addToCart(product, selectedVariant, quantity, sizeToAdd);
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 300);
  };

  const calculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setShippingLoading(true);
    try {
      const spec = getProductSpec(product.slug);
      const res = await fetch("/api/melhor-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "calculateShipment",
          from: { postal_code: "13574020" },
          to: { postal_code: cleanCep },
          products: [{
            id: product.slug,
            width: spec.dimensions.width,
            height: spec.dimensions.height,
            length: spec.dimensions.length,
            weight: spec.weight,
            insurance_value: product.price,
            quantity,
          }],
        }),
      });
      const data = await res.json();
      setShippingResult(data || []);
    } catch (e) {
      console.error("Shipping error");
    } finally {
      setShippingLoading(false);
    }
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const images: string[] = selectedVariant ? selectedVariant.images : [];

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
    }
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  const uniqueColors = product.variants?.filter(
    (v: any, i: number, arr: any[]) =>
      v.color && arr.findIndex((x: any) => x.color === v.color) === i
  ) || [];

  const sizes = ["PP", "P", "M", "G"];
  const relatedProducts = products.filter((p) => p.slug !== product.slug).slice(0, 3);
  const mosaicRows = buildMosaicRows(images);

  return (
    <div className="w-full bg-white text-black">
      {/* Medidas Modal */}
      <AnimatePresence>
        {showMedidas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            onClick={() => setShowMedidas(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 relative max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Ruler size={18} className="text-black" />
                  <span className="font-semibold text-black text-base tracking-wide">Medidas</span>
                </div>
                <button onClick={() => setShowMedidas(false)} className="text-gray-500 hover:text-black transition-colors" aria-label="Fechar">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs text-left text-black">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-center">
                      <th className="px-3 py-3 font-semibold text-gray-700">Tamanho</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Escala do Peitoral</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Escala da Nuca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((row) => (
                      <tr key={row.size} className={`text-center border-b border-gray-100 last:border-0 ${
                        selectedSize === row.size ? "bg-[#eae951]/20" : "bg-white"
                      }`}>
                        <td className="px-3 py-3 font-bold text-black">{row.size}</td>
                        <td className="px-3 py-3 text-gray-700">{row.chest}</td>
                        <td className="px-3 py-3 text-gray-700">{row.neck}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Layout */}
      <section className="md:hidden w-full flex flex-col py-6 text-black bg-white">
        <div className="relative group w-full mb-6">
          <div className="embla overflow-hidden bg-[#efefef]" ref={emblaRef}>
            <div className="embla__container flex select-none aspect-[3/4]">
              {images.map((src: string, i: number) => (
                <div className="embla__slide flex-shrink-0 w-full h-full flex justify-center items-center" key={i}>
                  <img src={src} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <button onClick={scrollPrev} className="absolute bottom-4 left-3 z-40 text-black cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <button onClick={scrollNext} className="absolute bottom-4 right-3 z-40 text-black cursor-pointer">
              <ChevronRight size={18} />
            </button>
            <div className="flex justify-center gap-1.5 absolute bottom-5 w-full">
              {images.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    selectedIndex === i ? "w-4 h-1.5 bg-black" : "w-1.5 h-1.5 bg-gray-300"
                  }`}
                  aria-label={`Ir para imagem ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-4">
          <div className="bg-white rounded-b-xl drop-shadow-xl p-6">
            <InfoPanelContent
              product={product} selectedVariant={selectedVariant} setSelectedVariant={setSelectedVariant}
              quantity={quantity} setQuantity={setQuantity} selectedSize={selectedSize} setSelectedSize={setSelectedSize}
              setShowMedidas={setShowMedidas} adding={adding} added={added} handleAddToCart={handleAddToCart}
              cep={cep} setCep={setCep} shippingResult={shippingResult} shippingLoading={shippingLoading}
              calculateShipping={calculateShipping} relatedProducts={relatedProducts} uniqueColors={uniqueColors}
              emblaApi={emblaApi} setSelectedIndex={setSelectedIndex}
            />
          </div>
        </div>
      </section>

      {/* ── Desktop Layout ─────────────────────────────────────────────────── */}
      {/*
        Both panels are h-screen + overflow-y-auto so they have independent
        scroll containers. The page itself is locked by useSequentialScroll
        via overflow:hidden on <html>. When both panels reach the bottom the
        lock is released and the page scrolls to the footer naturally.
      */}
      <div className="hidden md:flex w-full h-screen text-black bg-white">
        {/* Left – info panel (scrollable, locked by hook) */}
        <aside
          ref={leftPanelRef}
          className="w-[380px] min-w-[480px] border-r border-gray-100 px-8 py-10 h-screen overflow-y-auto scrollbar-hide"
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          <InfoPanelContent
            product={product} selectedVariant={selectedVariant} setSelectedVariant={setSelectedVariant}
            quantity={quantity} setQuantity={setQuantity} selectedSize={selectedSize} setSelectedSize={setSelectedSize}
            setShowMedidas={setShowMedidas} adding={adding} added={added} handleAddToCart={handleAddToCart}
            cep={cep} setCep={setCep} shippingResult={shippingResult} shippingLoading={shippingLoading}
            calculateShipping={calculateShipping} relatedProducts={relatedProducts} uniqueColors={uniqueColors}
            emblaApi={emblaApi} setSelectedIndex={setSelectedIndex}
          />
        </aside>

        {/* Right – photo mosaic (scrollable, locked by hook) */}
        <div
          ref={rightPanelRef}
          className="flex-1 h-screen overflow-y-auto px-6 py-8 scrollbar-hide"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {mosaicRows.map((row, rowIdx) => {
              if (row.type === "duo") {
                return (
                  <React.Fragment key={rowIdx}>
                    {row.images.map((src, ci) => (
                      <div key={ci} className="overflow-hidden rounded-md bg-[#efefef] aspect-[3/4] group cursor-pointer" onClick={() => setLightboxImage(src)}>
                        <img src={src} alt={`${product.title} ${rowIdx}-${ci}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      </div>
                    ))}
                  </React.Fragment>
                );
              }
              if (row.type === "full") {
                return (
                  <div key={rowIdx} className="col-span-2 overflow-hidden rounded-md bg-[#efefef] aspect-video group cursor-pointer" onClick={() => setLightboxImage(row.image)}>
                    <img src={row.image} alt={`${product.title} ${rowIdx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  </div>
                );
              }
              if (row.type === "wide") {
                return (
                  <div key={rowIdx} className="col-span-2 overflow-hidden rounded-md bg-[#efefef] group cursor-pointer" style={{ aspectRatio: "21/9" }} onClick={() => setLightboxImage(row.image)}>
                    <img src={row.image} alt={`${product.title} ${rowIdx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  </div>
                );
              }
              if (row.type === "offset") {
                return (
                  <React.Fragment key={rowIdx}>
                    <div className="overflow-hidden rounded-md bg-[#efefef] aspect-[3/4] group cursor-pointer" onClick={() => setLightboxImage(row.tall)}>
                      <img src={row.tall} alt={`${product.title} ${rowIdx}-tall`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="overflow-hidden rounded-md bg-[#efefef] aspect-square group self-start cursor-pointer" onClick={() => setLightboxImage(row.sq)}>
                      <img src={row.sq} alt={`${product.title} ${rowIdx}-sq`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                  </React.Fragment>
                );
              }
              return null;
            })}
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-10 bg-[#f5f5f5] rounded-3xl p-6 border border-gray-200">
              <h2 className="text-sm font-heading font-bold text-black mb-4 uppercase tracking-widest">Você também pode gostar</h2>
              <div className="grid grid-cols-3 gap-4">
                {relatedProducts.map((related: any) => (
                  <a key={related.id} href={`/produtos/${related.slug}`} className="group block">
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-gray-50 flex items-center justify-center">
                        <img src={related.variants?.[0]?.images?.[0] || "/path/to/fallback.jpg"} alt={related.title} className="w-full h-full object-contain" />
                      </div>
                      <h3 className="font-body text-black text-sm mb-1 line-clamp-2">{related.title}</h3>
                      <p className="font-body font-light text-black text-xs">R$ {related.price.toFixed(2)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X size={28} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage}
              alt="Product full view"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}