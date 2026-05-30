import { motion } from "framer-motion";
import { tx } from "../../text";
import texts from "../../texts.json";
import { useEffect, useState } from "react";
import BannerContainer from "./BannerContainer";
import ProdutosContainer from "./ProdutosContainer";
import ContatoB2B from "./Contato";
import HistoriasContainer from "./Historias";

const navLinks = [
  { href: "#revendedor", label: "nav.revendedor" },
  { href: "#produtos", label: "nav.produtos" },
  
  { href: "#historias", label: "nav.historias" },
  { href: "#contato", label: "nav.contato" },
];

/* ===== ANIMATION VARIANTS ===== */
const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const ContentWrapper = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  /* ===== SCROLL SPY ===== */
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector(link.href))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sections.indexOf(entry.target);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      {
        threshold: 0.5, // metade da seção visível
      }
    );

    sections.forEach((section) => observer.observe(section!));

    return () => observer.disconnect();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="relative flex flex-col w-full gap-6 justify-center items-center bg-[#131819] border-b border-white z-30"
    >
      {/* NAVIGATION */}
      <nav
        className="
        hide-scrollbar
          fixed z-40 w-full sm:backdrop-blur-md
          border-white/80

          /* MOBILE */
          top-16 border-b border-t

          /* DESKTOP */
          md:top-auto md:bottom-0 md:border-t md:border-b-0

          flex gap-4 py-3 px-4
          overflow-x-auto whitespace-nowrap scrollbar-hide
          justify-start md:justify-center
        "
      >
        {navLinks.map((link, i) => {
          const isActive = i === activeIndex;

          return (
            <motion.div
              key={link.href}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUpVariants}
              transition={{
                delay: i * 0.12,
                duration: 0.45,
                ease: "easeOut",
              }}
              className="flex-shrink-0"
            >
              <a
                href={link.href}
                className={`
                  text-sm font-body font-light uppercase tracking-wide
                  underline-offset-13 transition-all duration-300

                  ${
                    isActive
                      ? "underline decoration-2 text-white opacity-100"
                      : "text-white/60 hover:text-white hover:underline hover:decoration-2"
                  }
                `}
              >
                {tx(link.label)}
              </a>
            </motion.div>
          );
        })}
      </nav>

      {/* MAIN CONTENT */}
      <BannerContainer />
    <ProdutosContainer/>
    <HistoriasContainer/>
    <ContatoB2B/>
    </motion.section>
  );
};

export default ContentWrapper;
