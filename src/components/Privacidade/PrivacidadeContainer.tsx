import { motion } from "framer-motion";
import texts from "../../texts.json";

/* ================= VARIANTS ================= */

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

/* ================= COMPONENT ================= */

const PrivacidadeContainer = () => {
  const collection = ["3", "4", "5", "6", "7"];

  return (
    <section
      id="content"
      className="w-full flex justify-center text-white bg-[radial-gradient(ellipse_at_center,_#1A2327_0%,_#131819_45%,_#000000_100%)]"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl px-8 py-16 flex flex-col gap-10"
      >
        {/* Título */}
        <motion.h1
          variants={itemVariants}
          className="text-xl font-heading font-bold text-center"
        >
          {"Política de Privacidade"}
        </motion.h1>

        {/* Atualização */}
        <motion.p
          variants={itemVariants}
          className="text-xs text-center opacity-70"
        >
          {"ÚLTIMA ATUALIZAÇÃO: 11/09/2023"}
        </motion.p>

        {/* Intro */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.p
              key={i}
              variants={itemVariants}
              className="text-xs font-body font-light leading-relaxed"
            >
              {texts.privacy.intro[`0${i + 1}`]}
            </motion.p>
          ))}
        </div>

        {/* Definições */}
        <div className="flex flex-col gap-3">
          <motion.h2
            variants={itemVariants}
            className="text-sm font-heading font-bold"
          >
            {"1. Definições"}
          </motion.h2>

          {["01", "02", "03", "04"].map((key) => (
            <motion.p
              key={key}
              variants={itemVariants}
              className="text-xs font-body font-light"
            >
              {texts.privacy.definitions[key]}
            </motion.p>
          ))}
        </div>

        {/* Uso de dados */}
        <div className="flex flex-col gap-3">
          <motion.h2
            variants={itemVariants}
            className="text-sm font-heading font-bold"
          >
            {"2. Uso de Dados Pessoais"}
          </motion.h2>

          {["01","02","03","04","05","06","07"].map((key) => (
            <motion.p
              key={key}
              variants={itemVariants}
              className="text-xs font-body font-light"
            >
              {texts.privacy.usage[key]}
            </motion.p>
          ))}
        </div>

        {/* Blocos 3 a 7 */}
        {collection.map((section) => {
          const sectionData = texts.privacy.collection[section] as any;

          if (!sectionData) return null;

          return (
            <div key={section} className="flex flex-col gap-3">
              <motion.h2
                variants={itemVariants}
                className="text-sm font-heading font-bold"
              >
                {sectionData.title}
              </motion.h2>

              {Array.isArray(sectionData.items) &&
                sectionData.items.map((item: string, idx: number) => (
                  <motion.p
                    key={idx}
                    variants={itemVariants}
                    className="text-xs font-body font-light"
                  >
                    {item}
                  </motion.p>
                ))}

              {sectionData.sections &&
                Object.entries(sectionData.sections).map(
                  ([key, value]: [string, any]) => (
                    <div key={key} className="flex flex-col gap-2 pl-2">
                      <motion.p
                        variants={itemVariants}
                        className="text-xs font-heading font-bold"
                      >
                        {value.title}
                      </motion.p>

                      {Array.isArray(value.items) &&
                        value.items.map((item: string, idx: number) => (
                          <motion.p
                            key={idx}
                            variants={itemVariants}
                            className="text-xs font-body font-light"
                          >
                            {item}
                          </motion.p>
                        ))}
                    </div>
                  )
                )}
            </div>
          );
        })}

        {/* Direitos */}
        <div className="flex flex-col gap-3">
          <motion.h2
            variants={itemVariants}
            className="text-sm font-heading font-bold"
          >
            {"8. Direitos do Usuário"}
          </motion.h2>

          {["01", "02"].map((key) => (
            <motion.p
              key={key}
              variants={itemVariants}
              className="text-xs font-body font-light"
            >
              {texts.privacy.rights[key]}
            </motion.p>
          ))}
        </div>

        {/* Segurança */}
        <div className="flex flex-col gap-3">
          <motion.h2
            variants={itemVariants}
            className="text-sm font-heading font-bold"
          >
            {"9. Segurança dos Dados"}
          </motion.h2>

          {["01", "02"].map((key) => (
            <motion.p
              key={key}
              variants={itemVariants}
              className="text-xs font-body font-light"
            >
              {texts.privacy.security[key]}
            </motion.p>
          ))}
        </div>

        {/* Contato */}
        <div className="flex flex-col gap-3">
          <motion.h2
            variants={itemVariants}
            className="text-sm font-heading font-bold"
          >
            {"12. Contato"}
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-xs font-body font-light"
          >
            {"E-mail: help@zaylo.com.br"}
          </motion.p>
        </div>

        {/* Logo */}
        <motion.img
          variants={itemVariants}
          src="/logos/favicon-zaylo.png"
          alt="Zaylo"
          className="mx-auto mt-8 w-8 opacity-80"
        />
      </motion.div>
    </section>
  );
};

export default PrivacidadeContainer;
