import { motion } from "framer-motion";
import texts from "../../texts.json";
import { useEffect, useState } from "react";

const NewArrivalsContainer = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const el = document.getElementById("banner-image");
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="conteudo"
      className="w-full flex flex-col justify-center items-center"
    >
      <motion.div
        id="banner-image"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 32 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full flex justify-center items-center cursor-pointer "
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden sm:max-h-212">
          {/* Imagem de fundo */}
          <img
            src="/photos/zaylo-06.webp"
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Black overlay */}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-6 p-4">
            <div className="flex flex-col justify-end items-center w-full h-full py-4 gap-4">
              
              {/* CTAs */}
              <div className="flex flex-col w-full  justify-center items-center ">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-white text-md md:text-4xl font-body font-light uppercase tracking-widest px-4 "
                >
                  {"Zaylo"}
                </motion.h2>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-white text-4xl md:text-4xl font-heading font-medium tracking-tight px-4"
                >
                  {"Novas Coleções"}
                </motion.h2>
              </div>

              {/* Botão */}
              <div className="flex justify-center items-center w-full">
                <motion.a
                href='/produtos'
                  initial={{ opacity: 0}}
                  whileInView={{ opacity: 1}}
                  transition={{ duration:0.6, delay: 0.4, ease: "easeOut" }}
                  className="text-white px-4 py-2 rounded-full font-body font-light uppercase tracking-wide text-md  hover:-translate-y-1  transition duration-300 z-10 underline underline-offset-8"
                >
                  {"Veja Mais"}
                </motion.a>
              </div>

            </div>
          </div>
        </div>
      </motion.div>

      
    </section>
  );
};

export default NewArrivalsContainer;
