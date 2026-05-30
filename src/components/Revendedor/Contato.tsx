import { useEffect, useRef, useState } from "react";
import texts from "../../texts.json";
import { Mail, Instagram, Music, Youtube } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import clsx from "clsx";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const ContatoB2B = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    marketingConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "success" | "error" | "consent_error" | null
  >(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const { name, email, marketingConsent } = formData;

    if (!name || !email) {
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    if (!marketingConsent) {
      setSubmitStatus("consent_error");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", marketingConsent: false });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contato"
      ref={sectionRef}
      className=" flex py-8 justify-center items-center bg-black w-full"
    >
      <div className="container  px-6 text-center flex flex-col justify-center items-center ">
        <motion.div
          className="gap-4 flex flex-col justify-center items-center "
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <img  className='max-w-12 relative' src='/logos/favicon-zaylo.png'/>
          <h2 className="font-heading font-bold uppercase text-2xl mb-4 tracking-tighter text-white">
            {"Entre em contato nossa equipe"}
          </h2>
         
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-lg mx-auto flex flex-col gap-4 justify-center items-center font-body font-light"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <input
            type="text"
            name="name"
            placeholder="Nome"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-transparent border border-white/40 font-body font-light text-white px-16 py-2 focus:outline-none focus:border-white transition-all"
          />
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-transparent border border-white/40 font-body font-light text-white px-16 py-2 focus:outline-none focus:border-white transition-all"
          />

          <label className="flex items-start font-body font-light  text-xs tracking-wide w-full cursor-pointer select-none text-white">
            <input
              type="checkbox"
              name="marketingConsent"
              checked={formData.marketingConsent}
              onChange={handleChange}
              className="w-8 h-6  appearance-none border-2 border-white bg-transparent checked:bg-white checked:border-white transition"
            />
            <span className="text-xs px-4">
              Li e aceito a{" "}
              <a
                href="/termos-e-privacidade"
                className="underline hover:text-gray-300"
              >
                Política de Privacidade
              </a>{" "}
              e autorizo o uso dos meus dados para contato.
            </span>
          </label>

          <motion.button
            type="submit"
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
            disabled={isSubmitting}
            className={clsx(
              "bg-accent text-accent-foreground px-4 py-4 border-2 border-accent font-heading font-bold uppercase mt-4 hover:bg-accent/90 transition max-w-max",
              isSubmitting && "opacity-60 cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </motion.button>

          <AnimatePresence>
            {submitStatus && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  "text-xs text-center px-3 py-1 rounded mt-3",
                  submitStatus === "success"
                    ? "bg-green-600/20 text-green-400 border border-green-500"
                    : "bg-red-600/20 text-red-400 border border-red-500"
                )}
              >
                {submitStatus === "success"
                  ? "Mensagem enviada com sucesso!"
                  : submitStatus === "consent_error"
                  ? "Aceite a política de privacidade para continuar."
                  : "Não foi possível enviar. Tente novamente."}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

     
      </div>
    </section>
  );
};

export default ContatoB2B;
