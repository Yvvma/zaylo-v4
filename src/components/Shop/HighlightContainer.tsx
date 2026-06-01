import { motion } from "framer-motion";
import { tx } from "../../text";
import texts from "../../texts.json";
import { useEffect, useState, useCallback } from "react";

interface MediaItem {
  type: "image" | "video";
  src: string;
  title: string;
  subtitle: string;
  duration?: number;
  link?: string;
}

const mediaItems: MediaItem[] = [
  {
    type: "image",
    src: "/banners/ozy-vest.webp",
    title: "Ozy.Vest",
    subtitle: "Ozy.Vest",
    duration: 5000,
    link: "/ozy-vest",
  },
  {
    type: "image",
    src: "/banners/freedoom-leash.webp",
    title: "Freedoom Leash",
    subtitle: "Freedoom Leash",
    duration: 5000,
    link: "/freedom-leash",
  }
];

const preloadedImages = new Map<string, boolean>();

function preloadImage(src: string): Promise<void> {
  if (preloadedImages.get(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      preloadedImages.set(src, true);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

interface SlideProps {
  item: MediaItem;
  isEntering: boolean;
}

const Slide = ({ item, isEntering }: SlideProps) => {
  return (
    <motion.div
      initial={isEntering ? { x: "100%" } : false}
      animate={{ x: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="absolute inset-0 w-full h-full"
    >
      {/* Fundo desfocado */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${item.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          transform: "scale(1.05)",
        }}
      />

      {/* Imagem central */}
      <img
        src={item.src}
        alt="Banner"
        className="absolute inset-0 w-full h-full object-contain p-6"
      />

      {/* Overlay com texto */}
      <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex flex-col justify-between items-center w-full h-full py-4 gap-4">
          <div className="flex flex-col w-full justify-center items-center">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-white text-4xl font-heading font-bold tracking-tight px-4"
            >
              {tx(item.subtitle)}
            </motion.h2>
          </div>

          <div className="flex justify-center items-center w-full">
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              href={`/produtos${item.link}`}
              className="text-white px-4 py-2 rounded-full font-body font-light uppercase tracking-wide text-md transition duration-300 z-10 underline underline-offset-8"
            >
              {"Veja Mais"}
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HighlightContainer = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  // Começa como true — a primeira imagem já pode ser exibida sem esperar preload
  const [restLoaded, setRestLoaded] = useState(false);

  const currentMedia = mediaItems[currentIndex];

  useEffect(() => {
    // Precarrega a primeira imagem imediatamente (marca como pronta)
    preloadedImages.set(mediaItems[0].src, true);

    // Carrega as demais imagens em segundo plano
    const remainingSrcs = mediaItems
      .slice(1)
      .filter((m) => m.type === "image")
      .map((m) => m.src);

    Promise.all(remainingSrcs.map(preloadImage)).then(() =>
      setRestLoaded(true)
    );
  }, []);

  const goToNext = useCallback(async () => {
    const nextIndex = (currentIndex + 1) % mediaItems.length;
    const nextItem = mediaItems[nextIndex];

    // Garante que o próximo slide está carregado antes de avançar
    if (nextItem.type === "image") await preloadImage(nextItem.src);

    setPreviousIndex(currentIndex);
    setCurrentIndex(nextIndex);
  }, [currentIndex]);

  useEffect(() => {
    // Só começa o timer de avanço automático quando as demais imagens estiverem prontas
    if (!restLoaded) return;
    const timer = setTimeout(goToNext, currentMedia.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, currentMedia.duration, goToNext, restLoaded]);

  // Renderiza imediatamente com o primeiro slide — sem aguardar nada
  return (
    <section
      id="content"
      className="w-full flex flex-col justify-center items-center relative aspect-[3/4] max-h-[560px] sm:max-h-[640px] overflow-hidden"
    >
      {/* Slide anterior fica estático embaixo — z-0 */}
      {previousIndex !== null && (
        <div className="absolute inset-0 w-full h-full z-0">
          <Slide item={mediaItems[previousIndex]} isEntering={false} />
        </div>
      )}

      {/* Slide atual entra por cima deslizando — z-10 */}
      <div key={currentIndex} className="absolute inset-0 w-full h-full z-10">
        <Slide item={currentMedia} isEntering={previousIndex !== null} />
      </div>

      {/* Progress bar fora dos slides para não remontar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30 overflow-hidden z-20">
        <motion.div
          key={currentIndex}
          className="h-full bg-white origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: (currentMedia.duration ?? 5000) / 1000,
            ease: "linear",
          }}
        />
      </div>
    </section>
  );
};

export default HighlightContainer;