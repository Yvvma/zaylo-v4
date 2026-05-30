import { motion, useSpring } from "framer-motion";
import { tx } from "../../text";
import texts from "../../texts.json";
import { useEffect, useRef, useState } from "react";

type MediaItem = {
  src: string;
  type: "image" | "video";
  title?: string;
  release?: string;
  link?: string;
};

const ProdutosContainer = () => {
  const mediaItems: MediaItem[] = [
    {
      src: "/photos/zaylo-21.webp",
      type: "image",
      title: "empresas.leash-title",
      release: "empresas.leash",
      link: "/produtos/leash",
    },
    {
      src: "/photos/zaylo-07.webp",
      type: "image",
      title: "empresas.peitoral-title",
      release: "empresas.peitoral",
      link: "/produtos/ozy-vest",
    }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ===== MOBILE / DESKTOP ===== */
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

  /* ===== PROGRESS BAR ===== */
  const [scrollProgress, setScrollProgress] = useState(0);
  const scaleX = useSpring(scrollProgress, { stiffness: 100, damping: 30 });

  /* ===== ACTIVE INDEX BY SCROLL ===== */
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const el = scrollRef.current;
    const progress = el.scrollLeft / (el.scrollWidth - el.offsetWidth);
    setScrollProgress(Math.max(0, Math.min(1, progress)));

    const children = Array.from(el.children);
    const containerCenter = el.scrollLeft + el.offsetWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    children.forEach((child, index) => {
      const childEl = child as HTMLElement;
      const elCenter = childEl.offsetLeft + childEl.offsetWidth / 2;
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
      id="produtos"
      className="w-full flex flex-col justify-center items-center gap-6 bg-white"
    >
      <div className="relative flex flex-col bg-[#131819]/90 backdrop-blur-lg p-8 gap-2 justify-between items-center w-full">
        <img
          src="/photos/zaylo-20.webp"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover -z-10 blur-xs"
        />

        <div className="flex flex-col sm:flex-row w-full justify-center items-center pt-8 sm:pt-16">
          {/* TEXTO */}
          <div className="max-w-full text-start p-8 sm:p-24 w-full">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xl md:text-2xl font-body font-light text-white uppercase tracking-wide"
            >
              {"Conheça os produtos Zaylo"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-left text-white text-sm md:text-md max-w-2xl font-body"
            >
              {"Descubra a coleção completa de produtos Zaylo, projetados para elevar a experiência do seu pet a um novo nível."}
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
              }}
            >
              {mediaItems.map((item, i) => {
                const isHighlighted = activeIndex === i;

                return (
                  <motion.div
                    key={i}
                    className="relative flex-shrink-0 cursor-pointer snap-start"
                    style={{ width: isMobile ? "13rem" : "24rem" }}
                    onMouseEnter={() => !isMobile && setActiveIndex(i)}
                  >
                    {/* MEDIA */}
                    {item.type === "image" ? (
                      <img
                        src={item.src}
                        alt=""
                        className="w-full h-full object-cover aspect-[3/4]"
                        draggable={false}
                      />
                    ) : (
                      <video
                        src={item.src}
                        className="w-full h-full object-cover aspect-[3/4]"
                        muted
                        loop
                        autoPlay
                        playsInline
                        draggable={false}
                      />
                    )}

                    {/* GRADIENT */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                    {/* CONTENT */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <div className="flex flex-col items-center gap-2">
                        {item.title && (
                          <h3 className="text-white text-sm font-body font-light uppercase tracking-wide">
                            {tx(item.title)}
                          </h3>
                        )}

                        {item.link && (
                          <a href={item.link}>
                            <p className="font-body font-light uppercase text-xs tracking-wide underline underline-offset-4 text-white">
                              {"Veja Mais"}
                            </p>
                          </a>
                        )}
                      </div>

                      {/* RELEASE — DESKTOP ONLY */}
                      {!isMobile && item.release && (
                        <p
                          className={`
                            mt-2 text-white/80 text-sm font-body
                            transition-opacity duration-300
                            ${isHighlighted ? "opacity-100" : "opacity-0"}
                          `}
                        >
                          {tx(item.release)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* PROGRESS + RELEASE MOBILE */}
            <div className="relative flex flex-col items-center justify-center gap-3">
              <div className="relative w-full h-[2px] bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  style={{ scaleX }}
                  className="h-full bg-white origin-left rounded-full"
                />
              </div>

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

export default ProdutosContainer;
