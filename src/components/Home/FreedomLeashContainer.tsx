import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const FreedomLeashContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const yOffset = useTransform(scrollYProgress, [0, 1], [-128, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <section
      id="freedom-leash"
      className="w-full flex flex-col justify-center items-center"
      ref={containerRef}
    >
      <div
        className="relative w-full flex justify-center items-center cursor-pointer"
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden sm:max-h-212">
          {/* Vídeo de fundo */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/freedom-leash.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
          />

          {/* Black overlay */}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-6 p-4">
            <motion.div
              style={{ y: yOffset, opacity }}
              className="flex flex-col justify-end items-center w-full h-full py-4 gap-4"
            >
              {/* CTAs */}
              <div className="flex flex-col w-full justify-center items-start text-left gap-2">
                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-white text-sm md:text-2xl font-body font-light uppercase tracking-widest px-4"
                >
                  {"Liberdade em movimento"}
                </motion.h2>

                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="text-white text-4xl md:text-4xl font-heading font-bold uppercase tracking-tight px-4"
                >
                  {"Freedom Leash"}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  className="text-white text-md font-body tracking-tight px-4"
                >
                  {"Cada passeio é uma experiência de controle inteligente, unindo liberdade e elegância."}
                </motion.p>
              </div>

              {/* Botão */}
              <div className="flex justify-start items-center w-full">
                <motion.a
                href='/produtos/freedom-leash'
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                  className="text-white px-4 py-2 rounded-full font-body font-light uppercase tracking-wide text-md hover:-translate-y-1 transition duration-300 z-10 underline underline-offset-8"
                >
                  {"Comprar Agora"}
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreedomLeashContainer;
