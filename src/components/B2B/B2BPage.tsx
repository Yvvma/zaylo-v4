import { useState, useEffect, useRef } from "react";
import { Cpu, Shield, Box, TrendingUp, BarChart3, Star, Package } from "lucide-react";

const useInView = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const fadeUp = (inView, delay = 0) => ({
  opacity: inView ? 1 : 0,
  transform: inView ? "translateY(0)" : "translateY(28px)",
  transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
});

// ── Logo ─────────────────────────────────────────────────────────────────────
const ZayloLogo = ({ light = false }) => (
  <div className="flex items-center gap-2.5">
    <a href='/'>
    <img
      src="/logos/zaylo-logo.png"
      alt="Zaylo"
      className={light ? "" : "invert"}
      style={{ maxWidth: "80px" }}
    />
    </a>
  </div>
);


// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative h-screen min-h-[680px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover sm:bg-center bg-no-repeat bg-[-800px_center] transition-transform duration-700"
        style={{ backgroundImage: "url('/photos/zaylo-banner.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 text-center px-6 max-w-3xl gap-4 flex flex-col justify-center items-center" style={{ animation: "fadeUp 1s ease both" }}>

        <h1
          className="font-light text-white leading-[1.1] sm:text-6xl text-4xl font-heading"

        >
          Eleve o padrão da sua<br />curadoria pet.
        </h1>
        <p
          className="text-sm leading-loose text-white/55 max-w-md mx-auto mb-14"
          style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
        >
          Design autoral, tecnologia exclusiva e a exclusividade que seus clientes mais exigentes procuram. Seja um parceiro oficial ZAYLO.
        </p>
        <a
          href="#aplicacao"
          className="text-sm tracking-[3px] bg-[#131313] uppercase text-white border  border-white/30 max-w-max p-4 hover:border-white/70 transition-all no-underline"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Ser um revendedor premium
        </a>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
          <path d="M1 1l8 8 8-8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}



// ── Depoimento ───────────────────────────────────────────────────────────────
function Testimonial() {
  const [ref, inView] = useInView();
  return (
    <section ref={ref} className="py-28 px-12 bg-[#faf9f7] text-center">
      <div className="max-w-2xl mx-auto transition-all duration-700" style={fadeUp(inView)}>
        <div className="w-px h-12 bg-gray-400/40 mx-auto mb-10" />
        <p
          className="font-light italic leading-relaxed text-[#2c2c2a] mb-10"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(18px, 2.4vw, 26px)" }}
        >
          "A Zaylo representa o que o Brasil tem de melhor: determinação, amor e percepção de mercado.
          A sofisticação no design e o acabamento dos produtos Zaylo foram o que nos incentivou a
          disponibilizá-los em nossas lojas. Estamos felizes em fazer parte desta história desde o seu início."
        </p>
        <div className="w-8 h-px bg-gray-400 mx-auto mb-6" />
        <p
          className="text-[10px] tracking-[3px] uppercase text-[#1a1a1a] mb-1.5 font-medium"
          style={{ fontFamily: "var(--font-body)" }}
        >
          André Arias
        </p>
        <p
          className="text-[11px] tracking-wide uppercase text-[#aaa]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          CEO — Rede Smartpet
        </p>
      </div>
    </section>
  );
}

// ── Benefícios ───────────────────────────────────────────────────────────────
function Benefits() {
  const [ref, inView] = useInView();
  const items = [
    { icon: TrendingUp, label: "Margem e percepção de valor", desc: "Produtos premium que justificam preço e aumentam ticket médio." },
    { icon: Star, label: "Diferenciação no PDV", desc: "Design exclusivo que destaca sua loja da concorrência." },
    { icon: Package, label: "Curadoria simplificada", desc: "Linha enxuta, sem excesso de SKU." },
  ];
  return (
    <section ref={ref} className="py-24 px-12 bg-white">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {items.map((item, i) => (
          <div
            key={i}
            className="text-center"
            style={fadeUp(inView, i * 0.15)}
          >
            <div className="text-2xl text-gray-800 mb-5 flex justify-center">
              <item.icon size={32} strokeWidth={1.5} />
            </div>
            <p
              className="text-lg font-medium text-[#1a1a1a] mb-3 font-heading"
            >
              {item.label}
            </p>
            <p
              className="text-xs leading-loose text-[#999]"
              style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Linha de Produtos ────────────────────────────────────────────────────────
function ProductLine() {
  const [ref, inView] = useInView();
  const features = [
    { icon: Cpu, label: "Slider Handle™", sub: "Tecnologia" },
    { icon: Shield, label: "Material Atóxico", sub: "Premium" },
    { icon: Box, label: "Design Urbano", sub: "Minimalista" },
    { icon: BarChart3, label: "Alta Margem", sub: "de Contribuição" },
  ];
  return (
    <section ref={ref} className=" px-4 py-8 sm:p-12 bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16" style={fadeUp(inView)}>
          <p
            className="text-[10px] tracking-[4px] uppercase text-[#bbb] mb-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Linha de produtos
          </p>
          <h2
            className="font-light text-[#1a1a1a]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(30px, 4vw, 50px)" }}
          >
            Engenharia e estética em cada detalhe.
          </h2>
        </div>
        <div className="grid grid-cols-2 p-4 sm:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="border border-[#e8e4dc] p-8 text-center bg-white"
              style={fadeUp(inView, i * 0.1)}
            >
              <div className="w-12 h-12 border border-gray-300 mx-auto mb-6 flex items-center justify-center">
                <f.icon size={24} strokeWidth={1.5} className="text-gray-700" />
              </div>
              <p
                className="text-base font-medium text-[#1a1a1a] mb-1.5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {f.label}
              </p>
              <p
                className="text-[10px] tracking-[1px] uppercase text-[#bbb]"
                style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
              >
                {f.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Por que ZAYLO ────────────────────────────────────────────────────────────
function WhyZaylo() {
  const [ref, inView] = useInView();
  const reasons = [
    { n: "01", title: "Exclusividade Tecnológica", desc: "Apresente a Slider Handle™ e a OZY.VEST™ como inovações que justificam o ticket premium." },
    { n: "02", title: "Estética Urbana", desc: "Fuja do colorido infantil. Atraia o tutor que gasta mais e valoriza o design." },
    { n: "03", title: "Parceria Estratégica", desc: "Suporte total para o lojista, de assets de marketing à integração logística." },
  ];
  return (
    <section ref={ref} className="py-28 px-12 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-16" style={fadeUp(inView)}>
          <h2
            className="font-light text-[#1a1a1a] mb-4"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Por que ter ZAYLO na sua loja?
          </h2>
          <p
            className="text-sm text-[#999] leading-loose"
            style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
          >
            Atenda a um público mais exigente com produtos que entregam design e valor percebido.
          </p>
        </div>

        <div className="divide-y divide-[#ede9e2]">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="flex gap-9 items-start py-10"
              style={fadeUp(inView, i * 0.15)}
            >
              <span
                className="text-[10px] tracking-[2px] text-gray-500 pt-1 shrink-0"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {r.n}
              </span>
              <div>
                <p
                  className="text-lg font-medium text-[#1a1a1a] mb-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {r.title}
                </p>
                <p
                  className="text-sm leading-loose text-[#888]"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14" style={fadeUp(inView, 0.5)}>
          <a
            href="#aplicacao"
            className="inline-block bg-gray-800 text-white text-[10px] tracking-[3px] uppercase px-10 py-5 hover:bg-gray-700 transition-colors no-underline"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Quero ser parceiro
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Formulário ───────────────────────────────────────────────────────────────
function ApplicationForm() {
  const [ref, inView] = useInView();
  const [form, setForm] = useState({ nome: "", empresa: "", cidade: "", email: "", telefone: "" });
  const [sent, setSent] = useState(false);

  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const submit = () => { if (form.nome && form.empresa && form.cidade) setSent(true); };

  const fields = [
    { key: "nome",     label: "Nome",     placeholder: "Seu nome completo",              full: true  },
    { key: "empresa",  label: "Empresa",  placeholder: "Nome da loja ou empresa",        full: true  },
    { key: "cidade",   label: "Cidade",   placeholder: "Sua cidade",                     full: false },
    { key: "email",    label: "E-mail",   placeholder: "contato@suaempresa.com.br",       full: false },
    { key: "telefone", label: "Telefone", placeholder: "(11) 99999-9999",                full: true  },
  ];

  return (
    <section id="aplicacao" ref={ref} className="py-28 px-12 bg-[#1a1a18]">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-16" style={fadeUp(inView)}>
          <p
            className="text-[10px] tracking-[4px] uppercase text-white/30 mb-5"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Formulário de aplicação
          </p>
          <h2
            className="font-light text-white"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 4vw, 52px)" }}
          >
            Torne-se um parceiro ZAYLO.
          </h2>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 border border-gray-400 mx-auto mb-6 flex items-center justify-center">
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M1 7l5 5L17 1" stroke="gray" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-2xl text-white mb-3 font-heading">
              Solicitação recebida.
            </p>
            <p className="text-xs text-white/40" style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}>
              Nossa equipe entrará em contato em breve.
            </p>
          </div>
        ) : (
          <div style={fadeUp(inView, 0.2)}>
            <div className="grid grid-cols-2 gap-x-8">
              {fields.map((f) => (
                <div key={f.key} className={`mb-8 ${f.full ? "col-span-2" : "col-span-1"}`}>
                  <label
                    className="block text-[10px] tracking-[3px] uppercase text-white/35 mb-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {f.label}
                  </label>
                  <input
                    value={form[f.key]}
                    onChange={handle(f.key)}
                    placeholder={f.placeholder}
                    className="w-full bg-transparent border-b border-white/15 pb-3 text-white text-sm outline-none placeholder:text-white/20 focus:border-gray-400/50 transition-colors"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={submit}
              className="w-full py-5 border border-gray-500/30 bg-gray-800/10 text-gray-300 text-[10px] tracking-[3px] uppercase hover:bg-gray-800/20 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Enviar solicitação
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [ref, inView] = useInView();
  const [open, setOpen] = useState(null);
  const items = [
    { q: "A ZAYLO vende para qualquer loja?",      a: "Trabalhamos com um processo seletivo de parceiros. Avaliamos fit de posicionamento, localização e potencial de curadoria antes defirmar a parceria." },
    { q: "Qual o pedido mínimo?",                  a: "O pedido mínimo inicial é definido conforme o mix escolhido e o perfil da loja. Nossa equipe apresenta as condições após aprovação da candidatura." },
    { q: "A ZAYLO oferece exclusividade por região?", a: "Sim, para parceiros com alto volume e alinhamento estratégico, oferecemos proteção territorial mediante contrato específico." },
  ];
  return (
    <section ref={ref} className="py-28 px-12 bg-[#faf9f7]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16" style={fadeUp(inView)}>
          <p className="text-[10px] tracking-[4px] uppercase text-[#bbb] mb-4" style={{ fontFamily: "var(--font-body)" }}>
            Perguntas frequentes
          </p>
          <h2
            className="font-light text-[#1a1a1a]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Dúvidas comuns
          </h2>
        </div>
        <div className="divide-y divide-[#e8e4dc] border-y border-[#e8e4dc]">
          {items.map((item, i) => (
            <div key={i} style={fadeUp(inView, i * 0.1)}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center py-6 bg-transparent border-none cursor-pointer text-left"
              >
                <span
                  className="text-lg font-medium text-[#1a1a1a]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {item.q}
                </span>
                <span
                  className="text-xl text-[#bbb] ml-4 shrink-0 transition-transform duration-300"
                  style={{ transform: open === i ? "rotate(45deg)" : "none" }}
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: open === i ? "160px" : "0" }}
              >
                <p
                  className="text-sm leading-loose text-[#888] pb-6"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
                >
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="flex items-center justify-between px-4 sm:px-12 py-10
    gap-2 bg-[#0f0f0d] border-t border-white/5">
      <ZayloLogo light />
      <p className="text-[10px] text-white/25" style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}>
        © 2026 Zaylo. Todos os direitos reservados.
      </p>
      <a
        href="https://zaylo.com.br"
        className="text-xs text-white/30 hover:text-white/55 transition-colors no-underline"
        style={{ fontFamily: "var(--font-body)" }}
      >
        zaylo.com.br
      </a>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function ZayloLP() {
  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input { border-radius: 0; }
      `}</style>
      <div className="overflow-x-hidden">
       
        <Hero />
        
        <Testimonial />
        <Benefits />
        <ProductLine />
        <WhyZaylo />
        <ApplicationForm />
        <FAQ />
        <Footer />
      </div>
    </>
  );
}