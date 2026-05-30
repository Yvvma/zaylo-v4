const navLinks = [
    { href: "#revendedor", label:  "nav.revendedor"  },
    { href: "#produtos", label:  "nav.produtos"  },
    { href: "#publicidade", label:  "nav.publicidade" },
    { href: "#historias", label:  "nav.historias"  },
    { href: "#contato", label: "nav.contato" },
    
  ];

   {/* Navigation */}
      <nav
        className={`
          flex gap-4  py-2  border-b border-black/20 w-full 
          overflow-x-auto whitespace-nowrap scrollbar-hide
          ${locale === "pt" ? "justify-start" : "justify-center"}
        `}
      >
        {navLinks.map((link, i) => (
          <motion.div
            key={link.href}
            custom={i} // passa índice para usar no transition
            initial="hidden"
            animate="show"
            variants={fadeUpVariants}
            transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
          >
            <Link
              href={link.href}
              className={`
                text-sm font-body underline-offset-13
                ${link.href === "/enterprise" ? "underline decoration-2" : "hover:underline hover:decoration-2"}
              `}
            >
              {tx(link.label)}
            </Link>
          </motion.div>
        ))}
      </nav>