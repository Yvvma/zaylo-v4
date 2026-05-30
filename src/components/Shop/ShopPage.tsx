import React, { useState, useEffect, useMemo } from "react";
import texts from "../../texts.json";
import { motion, AnimatePresence } from "framer-motion";
import { products as allProducts, type Product } from "../../data/products";
import ProductCard from "./ProductCard";
import HighlightContainer from "./HighlightContainer";
import { X, SlidersHorizontal, ArrowUpDown } from "lucide-react";

type Props = {
  initialMainFilter?: "All" | "Acessórios" | "Tutores";
  hideFilters?: boolean;
};

const sortLabels: Record<string, string> = {

  "price-low":  "Menor Preço",
  "price-high": "Maior Preço",
  new:          "Mais Recente",

};

// ── color name → display info ────────────────────────────────────────────────
const COLOR_META: Record<string, { label: string; hex: string; gradient?: boolean }> = {
  "black":        { label: "Preto",         hex: "#111111" },
  "black lemon":  { label: "Preto / Limão", hex: "#111111", gradient: true },
  "black yellow": { label: "Preto / Amarelo",hex: "#111111", gradient: true },
  "rose":         { label: "Rosa",          hex: "#f08a9d" },
  "candy":        { label: "Candy",         hex: "#ff69b4" },
  "space gray":   { label: "Space Gray",    hex: "#6b7280" },
  "space rose":   { label: "Space Rose",    hex: "#d6a5c0" },
  "zaylo white":  { label: "Branco",        hex: "#e8e8e8" },
};

// ── size display order ────────────────────────────────────────────────────────
const SIZE_ORDER = ["Único", "XS", "S", "M", "L", "XL", "G", "GG"];

// ── derive filter options from real product data ──────────────────────────────
function useDerivedOptions(products: Product[]) {
  return useMemo(() => {
    // categories
    const catMap = new Map<string, number>();
    products.forEach((p) => catMap.set(p.category, (catMap.get(p.category) ?? 0) + 1));
    const categories = Array.from(catMap.entries()).map(([label, count]) => ({ label, count }));

    // sizes (ordered)
    const sizeSet = new Set<string>();
    products.forEach((p) => p.variants?.forEach((v) => v.sizes?.forEach((s) => sizeSet.add(s))));
    const sizes = SIZE_ORDER.filter((s) => sizeSet.has(s));

    // colors (unique keys)
    const colorSeen = new Set<string>();
    const colors: { key: string; label: string; hex: string; gradient?: boolean }[] = [];
    products.forEach((p) =>
      p.variants?.forEach((v) => {
        const key = v.color.trim().toLowerCase();
        if (!colorSeen.has(key)) {
          colorSeen.add(key);
          const meta = COLOR_META[key];
          colors.push({ key, label: meta?.label ?? v.color, hex: meta?.hex ?? "#ccc", gradient: meta?.gradient });
        }
      })
    );

    return { categories, sizes, colors };
  }, [products]);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ShopPage({ initialMainFilter = "All" }: Props) {
  const { categories, sizes, colors } = useDerivedOptions(allProducts);

  // ── sort / pagination
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedSort, setSelectedSort] = useState("recommended");

  // ── overlay open/close
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen,   setIsSortOpen]   = useState(false);

  // ── APPLIED filters (what actually filters the grid)
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedSizes,      setAppliedSizes]      = useState<string[]>([]);
  const [appliedColors,     setAppliedColors]     = useState<string[]>([]);

  // ── DRAFT filters (inside overlay, not committed yet)
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftSizes,      setDraftSizes]      = useState<string[]>([]);
  const [draftColors,     setDraftColors]     = useState<string[]>([]);

  const itemsPerPage = 9;

  // open filter: seed draft from applied
  const openFilter = () => {
    setDraftCategories([...appliedCategories]);
    setDraftSizes([...appliedSizes]);
    setDraftColors([...appliedColors]);
    setIsFilterOpen(true);
  };

  // commit draft → applied
  const applyFilters = () => {
    setAppliedCategories([...draftCategories]);
    setAppliedSizes([...draftSizes]);
    setAppliedColors([...draftColors]);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const clearDraft = () => {
    setDraftCategories([]);
    setDraftSizes([]);
    setDraftColors([]);
  };

  const toggle = (
    arr: string[],
    set: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  // ── filtered + sorted list
  const sorted = useMemo(() => {
    let list = [...allProducts];

    if (appliedCategories.length)
      list = list.filter((p) => appliedCategories.includes(p.category));

    if (appliedSizes.length)
      list = list.filter((p) =>
        p.variants?.some((v) => v.sizes?.some((s) => appliedSizes.includes(s)))
      );

    if (appliedColors.length)
      list = list.filter((p) =>
        p.variants?.some((v) => appliedColors.includes(v.color.trim().toLowerCase()))
      );

    return list.sort((a, b) => {
      switch (selectedSort) {
        case "price-low":  return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "new":        return b.id - a.id;
        default:           return 0;
      }
    });
  }, [appliedCategories, appliedSizes, appliedColors, selectedSort]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);
  useEffect(() => {
    document.body.style.overflow = isFilterOpen || isSortOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isFilterOpen, isSortOpen]);

  const filterCount = appliedCategories.length + appliedSizes.length + appliedColors.length;
  const draftCount  = draftCategories.length + draftSizes.length + draftColors.length;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <section className="w-full flex flex-col text-white bg-white justify-center items-center mt-16">

      {/* Top bar */}
      <div className="w-full flex justify-center items-center bg-[#131313]">
        <button className="w-full px-6 py-4 flex justify-center items-center gap-2 text-sm uppercase font-heading font-bold text-white">
          <img src="/logos/favicon-zaylo.png" className="max-w-4" />
          Produtos
        </button>
      </div>

      <HighlightContainer />

      <div className="w-full flex flex-col gap-8 text-black justify-center items-center">

        {/* ── FILTROS / ORDENAR BAR ── */}
        <div className="w-full  flex border-y border-gray-200 bg-white sticky top-0 z-30">

          <button
            onClick={openFilter}
            className="flex-1 flex items-center justify-center gap-2 py-[14px] border-r border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={14} strokeWidth={2} className="text-black" />
            <span className="text-[11px] font-heading font-bold uppercase tracking-[0.1em] text-black">
              Filtros
            </span>
            {filterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsSortOpen(true)}
            className="flex-1 flex  bg-[#EAE951] items-center justify-center gap-2 py-[14px] hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown size={14} strokeWidth={2} className="text-black" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-heading font-bold uppercase tracking-[0.1em] text-black">
                Ordenar
              </span>
              <span className="text-[10px] font-body font-light text-gray-800">
                {sortLabels[selectedSort]}
              </span>
            </div>
          </button>
        </div>
        {/* Descrição da Página*/}
        <div className="w-full flex justify-start items-start flex-col px-8 sm:px-48 gap-2">
          <div className="w-full flex justify-start items-center flex-row gap-2">
            <img src="/logos/favicon-zaylo.png" className="max-w-6 invert" />
            <h1 className="text-2xl font-heading font-medium tracking-tight
             text-black">Produtos ZAYLO</h1>
             </div>
            <p className="text-xs font-body text-gray-800 tracking-tight">
            Desenvolvemos acessórios super premium para cães inspirados em design, lifestyle e performance. 
          <br></br><br></br>Peitorais, guias e comedouros criados com materiais de alta qualidade, tecnologia e acabamento 
          sofisticado para proporcionar conforto, segurança e uma 
          experiência elevada em cada detalhe.
            </p>
        </div>

        {/* ── GRID ── */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-6 px-8 sm:px-48">
          
          {paginated.length > 0
            ? paginated.map((p) => <ProductCard key={p.id} product={p} />)
            : <p className="col-span-full text-center text-gray-500">"Nenhum produto encontrado."</p>
          }
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="w-full flex justify-center items-center gap-4 mt-8 font-heading font-thin uppercase text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-full border transition-all duration-300 ${
                  page === currentPage
                    ? "bg-black text-white border-black"
                    : "border-gray-300 text-black hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        <motion.hr
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.8, scaleX: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-[1px] w-full mx-auto bg-gray-400 border-0 my-8 origin-left"
        />
      </div>

      {/* ══════════════════════════════════════
          FILTER OVERLAY
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              key="fb"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-white/40 backdrop-blur-sm z-40 "
            />

            <motion.div
              key="fp"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:mx-64 bg-white z-50 rounded-t-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "88vh" }}
            >
              {/* header */}
              <div className="flex items-center justify-between px-5 py-[18px] border-b border-gray-100 flex-shrink-0">
                <span className="text-[11px] font-heading font-bold uppercase tracking-[0.1em] text-black">Filtros</span>
                <button onClick={() => setIsFilterOpen(false)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                  <X size={16} strokeWidth={1.5} className="text-black" />
                </button>
              </div>

              {/* body */}
              <div className="overflow-y-auto flex-1">

                {/* Categoria */}
                <div className="px-5 py-5 border-b border-gray-100">
                  <p className="text-[11px] font-heading font-bold uppercase tracking-[0.08em] text-black mb-3">Categoria</p>
                  {categories.map(({ label, count }) => {
                    const on = draftCategories.includes(label);
                    return (
                      <div key={label} onClick={() => toggle(draftCategories, setDraftCategories, label)}
                        className="flex items-center justify-between py-[10px] cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className={`w-[18px] h-[18px] border flex items-center justify-center flex-shrink-0 transition-colors ${on ? "bg-black border-black" : "border-gray-300 group-hover:border-gray-600"}`}>
                            {on && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-[13px] font-body font-light text-black">{label}</span>
                        </div>
                        <span className="text-[12px] font-body font-light text-gray-400">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Tamanho */}
                <div className="px-5 py-5 border-b border-gray-100">
                  <p className="text-[11px] font-heading font-bold uppercase tracking-[0.08em] text-black mb-4">Tamanho</p>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((size) => {
                      const on = draftSizes.includes(size);
                      return (
                        <button key={size} onClick={() => toggle(draftSizes, setDraftSizes, size)}
                          className={`px-4 py-2 border text-[12px] font-body transition-all ${on ? "bg-black text-white border-black" : "bg-white text-black border-gray-300 hover:border-black"}`}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cor */}
                <div className="px-5 py-5">
                  <p className="text-[11px] font-heading font-bold uppercase tracking-[0.08em] text-black mb-4">Cor</p>
                  <div className="flex gap-3 flex-wrap">
                    {colors.map(({ key, label, hex, gradient }) => {
                      const on = draftColors.includes(key);
                      return (
                        <button key={key} title={label}
                          onClick={() => toggle(draftColors, setDraftColors, key)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${on ? "border-black scale-110" : "border-transparent hover:scale-105"}`}
                          style={{
                            background: gradient ? "linear-gradient(to right, #111111 50%, #eab308 50%)" : hex,
                            outline: on ? "2px solid #131313" : "none",
                            outlineOffset: "2px",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                {draftCount > 0 && (
                  <button onClick={clearDraft}
                    className="flex-none px-5 py-[14px] border border-black text-[11px] font-heading font-bold uppercase tracking-[0.1em] text-black hover:bg-gray-50 transition-colors">
                    Limpar
                  </button>
                )}
                <button onClick={applyFilters}
                  className="flex-1 py-[14px] bg-black text-white text-[11px] font-heading font-bold uppercase tracking-[0.1em] hover:bg-gray-900 transition-colors">
                  Aplicar{draftCount > 0 ? ` (${draftCount})` : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          SORT OVERLAY
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {isSortOpen && (
          <>
            <motion.div
              key="sb"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSortOpen(false)}
              className="fixed inset-0 bg-white/40 backdrop-blur-sm z-40"
            />

            <motion.div
              key="sp"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white sm:mx-64 z-50 rounded-t-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-[18px] border-b border-gray-100">
                <span className="text-[11px] font-heading font-bold uppercase tracking-[0.1em] text-black">Ordenar</span>
                <button onClick={() => setIsSortOpen(false)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                  <X size={16} strokeWidth={1.5} className="text-black" />
                </button>
              </div>

              {Object.entries(sortLabels).map(([key, label]) => {
                const on = selectedSort === key;
                return (
                  <button key={key}
                    onClick={() => { setSelectedSort(key); setCurrentPage(1); setTimeout(() => setIsSortOpen(false), 150); }}
                    className={`w-full flex items-center justify-between px-5 py-[16px] border-b border-gray-50 transition-colors ${on ? "bg-gray-50" : "hover:bg-gray-50"}`}
                  >
                    <span className={`text-[13px] ${on ? "font-heading font-bold" : "font-body font-light"} text-black`}>{label}</span>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${on ? "border-black" : "border-gray-300"}`}>
                      {on && <div className="w-[9px] h-[9px] rounded-full bg-black" />}
                    </div>
                  </button>
                );
              })}

              <div className="px-5 py-4">
                <button onClick={() => setIsSortOpen(false)}
                  className="w-full py-[14px] bg-black text-white text-[11px] font-heading font-bold uppercase tracking-[0.1em] hover:bg-gray-900 transition-colors">
                  Aplicar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}