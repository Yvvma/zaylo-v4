// Full corrected file
import { useEffect, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ShoppingCart } from 'lucide-react';
import CartSidebar from '../Shop/CartSidebar';
import { useCart } from '../Shop/CartContext';

const MENU_ITEMS = [
  { key: 'menu.home', path: '/' },
  { key: 'menu.products', path: '/produtos' },
  { key: 'menu.about_us', path: '/sobre' },
  { key: 'menu.resell', path: '/revendedor' },
  { key: 'menu.blog', path: '/blog' }
];

const MENU_LABELS: Record<string, string> = {
  'menu.home': 'Início',
  'menu.products': 'Produtos',
  'menu.about_us': 'Sobre',
  'menu.resell': 'Revendedor',
  'menu.blog': 'Blog'
};

const HeaderComponent = () => {
  const [isProductPage, setIsProductPage] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Try to use cart context, with fallback for pages without it
  const { cartItems } = useCart();

  const sidebarMenuVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  };

  const socialFade = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
  };

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
 useEffect(() => {
  const path = window.location.pathname;

  if (path === '/products' || path.startsWith('/produtos/')) {
    setIsProductPage(true);
  }
}, []);

const forceDarkHeader = isProductPage;

useEffect(() => {
  const handleScroll = () => {
    const currentScroll = window.scrollY;

    // Show/hide header on scroll
    if (currentScroll < lastScrollY) {
      setShowHeader(true);
    } else {
      setShowHeader(false);
    }
    // Turn header white after 50px
    setIsScrolled(currentScroll > 50);

    setLastScrollY(currentScroll);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, [lastScrollY]);


  return (
    <>
     <motion.header
  className={clsx(
    "fixed top-0 left-0 w-full z-40  transition-colors duration-300",
   (isScrolled || forceDarkHeader)
  ? "bg-white text-black"
  : "bg-black text-black/50"
  )}
  animate={{ y: showHeader ? 0 : -80, opacity: showHeader ? 1 : 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>
       <nav className="w-full mx-auto flex px-4 sm:px-32 justify-between items-center py-4">
  <div className="flex items-center gap-6 ">


    {/* LOGO */}
    <a href="/" aria-label="Homepage">
      <img
        className={clsx("max-w-24 transition-all duration-300", (isScrolled || forceDarkHeader) ? "invert" : "")}
        src="/logos/zaylo-logo.png"
        alt="Zaylo Logo"
      />
    </a>

    {/* DESKTOP MENU */}
    <div className="hidden sm:flex items-center gap-8 ml-12">
      {MENU_ITEMS.map((item) => (
        <a
          key={item.key}
          href={item.path}
          className={clsx(`uppercase text-xs font-heading font-bold  tracking-tight hover:opacity-60 transition`,
            (isScrolled || forceDarkHeader) ? "text-black" : "text-white")
          }
        >
          {MENU_LABELS[item.key] || item.key}
        </a>
      ))}
    </div>
  </div>
    {/* RIGHT SIDE: CART, MENU */}
    <div className="flex items-center gap-3 sm:gap-4">
      {/* CART BUTTON - Desktop and Mobile */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={clsx(
          "relative p-2 hover:opacity-70 transition",
          (isScrolled || forceDarkHeader) ? "text-black" : "text-white"
        )}
      >
        <ShoppingCart size={20} />
        {hydrated && cartItems.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartItems.length}
          </span>
        )}
      </button>

      {/* MOBILE MENU BUTTON */}
      <button
        className="relative w-8 h-8 flex items-center justify-center z-[9999] sm:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <span className={clsx("absolute w-6 h-[2px] transition-all duration-300", (isScrolled || forceDarkHeader) ? "bg-black" : "bg-white", "translate-y-[-6px]")} />
           <span className={clsx("absolute w-6 h-[2px] transition-all duration-300", (isScrolled || forceDarkHeader) ? "bg-black" : "bg-white")} />
               <span className={clsx("absolute w-6 h-[2px] transition-all duration-300", (isScrolled || forceDarkHeader) ? "bg-black" : "bg-white", "translate-y-[6px]")} />
      </button>
    </div>
</nav>

      </motion.header>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div


            className="fixed top-0 left-0 h-full  text-white z-[999] w-full sm:w-[380px] lg:w-[25vw]"
          >
            <motion.div
              className="flex flex-row w-full"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={socialFade}
            >


              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-full  text-white h-[64px] border-b border-white"
              >

              </button>
            </motion.div>

<motion.div
      initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
className=' w-full h-full bg-black flex-col justify-between '>
            <motion.nav
              className="flex flex-col gap-6 px-8 py-8"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={sidebarMenuVariants}
            >
              {MENU_ITEMS.map((item) => (
                <Fragment key={item.key}>
                <motion.a
                  href={item.path}
                  variants={itemVariants}
                  onClick={() => setIsSidebarOpen(false)}
                  className="uppercase text-sm font-heading font-bold"
                >
                  {MENU_LABELS[item.key] || item.key}
                </motion.a>

                   <div className="flex flex-row  w-full relative">
                                            <motion.div
                                                    variants={itemVariants}
                                                    className="w-full  h-[1px] bg-white/20 origin-left"
                                                  />
                                            </div>
                                            </Fragment>
              ))}
            </motion.nav>


            <div className="flex flex-row  w-full absolute bottom-16 px-8">
                                            <motion.div
                                                    initial={{ opacity: 0, }}
                                                      animate={{ opacity: 1}}
                                                      transition={{duration:1, ease:"easeInOut"}}
                                                    className="w-full  h-[1px] bg-white/20 origin-left"
                                                  />
                                            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default HeaderComponent;