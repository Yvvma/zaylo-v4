export type ProductVariant = {
  color: string;
  images: string[];
  sku?: string;
  sizes?: string[];
};

export type ShippingSpecs = {
  weight: number; // in kg
  width: number;
  height: number;
  length: number;
};

export function calculatePackageDimensions(items: Array<{ slug?: string; selectedSize?: string; quantity: number }>) {
  let maxWidth = 0;
  let maxHeight = 0;
  let totalLength = 0;

  for (const item of items) {
    if (!item.slug) {
      maxWidth = Math.max(maxWidth, 15);
      maxHeight = Math.max(maxHeight, 10);
      totalLength += 5 * item.quantity;
      continue;
    }
    const specs = getShippingSpecs(item.slug, item.selectedSize);
    maxWidth = Math.max(maxWidth, specs.width);
    maxHeight = Math.max(maxHeight, specs.height);
    totalLength += specs.length * item.quantity;
  }

  // Minimums for Correios
  maxWidth = Math.max(maxWidth, 15);
  maxHeight = Math.max(maxHeight, 10);
  totalLength = Math.max(totalLength, 2);

  return { width: maxWidth, height: maxHeight, length: totalLength };
}

export const getShippingSpecs = (slug: string, size?: string): ShippingSpecs => {
  const specs: Record<string, Record<string, ShippingSpecs>> = {
    "bungee-harness": {
      "PP": { weight: 0.060, width: 21, height: 9, length: 3 },
      "P": { weight: 0.080, width: 21, height: 9, length: 3 },
      "M": { weight: 0.115, width: 21, height: 9, length: 3 },
      "G": { weight: 0.195, width: 21, height: 9, length: 3 },
    },
    "bungee-harness-no-pull": {
      "PP": { weight: 0.060, width: 21, height: 9, length: 3 },
      "P": { weight: 0.080, width: 21, height: 9, length: 3 },
      "M": { weight: 0.115, width: 21, height: 9, length: 3 },
      "G": { weight: 0.195, width: 21, height: 9, length: 3 },
    },
    "leash": {
      "Único": { weight: 0.165, width: 22, height: 16, length: 3 },
    },
    "double-leash": {
      "Único": { weight: 0.280, width: 22, height: 16, length: 3 },
    },
    "freedom-leash": {
      "Único": { weight: 0.305, width: 24, height: 16, length: 3 },
    },
    "bungee-leash": {
      "Único": { weight: 0.240, width: 12, height: 22.5, length: 3 },
    },
    "ozy-vest": {
      "XS": { weight: 0.225, width: 20, height: 11, length: 3 },
      "S": { weight: 0.220, width: 21.5, height: 11, length: 3 },
      "M": { weight: 0.300, width: 25.5, height: 11, length: 3 },
      "L": { weight: 0.340, width: 28, height: 11, length: 3 },
      "XL": { weight: 0.350, width: 32, height: 11, length: 3 },
    },
    "steel-bowl": {
      "Único": { weight: 0.250, width: 15, height: 15, length: 5 },
    },
  };

  const productSpecs = specs[slug];
  if (!productSpecs) {
    return { weight: 0.3, width: 15, height: 10, length: 5 }; // default
  }

  const sizeKey = size || Object.keys(productSpecs)[0];
  return productSpecs[sizeKey] || Object.values(productSpecs)[0];
};

export type Product = {
  id: number;
  slug: string;
  title: string;
  price: number;
  category: string;
  mainImg: string;
  subcategory?: string;
  description?: string;
  technicalSheet?: string;
  variants?: ProductVariant[];
};

export const products: Product[] = [
  
  {
    id: 2,
    slug: "ozy-vest",
    title: "Ozy.Vest",
    price: 279.00,
    category: "Peitoral",
    mainImg: "/products/ozy-vest/black-lemon/01.webp",
    variants: [
      {
        color: "Black Lemon",
        images: [
          "/products/ozy-vest/black-lemon/01.webp",
          "/products/ozy-vest/black-lemon/02.webp",
          "/products/ozy-vest/black-lemon/03.webp",
          "/products/ozy-vest/black-lemon/04.webp",
          "/products/ozy-vest/black-lemon/05.webp",
          "/products/ozy-vest/black-lemon/06.webp",
          "/products/ozy-vest/black-lemon/07.webp",
          "/products/ozy-vest/black-lemon/08.webp"
        ],
        sku: "OZY-BLK/LMN",
        sizes: ["XS", "S", "M", "L", "XL"]
      },
      {
        color: "Candy",
        images: [
          "/products/ozy-vest/candy/01.webp",
          "/products/ozy-vest/candy/02.webp",
          "/products/ozy-vest/candy/03.webp",
          "/products/ozy-vest/candy/04.webp",
          "/products/ozy-vest/candy/05.webp",
          "/products/ozy-vest/candy/06.webp",
          "/products/ozy-vest/candy/07.webp"
        ],
        sku: "OZY-CND",
        sizes: ["XS", "S", "M", "L", "XL"]
      },
      {
        color: "Space Gray",
        images: [
          "/products/ozy-vest/space-gray/01.webp",
          "/products/ozy-vest/space-gray/02.webp",
          "/products/ozy-vest/space-gray/03.webp",
          "/products/ozy-vest/space-gray/04.webp",
          "/products/ozy-vest/space-gray/05.webp",
          "/products/ozy-vest/space-gray/06.webp",
          "/products/ozy-vest/space-gray/07.webp",
          "/products/ozy-vest/space-gray/08.webp"
        ],
        sku: "OZY-SPC/GRY",
        sizes: ["XS", "S", "M", "L", "XL"]
      },
      {
        color: "Space Rose",
        images: [
          "/products/ozy-vest/space-rose/01.webp",
          "/products/ozy-vest/space-rose/02.webp",
          "/products/ozy-vest/space-rose/03.webp",
          "/products/ozy-vest/space-rose/04.webp",
          "/products/ozy-vest/space-rose/05.webp"
        ],
        sku: "OZY-SPC/ROSE",
        sizes: ["XS", "S", "M", "L", "XL"]
      },
      {
        color: "Zaylo White",
        images: [
          "/products/ozy-vest/zaylo-white/01.webp",
          "/products/ozy-vest/zaylo-white/02.webp",
          "/products/ozy-vest/zaylo-white/03.webp",
          "/products/ozy-vest/zaylo-white/04.webp",
          "/products/ozy-vest/zaylo-white/05.webp"
        ],
        sku: "OZY-ZYL/WHT",
        sizes: ["XS", "S", "M", "L", "XL"]
      }
    ],
    description: `O mais alto nível em conforto, segurança e acabamento.
O OZY.VEST é construído em nylon impermeável ultra premium, com fitas de poliéster
também impermeáveis e ferragens em liga de zinco com tratamento antioxidante e
anticorrosivo.
O interior em neoprene e os acabamentos emborrachados no peito e na alça elevam o nível de
conforto e sofisticação.
Sua estrutura foi projetada para que toda a tração seja distribuída pelo peito, garantindo
máxima segurança e conforto durante o passeio.
Sem dúvida, um dos peitorais mais seguros e sofisticados do mercado.`,
    technicalSheet: `• Material: Nylon impermeável ultra premium + Neoprene
• Ferragens: Liga de zinco com tratamento antioxidante
• Acabamentos: Emborrachados no peito e alças
• Tamanhos: XS, S, M, L, XL
• Peso: Varia conforme tamanho
• Impermeável: Sim
• Ajustes: Laterais e peito
• Segurança: Distribuição de tração no peito
• Limpeza: Lavar com água morna e sabão neutro`,
  },
  {
    id: 3,
    slug: "leash",
    title: "Leash",
    price: 169.00,
    category: "Coleira",
    mainImg: "/products/leash/black-lemon/01.webp",
    description: `Força estrutural, precisão no controle e estética minimalista.

A Leash ZAYLO é construída em corda de nylon e poliéster ultra resistentes, com um design contínuo que elimina costuras — aumentando significativamente a durabilidade e a segurança.

O slider em TPU (borracha não tóxica) permite ajuste firme da pegada, enquanto os acabamentos em nylon trazem um visual limpo, sofisticado e funcional.

O exclusivo mosquetão ZAYLO em liga de zinco, com tratamento antioxidante e anticorrosivo, conta com mola de pressão e foi testado em máquina de tração, suportando até 300kg de força.

Design único e exclusivo ZAYLO®.`,
    technicalSheet: `• Material da corda: Nylon + Poliéster de alta resistência
• Construção: Sem costuras ou emendas
• Slider: TPU não tóxico
• Mosquetão: Liga de zinco (antioxidante e anticorrosivo)
• Resistência: Até 300kg de força
• Indicação: Uso diário e controle preciso`,
    variants: [
      {
        color: "Black Lemon",
        images: [
          "/products/leash/black-lemon/01.webp",
          "/products/leash/black-lemon/02.webp",
          "/products/leash/black-lemon/03.webp",
          "/products/leash/black-lemon/04.webp",
          "/products/leash/black-lemon/05.webp"
        ],
        sku: "LEASH-BLK/LMN",
        sizes: ["Único"]
      },
      {
        color: "Candy",
        images: [
          "/products/leash/candy/01.webp",
          "/products/leash/candy/02.webp",
          "/products/leash/candy/03.webp",
          "/products/leash/candy/04.webp"
        ],
        sku: "LEASH-CND",
        sizes: ["Único"]
      },
      {
        color: "Space Gray",
        images: [
          "/products/leash/space-gray/01.webp",
          "/products/leash/space-gray/02.webp",
          "/products/leash/space-gray/03.webp",
          "/products/leash/space-gray/04.webp"
        ],
        sku: "LEASH-SPC/GRY",
        sizes: ["Único"]
      },
      {
        color: "Space Rose",
        images: [
          "/products/leash/space-rose/01.webp",
          "/products/leash/space-rose/02.webp",
          "/products/leash/space-rose/03.webp"
        ],
        sku: "LEASH-SPC/ROSE",
        sizes: ["Único"]
      },
      {
        color: "Zaylo White",
        images: [
          "/products/leash/zaylo-white/01.webp",
          "/products/leash/zaylo-white/02.webp",
          "/products/leash/zaylo-white/03.webp"
        ],
        sku: "LEASH-ZYL/WHT",
        sizes: ["Único"]
      }
    ]
  },
  {
    id: 4,
    slug: "double-leash",
    title: "Double Leash",
    price: 219.00,
    category: "Coleira",
    mainImg: "/products/double-leash/black-lemon/01.webp",
    description: `Controle absoluto, mesmo com dois.

A Double Leash ZAYLO mantém toda a robustez e sofisticação da linha, agora adaptada para condução simultânea de dois cães.

Sua estrutura em corda contínua sem emendas percorre toda a peça, criando dois pontos de engate independentes com máxima resistência.

O slider em TPU no punho garante ajuste firme e segurança na pegada, mesmo em situações de maior tração.

Mais controle, mais equilíbrio, mais fluidez no passeio.`,
    technicalSheet: `• Material: Nylon + Poliéster ultra resistentes
• Construção: Corda única sem emendas
• Sistema: Dupla conexão para dois cães
• Slider: TPU não tóxico para ajuste de pegada
• Mosquetões: Liga de zinco com alta resistência
• Indicação: Passeio com dois cães`,
    variants: [
      {
        color: "Black Lemon",
        images: [
          "/products/double-leash/black-lemon/01.webp",
          "/products/double-leash/black-lemon/02.webp",
          "/products/double-leash/black-lemon/03.webp"
        ],
        sku: "DBL-LEASH-BLK/LMN",
        sizes: ["Único"]
      },
      {
        color: "Candy",
        images: [
          "/products/double-leash/candy/01.webp",
          "/products/double-leash/candy/02.webp",
          "/products/double-leash/candy/03.webp"
        ],
        sku: "DBL-LEASH-CND",
        sizes: ["Único"]
      },
      {
        color: "Zaylo White",
        images: [
          "/products/double-leash/zaylo-white/01.webp",
          "/products/double-leash/zaylo-white/02.webp",
          "/products/double-leash/zaylo-white/03.webp"
        ],
        sku: "DBL-LEASH-ZYL/WHT",
        sizes: ["Único"]
      }
    ]
  },
  {
    id: 5,
    slug: "bungee-harness",
    title: "Bungee Harness",
    price: 189.00,
    category: "Peitoral",
    mainImg: "/products/bungee-harness/black-yellow/01.webp",
    description: `Menos impacto. Mais fluidez.

A Bungee Leash ZAYLO combina a resistência da corda com um sistema elástico de poliéster de alta performance, projetado para absorver impactos durante puxões.

O elástico é integrado através da tecnologia overmolding, com componentes desenvolvidos do zero pelo time ZAYLO, garantindo máxima segurança e durabilidade mesmo sob alta carga.

O resultado é um passeio mais confortável, controlado e sem trancos.`,
    technicalSheet: `• Material: Corda em nylon + poliéster
• Sistema: Elástico amortecedor de alta resistência
• Tecnologia: Overmolding (integração estrutural)
• Mosquetão: Liga de zinco reforçada
• Benefício: Redução de impacto e tração
• Indicação: Cães ativos ou que puxam`,
    variants: [
      {
        color: "Black Yellow",
        images: [
          "/products/bungee-harness/black-yellow/01.webp",
          "/products/bungee-harness/black-yellow/02.webp"
        ],
        sku: "BNG-HARN-BLK/YLW",
        sizes: ["M", "L"]
      },
      {
        color: "Candy",
        images: [
          "/products/bungee-harness/candy/01.webp",
          "/products/bungee-harness/candy/02.webp"
        ],
        sku: "BNG-HARN-CND",
        sizes: [ "M", "L"]
      },
      {
        color: "Zaylo White",
        images: [
          "/products/bungee-harness/zaylo-white/01.webp",
          "/products/bungee-harness/zaylo-white/02.webp"
        ],
        sku: "BNG-HARN-ZYL/WHT",
        sizes: ["M", "L"]
      }
    ]
  },
  {
    id: 6,
    slug: "freedom-leash",
    title: "Freedom Leash",
    price: 259.99,
    category: "Coleira",
    mainImg: "/products/freedom-leash/black-lemon/01.webp",
    description: `Liberdade em movimento.

A Freedom Leash foi criada para quem vive em movimento e precisa de uma guia que acompanhe esse ritmo.

Extremamente versátil, pode ser utilizada na cintura, no tronco, como guia tradicional ou longa, com comprimento de até 2,40m.

Construída com os mesmos materiais premium da linha — corda ultra resistente, componentes em nylon e mosquetão em liga de zinco — traz ainda o exclusivo sistema:

Z-Shaped ZAYLO: regulador inspirado em equipamentos de alpinismo, que permite ajuste preciso do comprimento.
Freedom Hook: sistema de ancoragem que possibilita prender o cão em qualquer estrutura sem necessidade de nós e sem desconectar o mosquetão.

Uma guia, múltiplas possibilidades.`,
    technicalSheet: `• Comprimento: Até 2,40m
• Uso: Mãos livres, cintura, transversal ou tradicional
• Material: Nylon + Poliéster de alta resistência
• Mosquetão: Liga de zinco
• Sistema: Z-Shaped ajustável + Freedom Hook
• Diferencial: Versatilidade total sem perda de controle`,
    variants: [
      {
        color: "Black Lemon",
        images: [
          "/products/freedom-leash/black-lemon/01.webp",
          "/products/freedom-leash/black-lemon/02.webp",
          "/products/freedom-leash/black-lemon/03.webp",
          "/products/freedom-leash/black-lemon/04.webp"
        ],
        sku: "FRED-LEASH-BLK/LMN",
        sizes: ["Único"]
      },
      {
        color: "Candy",
        images: [
          "/products/freedom-leash/candy/01.webp",
          "/products/freedom-leash/candy/02.webp",
          "/products/freedom-leash/candy/03.webp",
          "/products/freedom-leash/candy/04.webp"
        ],
        sku: "FRED-LEASH-CND",
        sizes: ["Único"]
      },
      {
        color: "Space Gray",
        images: [
          "/products/freedom-leash/space-gray/01.webp",
          "/products/freedom-leash/space-gray/02.webp",
          "/products/freedom-leash/space-gray/03.webp",
          "/products/freedom-leash/space-gray/04.webp",
          "/products/freedom-leash/space-gray/05.webp"
        ],
        sku: "FRED-LEASH-SPC/GRY",
        sizes: ["Único"]
      },
      {
        color: "Space Rose",
        images: [
          "/products/freedom-leash/space-rose/01.webp",
          "/products/freedom-leash/space-rose/02.webp",
          "/products/freedom-leash/space-rose/03.webp",
          "/products/freedom-leash/space-rose/04.webp",
          "/products/freedom-leash/space-rose/05.webp"
        ],
        sku: "FRED-LEASH-SPC/ROSE",
        sizes: ["Único"]
      },
      {
        color: "Zaylo White",
        images: [
          "/products/freedom-leash/zaylo-white/01.webp",
          "/products/freedom-leash/zaylo-white/02.webp",
          "/products/freedom-leash/zaylo-white/03.webp"
        ],
        sku: "FRED-LEASH-ZYL/WHT",
        sizes: ["Único"]
      }
    ]
  },
  {
    id: 7,
    slug: "bungee-harness-no-pull",
    title: "Bungee Harness No Pull",
    price: 189.00,
    category: "Peitoral",
    mainImg: "/products/bungee-harness-no-pull/black-lemon/01.webp",
    description: `Controle inteligente com dupla função.

O Bungee Harness No Pull mantém toda a tecnologia de amortecimento do modelo original e adiciona um engate frontal antipuxão, oferecendo uma segunda opção de condução.

Permite escolher entre:

uso com amortecimento (alça bungee)
ou uso com controle direcional (engate frontal)

A alça elástica também pode ser utilizada como elemento de segurança adicional.

Mais controle, mais versatilidade, mais eficiência no passeio.`,
    technicalSheet: `• Material: Poliéster + neoprene
• Sistema: Bungee + engate frontal antipuxão
• Anel: Liga de zinco 180º
• Estrutura: Ergonômica e resistente
• Indicação: Cães que puxam
• Tamanhos: M e L (G)`,
    variants: [
      {
        color: "Black Lemon",
        images: [
          "/products/bungee-harness-no-pull/black-lemon/01.webp",
          "/products/bungee-harness-no-pull/black-lemon/02.webp",
        ],
        sku: "BNG-HARN-NP-BLK/LMN",
        sizes: ["M", "L"]
      },
      {
        color: "Candy",
        images: [
          "/products/bungee-harness-no-pull/candy/01.webp",
          "/products/bungee-harness-no-pull/candy/02.webp"
        ],
        sku: "BNG-HARN-NP-CND",
        sizes: ["M", "L"]
      },
      {
        color: "Zaylo White",
        images: [
          "/products/bungee-harness-no-pull/zaylo-white/01.webp",
          "/products/bungee-harness-no-pull/zaylo-white/02.webp"
        ],
        sku: "BNG-HARN-NP-ZYL/WHT",
        sizes: ["M", "L"]
      }
    ]
  },
];