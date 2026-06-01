import { motion } from 'framer-motion';
import { tx } from "../../text";
import texts from "../../texts.json";
import { useEffect, useState } from 'react';
import { Instagram, Facebook, Music, ChevronDown, ChevronUp, YoutubeIcon, Youtube , LucideYoutube } from 'lucide-react';

function isRevendedorPage() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return path === "/revendedor" || path.startsWith("/revendedor/");
}

const FooterComponent = () => {
  const [hidden, setHidden] = useState(
    () => typeof window !== "undefined" && isRevendedorPage()
  );

  const [email, setEmail] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false); // State for Help accordion
  const [isAboutOpen, setIsAboutOpen] = useState(false); // State for About Litco accordion
  const productCategories = [
    { title: "privacy-policy", path: "#" }
  ];

  const helpLinks = [
    
    { title: "menu.envios", path: "/ajuda" },
    { title: "menu.pagamento", path: "/ajuda#section6" },
    { title: "menu.faq", path: "/ajuda" },
    
  ];

  const aboutLitcoLinks = [
    { title: "menu.blog", path: "/blog" },
    { title: "menu.about_us", path: "/sobre" },
    { title: "menu.resell", path: "/revendedor" },

  ];

  useEffect(() => {
    const update = () => setHidden(isRevendedorPage());
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const handleSubscribe = ({e}:any) => {
    e.preventDefault();
    alert(`Obrigado por se inscrever, ${email}!`);
    setEmail('');
  };

  if (hidden) return null;

  return (
    <footer className="w-full flex flex-col bg-black relative">

      {/* Top Product Categories */}
      <div className="bg-black text-amber-50 py-1 px-4 md:px-16 flex flex-wrap justify-center gap-x-8 gap-y-4 border-b border-gray-700 font-body italic">
        {productCategories.map((item, index) => (
          <motion.a
            key={index}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            viewport={{ once: true, amount: 0.2 }}
            href='/privacidade'
            className="hover:text-gray-400 uppercase text-sm font-body font-light tracking-wide"
          >
            {"POLiTICA DE PRIVACIDADE"}
          </motion.a>
        ))}
      </div>

      {/* Main Footer Grid */}
      <div className="bg-black text-white sm:py-12 px-4 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className='flex flex-col justify-center items-center py-4'>
          {/* Column 1: Logo + Social */}
          <div className="flex flex-col gap-4 justify-center ext-center">
              <motion.div
                initial={{ opacity: 0}}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                viewport={{ once: true, amount: 0.2 }}
                className="w-full flex justify-center items-center"
              >
                <a href='#'>
                <img
                  className="max-w-8"
                  src="/logos/favicon-zaylo.png"
                  alt="Zaylo"
                />
                </a>
              </motion.div>

              
                
                <div className="flex gap-4 justify-center items-center w-full"> {/* Increased gap for social icons */}
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://www.instagram.com/zaylobr"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-6 h-6 text-white" /> {/* Increased icon size */}
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://www.youtube.com/@zaylobr"
                    aria-label="Instagram"
                  >
                    <LucideYoutube className="w-7 h-7 scale-x-110 scale-y-120 text-white" /> {/* Increased icon size */}
                  </motion.a>

                   <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://wa.me/552135592431"
                    aria-label="whatsapp"
                  >
                    <img src='/icons/whatsapp.png' className='max-w-7 invert'/>
                  </motion.a>
                </div>
              
            </div>
        </div>

        {/* Column 2: Help (Accordion on mobile) */}
        <div className="flex flex-col gap-3 items-center md:items-start md:text-left w-full sm:border-0 border-gray-200/20 border-b-1 pb-4">
          <div
            className="flex justify-between items-center text-start sm:items-start w-full md:cursor-default cursor-pointer px-4 "
            onClick={() => setIsHelpOpen(!isHelpOpen)}
          >
            <h3 className="fill-over-stroke font-heading font-bold text-md uppercase sm:text-2xl stroke stroke-black-2 sm:-translate-x-4">Ajuda</h3>
            <span className="md:hidden text-white">
              {isHelpOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </span>
          </div>
          <motion.div
            className={`md:block overflow-hidden transition-all duration-300 ease-in-out ${isHelpOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
            md:max-h-full md:opacity-100 md:block`}
          >
            <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left w-full">
              {helpLinks.map((link, index) => (
                <motion.a
                  key={index}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.03 }}
                  viewport={{ once: true }}
                  href={link.path}
                  className="font-heading font-bold uppercase text-white hover:text-gray-400 text-xs whitespace-nowrap"
                >
                  {tx(link.title)}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Column 3: About Litco (Accordion on mobile) */}
        <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left w-full  pb-4">
          <div
            className="flex justify-between items-center w-full md:cursor-default cursor-pointer px-4 md:p-0  "
            onClick={() => setIsAboutOpen(!isAboutOpen)}
          >
            <h3 className="fill-over-stroke font-heading font-bold text-md uppercase sm:text-2xl stroke stroke-black-2 sm:-translate-x-4">Sobre</h3>
            <span className="md:hidden text-white">
              {isAboutOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </span>
          </div>
          <motion.div
            className={`md:block overflow-hidden transition-all duration-300 ease-in-out ${isAboutOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
             md:max-h-full md:opacity-100 md:block`}
            
          >
            <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left w-full">
              {aboutLitcoLinks.map((link, index) => (
                <motion.a
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.03 }}
                  viewport={{ once: true }}
                  href={link.path}
                  className="font-heading font-bold uppercase text-white hover:text-gray-400 text-xs whitespace-nowrap"
                >
                  {tx(link.title)}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
       <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-black text-xs text-gray-400 py-3 px-4 md:px-16 flex flex-col md:flex-row justify-between items-center text-center gap-1"
    >
      <motion.p
        className="font-body font-light tracking-wide  text-white hover:text-gray-400 text-xs"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        Zaylo. All rights reserved. ©{" "}2026
      </motion.p>

  

      <motion.div
        className="flex flex-col md:flex-row gap-2 md:gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.a
          href="https://www.industriebrasil.com.br"
          className="font-body font-light tracking-wide  text-white hover:text-gray-400 text-xs hover:underline whitespace-nowrap transition duration-200 ease-in-out"
          whileHover={{ scale: 1.05 }}
        >
          Produced by Industrie Brasil
        </motion.a>
      </motion.div>
    </motion.div>
       
      

    </footer>
  );
};

export default FooterComponent;