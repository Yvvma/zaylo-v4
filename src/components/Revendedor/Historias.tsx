import { motion, useScroll, useTransform } from "framer-motion";
import { tx } from "../../text";
import texts from "../../texts.json";
import { useEffect, useRef, useState } from "react";

type VideoBlock = {
  video: string;
  title: string;
  subtitle: string;
  
  cta: string;
  link?: string;
};

const HistoriasContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  /* ===== SCROLL MOTION ===== */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const yOffset = useTransform(scrollYProgress, [0, 1], [-128, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  /* ===== OBSERVER ===== */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.15 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const blocks: VideoBlock[] = [
    {
      video: "/videos/historia-01.mp4",
      title: "empresas.historia-01-title",
      subtitle: "empresas.historia-01-subtitle",
      cta: "empresas.veja-mais",
      link: "https://www.instagram.com/reel/DJ4RlS-tisO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    },
    {
      video: "/videos/historia-02.mp4",
      title: "empresas.historia-02-title",
      subtitle: "empresas.historia-02-subtitle",
      cta: "empresas.veja-mais",
      link: "https://www.instagram.com/reel/C0FM5iMPbK_/?hl=en",
    },
  ];

  return (
    <section
    id='historias'
      ref={containerRef}
      className="w-full flex flex-col md:flex-row bg-black"
    >
      {blocks.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.6, delay: index * 0.2 }}
          className="relative w-full min-h-[80vh] overflow-hidden"
        >
          {/* VIDEO BG */}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={item.video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/45 flex items-end">
            <motion.div
              style={{ y: yOffset, opacity }}
              className="flex flex-col justify-end w-full h-full p-6 md:p-12 gap-2"
            >
              <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-white text-sm md:text-lg font-body font-light uppercase tracking-widest"
              >
                {tx(item.title)}
              </motion.h3>

              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-white text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight"
              >
                {tx(item.subtitle)}
              </motion.h2>

           

              {/* CTA */}
              {item.link && (
                <motion.a
                  href={item.link}
                  target={item.link.startsWith("http") ? "_blank" : "_self"}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-4 w-fit text-white uppercase font-body font-light tracking-wide text-sm underline underline-offset-8 hover:opacity-80 transition"
                >
                  {tx(item.cta)}
                </motion.a>
              )}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </section>
  );
};

export default HistoriasContainer;
