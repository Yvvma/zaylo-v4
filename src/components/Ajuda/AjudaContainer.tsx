import { motion, AnimatePresence } from "framer-motion";
import texts from "../../texts.json";
import { useState, useEffect } from "react";
import { ChevronDown, Mail, MessageCircle, CreditCard } from "lucide-react";

const sections = [
  "section1",
  "section2",
  "section3",
  "section4",
  "section5",
  "section6", // nova seção: formas de pagamento
];

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const contentVariants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: "auto", opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

const AjudaContainer = () => {
  const [open, setOpen] = useState<string | null>(null);

  // Abre o accordion via query param ?accordion=sectionX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accordionId = params.get("accordion");
    if (accordionId && sections.includes(accordionId)) {
      setOpen(accordionId);
    }
  }, []);

  return (
    <section className="w-full flex justify-center text-white bg-[radial-gradient(ellipse_at_center,_#1A2327_0%,_#131819_45%,_#000000_100%)]">
      <div className="w-full max-w-3xl px-8 py-16 flex flex-col gap-12">

        {/* TÍTULO */}
        <motion.h1 variants={itemVariants} initial="hidden" animate="show" className="text-xl font-heading font-bold text-center">
          {"Trocas e Devoluções"}
        </motion.h1>

        {/* INTRO COM LINKS */}
        <motion.p variants={itemVariants} initial="hidden" animate="show" className="text-xs font-body font-light leading-relaxed text-center">
          {"As ocorrências que envolvam TROCA ou DEVOLUÇÃO de produto DEVEM ser comunicadas à nossa central de relacionamento através do número"}{" "}
          <a href="tel:2135592430" className="underline hover:opacity-80">
            {"(21) 3559-2430"}
          </a>{" "}
          {"de segunda a sexta entre 10h e 18h"} {"ou através do e-mail"}{" "}
          <a href="mailto:contato@zaylo.com.br" className="underline hover:opacity-80">
            {"contato@zaylo.com.br"}
          </a>
        </motion.p>

        {/* FAQ / ACCORDIONS */}
        <div className="flex flex-col gap-4">
          {sections.map((section) => {
            const isOpen = open === section;

            // pega só os textos numerados (01, 02, 03...)
            const sectionData = texts.help[section] as Record<string, string>;
            const entries = Object.entries(sectionData).filter(([key]) => key !== "title");

            return (
              <motion.div key={section} variants={itemVariants} initial="hidden" animate="show" className="border border-white/10 rounded-lg overflow-hidden" id={section}>
                
                {/* HEADER */}
                <button onClick={() => setOpen(isOpen ? null : section)} className="w-full flex justify-between items-center px-4 py-4 text-left">
                  <span className="text-sm font-heading font-bold">{sectionData.title}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* CONTEÚDO */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div variants={contentVariants} initial="hidden" animate="show" exit="exit" className="px-4 pb-4 flex flex-col gap-2">
                      {entries.map(([key, value]) => (
                        
                        <p key={key} className="text-xs font-body font-light leading-relaxed">
                          {value}
                        </p>
                      ))}

                    
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CAIXA FINAL DE CONTATO */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="border border-white/10 rounded-xl p-6 flex flex-col gap-6 items-center text-center bg-white/5">
          <h3 className="text-sm font-heading font-bold">Precisa falar com a gente?</h3>

          <div className="flex gap-4">
            {/* WhatsApp */}
            <a href="https://wa.me/552135592431" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-full text-xs hover:bg-white/10 transition">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            {/* Email */}
            <a href="mailto:contato@zaylo.com.br" className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-full text-xs hover:bg-white/10 transition">
              <Mail className="w-4 h-4" />
              E-mail
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AjudaContainer;
