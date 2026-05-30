import React, { useEffect, useCallback, useState, useRef } from "react";
import texts from "../../texts.json";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react";
import { useScroll, useSpring } from "framer-motion";
import { useCart } from "../Shop/CartContext";


const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      staggerChildren: 0.1,
      ease: "easeOut",
      duration: 0.3,
    },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const titleVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } };
const priceVariants = { hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } };

function ProductCard({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [showQuickShop, setShowQuickShop] = useState(false);
  const images = selectedVariant?.images || [];
  const hasMultipleImages = images.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    return (
    <>
      <motion.div
    
        className="flex flex-col transition-all duration-300"
      >
        <a href={`/produtos/${product.slug}`} className="block">
          <div className="flex-shrink-0 relative">
            {hasMultipleImages ? (
              <div className="relative group">
                <div
                  className="embla overflow-hidden"
                  ref={emblaRef}
                  style={{
                    backgroundImage: "url('/background/background.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="embla__container flex select-none">
                    {images.map((src: string, i: number) => (
                      <div
                        className="embla__slide flex-shrink-0 w-full h-64 flex justify-center items-center"
                        key={i}
                      >
                        <img
                          src={src}
                          alt={`${product.title} image ${i + 1}`}
                          className="w-full h-64 object-contain z-10"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={scrollPrev}
                  className="absolute top-1/2 -translate-y-1/2 left-2  bg-opacity-50 rounded-full p-1 z-20 hidden "
                  aria-label="Previous image"
                >
                  <ChevronLeft className="text-[#131819]" size={24} />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute top-1/2 -translate-y-1/2 right-2 bg-opacity-50 rounded-full p-1 z-20 hidden group-hover:block"
                  aria-label="Next image"
                >
                  <ChevronRight className="text-[#131819]" size={24} />
                </button>

                {/* Quick Shop Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickShop(true);
                  }}
                  className="absolute bottom-4 left-4 w-11 h-11 rounded-full flex items-center justify-center shadow-xl hover:bg-gray-50 transition-all z-30"
                >
                  <ShoppingCart className="w-5 h-5 text-[#131819]" strokeWidth={1.5} />
                </motion.button>
              </div>
            ) : (
              <div
                className="shadow-xl rounded-t-xl w-full h-60  flex justify-center items-center relative"
                style={{
                  backgroundImage: "url('/background/background.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <img
                  src={images[0] || "/path/to/fallback.jpg"}
                  alt={product.title}
                  className="w-full h-60   object-contain z-10"
                />
                
                {/* Quick Shop Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickShop(true);
                  }}
                  className="absolute bottom-4 left-4 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-50 transition-all z-30"
                >
                  <ShoppingCart className="w-5 h-5 text-black" strokeWidth={1.5} />
                </motion.button>
              </div>
            )}
          </div>
        </a>

        <motion.div
          className="flex-1 flex flex-col justify-end items-start py-4 px-2 gap-2"
          variants={containerVariants}
        >
          <div className="flex flex-col items-start gap-2">
            <div className="flex gap-1 flex-col justify-start items-start">
              <motion.h2
                variants={titleVariants}
                className="font-blog text-black text-md text-center"
              >
                {product.title}
              </motion.h2>

              <motion.h4
                variants={titleVariants}
                className="font-blog font-light text-black text-xs tracking-widest uppercase text-center"
              >
                Zaylo
              </motion.h4>
            </div>

            <div className="flex gap-2 mt-1">
              {product.variants?.map((variant: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedVariant(variant)}
                  className={`w-6 h-6 rounded-full border-2 border-gray-200 focus:outline-none ${
                    selectedVariant?.color === variant.color ? "ring-2 ring-[#02BED0]" : ""
                  }`}
                  style={{ backgroundColor: variant.color.toLowerCase() }}
                  title={variant.color}
                />
              ))}
            </div>

            <motion.p
              variants={priceVariants}
              className="font-blog font-light uppercase text-black hover:text-gray-400 text-xs whitespace-nowrap mt-1"
            >
              R$ {product.price.toFixed(2)}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Shop Modal */}
      <QuickShopModal 
        product={product}
        selectedVariant={selectedVariant}
        setSelectedVariant={setSelectedVariant}
        isOpen={showQuickShop}
        onClose={() => setShowQuickShop(false)}
      />
    </>
  );
}

function QuickShopModal({ product, selectedVariant, setSelectedVariant, isOpen, onClose }: any) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress, scrollYProgress } = useScroll({ container: scrollRef });
  const scaleX = useSpring(scrollXProgress, { stiffness: 100, damping: 30 });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const images = selectedVariant?.images || [];


  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        setCanScrollTop(scrollTop > 0);
        setCanScrollBottom(scrollTop < scrollHeight - clientHeight - 10);
      }
    };
    checkScroll();
    scrollRef.current?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      scrollRef.current?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const handleAddToCart = () => {
    const needsSize = selectedVariant?.sizes?.length > 0;
    if (needsSize && !selectedSize) {
      alert("Selecione um tamanho antes de adicionar ao carrinho.");
      return;
    }
    setAdding(true);
    setTimeout(() => {
      addToCart(product, selectedVariant, quantity, selectedSize || undefined);
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 300);
  };

  const needsSize = selectedVariant?.sizes?.length > 0;
  const cannotAdd = needsSize && !selectedSize;

  const scroll = (direction: "left" | "right" | "up" | "down") => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    if (direction === "left") scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    if (direction === "right") scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    if (direction === "up") scrollRef.current.scrollBy({ top: -scrollAmount, behavior: "smooth" });
    if (direction === "down") scrollRef.current.scrollBy({ top: scrollAmount, behavior: "smooth" });
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/20 backdrop-blur-sm z-50 "
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col pt-8"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors "
            >
              <X className="w-6 h-6 text-black" strokeWidth={1.5} />
            </button>

            {/* Product Info on Top */}
            <div className="p-4 flex-shrink-0 space-y-1">
              <h2 className="text-xl font-light text-black tracking-tight leading-tight">{product.title}</h2>
              <p className="text-sm text-gray-600">Zaylo</p>
              <p className="text-md font-normal text-black">R$ {product.price.toFixed(2)}</p>
            </div>

            {/* Images */}
           <div
            ref={scrollRef}
            className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto max-h-80 gap-1 flex-1 scroll-smooth hide-scrollbar "
            style={{ backgroundImage: 'url("/background/background.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
              {images.map((img: string, i: number) => (
                <motion.img
                  key={i}
                  src={img}
                  alt={`${product.title} ${i + 1}`}
                  className="flex-shrink-0 w-64 sm:w-full   border border-white/20 shadow-md object-contain"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                />
              ))}
            </div>

            {/* Scroll Progress / Arrows */}
            <div className="absolute bottom-2 sm:right-2 left-2 sm:top-2 flex sm:flex-col items-center justify-between gap-2">
            

              <div className="relative w-full sm:w-1 sm:h-32 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  style={window.innerWidth < 640 ? { scaleX } : { scaleY }}
                  className="h-full w-full bg-black origin-left sm:origin-top rounded-full"
                />
              </div>

           
            </div>

  {/* Color Selection */}
  
            <div className="flex flex-col gap-2 p-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center  gap-1">
                    <span className="text-xs font-blog font-medium text-black uppercase tracking-wider">{"Cor"}:</span>
                    <span className="text-xs font-blog font-light tracking-wide  text-gray-600">{selectedVariant?.color}</span>
                  </div>
                 <div className="flex gap-3">
              {product.variants?.map((variant: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedVariant(variant)}
                  className={`w-16 h-16 border-2 rounded-md overflow-hidden transition-all ${
                    selectedVariant?.color === variant.color
                      ? "border-black ring-2 ring-offset-2 ring-[#02BED0]"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  title={variant.color}
                >
                  <img
                    src={variant.images?.[0] || "/path/to/fallback.jpg"}
                    alt={variant.color}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

                   <button 
                         onClick={() => setShowSizeChart(true)}
                   className="flex items-center gap-2 text-xs font-blog text-black underline underline-offset-2">
    
                  <span>{"Tabela de Medidas"}</span>
                </button>

  

                </div>  
                
                

                {/* Size Selection */}
                {selectedVariant?.sizes && selectedVariant.sizes.length > 0 && (
                  <div className=" flex flex-col  justify-center items-center w-full gap-4">
                    <label className="block text-xs font-blog font-medium text-black uppercase tracking-wider">
                      {"Tamanho"}
                    </label>
                    <div className="  flex flex-row justify-center items-center w-full gap-2">
                      {selectedVariant.sizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 px-4 border text-sm font-blog font-light transition-all ${
                            selectedSize === size
                              ? "bg-black text-white border-black"
                              : "bg-white text-black border-gray-300 hover:border-black"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

             

                {/* Action Buttons */}
                <div className="flex gap-1 pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding || added || cannotAdd}
                    className={`flex-1 py-2 text-white text-sm font-blog font-light uppercase tracking-wider transition-colors ${
                      adding ? 'bg-gray-400' : added ? 'bg-green-500' : cannotAdd ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#131819] hover:bg-gray-800'
                    }`}>
                    {adding ? 'Adicionando...' : added ? 'Adicionado!' : "Adicionar ao Carrinho"}
                  </button>
                </div>

                <div className="h-px bg-gray-200" />


                
                <button className="w-full text-center text-sm font-blog font-light text-black uppercase tracking-wider hover:text-gray-600 transition-colors py-2 underline underline-offset-4">
                  {"Mais Detalhes"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

                    {/* AnimatePresence da tabela de medidas */}
    {/* AnimatePresence da tabela de medidas */}
<AnimatePresence>
  {showSizeChart && (
    <>
      {/* Backdrop */}
      <motion.div
        key="size-chart-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSizeChart(false)}
        className="fixed inset-0 bg-black z-50"
      />

      {/* Modal da Tabela */}
      <motion.div
        key="size-chart-modal"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-50 flex justify-center items-center p-4"
      >
        <div className="relative bg-white rounded-lg p-6 w-full max-w-2xl mx-auto shadow-lg">
          
          {/* Botão de fechar */}
          <button
            onClick={() => setShowSizeChart(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            ✕
          </button>

          <h3 className="text-xl font-blog font-light uppercase tracking-wide text-center mb-4">
            {"Tabela de Medidas"}
          </h3>

          {/* Conteúdo da Tabela de Medidas */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 font-blog font-medium">{"Tamanho"}</th>
                  <th className="border border-gray-300 px-4 py-2 font-blog font-medium">{"Peitoral"}</th>
                  <th className="border border-gray-300 px-4 py-2 font-blog font-medium">{"Nuca"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog font-bold">XS</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">38-46cm (15-18in)</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">24-34cm (9-14in)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog font-bold">S</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">46-56cm (18-22in)</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">28-40cm (11-16in)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog font-bold">M</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">56-68cm (22-27in)</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">36-50cm (14-20in)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog font-bold">L</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">68-82cm (27-32in)</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">44-58cm (17-23in)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog font-bold">XL</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">82-106cm (32-41in)</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-blog text-xs">52-66cm (20-26in)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex flex-col gap-2 justify-end items-center mt-4">
            <p className="text-xs text-gray-600 font-blog font-light">{"Certifique-se de que o peitoral está devidamente ajustado para o tamanho do seu cachorro. Isso garantirá um encaixe seguro, evitando que ele se machuque."}</p>
            <img src="/logos/favicon-zaylo.png" className="max-w-8 invert" />
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

</>
  );
}


export default ProductCard;