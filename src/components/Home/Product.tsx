import React, { useRef, useState, useEffect } from "react";
import texts from "../../texts.json";
import { motion, useSpring, useScroll } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductContainer() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: scrollRef });
  const scaleX = useSpring(scrollXProgress, { stiffness: 100, damping: 30 });

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    scrollRef.current?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      scrollRef.current?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 500;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const flyerImages = [
    "/photos/zaylo-13.webp",
    "/photos/zaylo-08.webp",
    "/photos/zaylo-07.webp",
    "/photos/zaylo-09.webp",
    "/photos/zaylo-11.webp",
    "/photos/zaylo-12.webp",
    "/photos/zaylo-14.webp",
  ];

  return (
    <div className="w-full flex flex-col gap-6 py-8 px-6 sm:px-16 md:px-32 bg-white">

 <div className="flex flex-row justify-between items-start gap-2">
      {/* Title */}
      <div className="flex flex-col gap-2">
      
      <h2 className="text-lg font-body font-light text-black tracking-wide uppercase">{"Presença que conecta."}</h2>
      <p className="text-sm font-body text-black tracking-tight ">{"Junte-se a Zaylo Crew e compartilhe sofisticação, cuidado e liberdade em cada momento."}</p>
      </div>

      <img src='/logos/favicon-zaylo.png' className='max-w-6 invert'/>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden scroll-smooth hide-scrollbar"
      >
        <div className="flex gap-6 pb-4 w-max">
          {flyerImages.map((flyer, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="relative w-40 sm:w-64 flex-shrink-0"
            >
              <motion.img
                src={flyer}
                alt={`Workshop flyer ${i + 1}`}
                className="w-full h-auto object-cover rounded-xl border border-white/20 shadow-md aspect-[3/4]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
            </motion.div>
          ))}
        </div>
      </div>

       {/* Progress bar with arrows */}
      <div className="relative justify-center w-full flex items-center gap-3 z-20 ">
        <motion.button
          animate={{ 
            opacity: canScrollLeft ? 1 : 0,
            scale: canScrollLeft ? 1 : 0.8,
            pointerEvents: canScrollLeft ? 'auto' : 'none'
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={() => scroll('left')}
          className="w-8 h-8 rounded-full border-black border-1  flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
        </motion.button>
        
        <div className="relative w-32 sm:w-48 h-[6px] bg-black/60 rounded-full overflow-hidden">
          <motion.div
            style={{ scaleX }}
            className="h-full bg-black origin-left rounded-full"
          />
        </div>

        <motion.button
          animate={{ 
            opacity: canScrollRight ? 1 : 0,
            scale: canScrollRight ? 1 : 0.8,
            pointerEvents: canScrollRight ? 'auto' : 'none'
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={() => scroll('right')}
          className="w-8 h-8 rounded-full border-black  border-1 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-black" />
        </motion.button>
      </div>

    </div>
  );
}
