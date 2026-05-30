import { motion, useScroll, useSpring } from "framer-motion";
import { tx } from "../../text";
import texts from "../../texts.json";
import { useEffect, useRef, useState } from "react";

type MediaItem = {
  src: string;
  type: "image" | "video";
  title?: string;
  imgTitle?: string;
  release?: string;
  link?: string;
};

const RevendedorContainer = () => {
  const mediaItems: MediaItem[] = [
    {
      src: "/videos/fabio-zaylo-cobasi.mp4",
      type: "video",
      imgTitle: "/logos/cobasi-zaylo.png",
      release: "empresas.cobasi",
      link: "https://www.instagram.com/reel/DFvT582Pt0z/?hl=en",
    },
    {
      src: "/photos/zaylo-17.webp",
      type: "image",
      title: "empresas.produtos",
      release: "empresas.produtos-release",
      link: "/produtos",
    },
  
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const hasResetForMobile = useRef(false);

  useEffect(() => {
    if (isMobile && !hasResetForMobile.current) {
      setActiveIndex(0);
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0;
      }
      hasResetForMobile.current = true;
    } else if (!isMobile) {
      hasResetForMobile.current = false;
    }
  }, [isMobile]);

  // Usar ref customizado para scroll ao invés de useScroll do framer
  const [scrollProgress, setScrollProgress] = useState(0);
  const scaleX = useSpring(scrollProgress, { stiffness: 100, damping: 30 });
  const [hoveredRelease, setHoveredRelease] = useState<string | null>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const el = scrollRef.current;
    const scrollPercentage = el.scrollLeft / (el.scrollWidth - el.offsetWidth);
    setScrollProgress(Math.max(0, Math.min(1, scrollPercentage)));

    // Atualizar índice ativo
    const children = Array.from(el.children);
    const containerCenter = el.scrollLeft + el.offsetWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    children.forEach((child, index) => {
      const child_el = child as HTMLElement;
      const elCenter = child_el.offsetLeft + child_el.offsetWidth / 2;
      const distance = Math.abs(containerCenter - elCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  return (
    <section
      id="revendedor"
      className="w-full flex flex-col justify-center items-center gap-6 bg-white"
    >
      <div className="relative flex flex-col bg-[#131819]/90 backdrop-blur-lg p-8 gap-2 justify-between items-center w-full">
        <img
          src="/photos/zaylo-05.webp"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover -z-10 blur-xs"
        />

        <div className="flex flex-col sm:flex-row w-full justify-center items-center pt-16 sm:pt-16">
          {/* TEXTO */}
          <div className="max-w-full text-start p-8 sm:p-24 w-full">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xl md:text-2xl font-body font-light text-white uppercase tracking-wide"
            >
              {"Seja um revendedor Zaylo"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-left text-white text-sm md:text-md max-w-2xl font-body"
            >
              {"Seja parceiro Zaylo e tenha acesso a lançamentos exclusivos, design avançado e tecnologia de ponta."}
            </motion.p>
          </div>

          {/* CARROSSEL */}
          <div className="relative flex flex-col gap-4 max-w-4xl w-full px-4">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-6 pb-4 overflow-x-auto overflow-y-hidden touch-pan-x snap-x snap-mandatory hide-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollBehavior: isMobile ? "auto" : "smooth",
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
              }}
            >
              {mediaItems.map((item, i) => {
                const isHighlighted = activeIndex === i;

                return (
                  <motion.div
                    key={i}
                    className="relative flex-shrink-0 cursor-pointer group snap-start"
                    style={{
                      width: isMobile ? "13rem" : "24rem",
                    }}
                    onMouseEnter={() => {
                      if (!isMobile) {
                        setActiveIndex(i);
                        setHoveredRelease(item.release || null);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredRelease(null);
                    }}
                  >
                    {/* MEDIA */}
                    {item.type === "image" ? (
                      <img
                        src={item.src}
                        alt=""
                        className="w-full h-full object-cover aspect-[3/4]"
                        draggable="false"
                      />
                    ) : (
                      <video
                        src={item.src}
                        className="w-full h-full object-cover aspect-[3/4]"
                        muted
                        loop
                        autoPlay
                        playsInline
                        draggable="false"
                      />
                    )}

                    {/* GRADIENT BASE */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                    {/* CONTENT */}
                    <motion.div
                      animate={{
                        y: !isMobile && isHighlighted ? -20 : 0,
                      }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-end p-4"
                    >
                      <div className="flex w-full flex-col justify-center items-center gap-2">
                        {/* TITLE */}
                        {item.imgTitle && (
                          <img
                            src={item.imgTitle}
                            alt=""
                            className="max-w-[140px]"
                            draggable="false"
                          />
                        )}

                        {item.title && (
                          <h3 className="text-white text-sm font-body font-light uppercase tracking-wide">
                            {tx(item.title)}
                          </h3>
                        )}
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <p className="font-body font-light uppercase text-xs tracking-wide underline underline-offset-4 text-white">
                            {"Veja Mais"}
                          </p>
                        </a>
                      </div>

                      {/* RELEASE — DESKTOP ONLY */}
                      {!isMobile && item.release && (
                        <p
                          className={`
                            mt-2 text-white/80 text-sm font-body tracking-tight
                            transition-opacity duration-300
                            ${isHighlighted ? "opacity-100" : "opacity-0"}
                          `}
                        >
                          {tx(item.release)}
                        </p>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* PROGRESS BAR */}
            <div className="relative flex flex-col items-center justify-center gap-3">
              <div className="relative w-full h-[2px] bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  style={{ scaleX }}
                  className="h-full bg-white origin-left rounded-full"
                />
              </div>
              
              {/* RELEASE ABAIXO DO PROGRESS BAR */}
             {isMobile && mediaItems[activeIndex]?.release && (
  <motion.p
    key={activeIndex}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="text-white/80 text-sm font-body tracking-tight h-8"
  >
    {tx(mediaItems[activeIndex].release!)}
  </motion.p>
)}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-row w-full justify-between items-center py-4">
          <img src="/logos/favicon-zaylo.png" className="max-w-8" />
        </div>
      </div>
    </section>
  );
};

export default RevendedorContainer;