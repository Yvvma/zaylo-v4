export type BlingProduto = {
  id: number;
  nome: string;
};

export const blingProdutos: BlingProduto[] = [
  { id: 16593580007, nome: "STEEL BOWL" },
  { id: 16593585075, nome: "STEEL BOWL BLACK S" },
  { id: 16593585105, nome: "STEEL BOWL BLACK L" },
  { id: 16593585116, nome: "STEEL BOWL ROSÉ S" },
  { id: 16593585133, nome: "STEEL BOWL ROSÉ L" },
  { id: 16598629461, nome: "Steel Bowl Rosé G | KIT 2 unidades" },
  { id: 16593493350, nome: "Peitoral OZY.VEST" },
  { id: 16593502223, nome: "Peitoral OZY.VEST ZAYLO XS" },
  { id: 16593502231, nome: "Peitoral OZY.VEST ZAYLO S" },
  { id: 16593502237, nome: "Peitoral OZY.VEST ZAYLO M" },
  { id: 16593502250, nome: "Peitoral OZY.VEST ZAYLO L" },
  { id: 16593502263, nome: "Peitoral OZY.VEST ZAYLO XL" },
  { id: 16593502149, nome: "Peitoral OZY.VEST CANDY XS" },
  { id: 16593502172, nome: "Peitoral OZY.VEST CANDY S" },
  { id: 16593502186, nome: "Peitoral OZY.VEST CANDY M" },
  { id: 16593502199, nome: "Peitoral OZY.VEST CANDY L" },
  { id: 16593502208, nome: "Peitoral OZY.VEST CANDY XL" },
  { id: 16593502277, nome: "Peitoral OZY.VEST BLACK LEMON XS" },
  { id: 16593502288, nome: "Peitoral OZY.VEST BLACK LEMON S" },
  { id: 16593502298, nome: "Peitoral OZY.VEST BLACK LEMON M" },
  { id: 16593502309, nome: "Peitoral OZY.VEST BLACK LEMON L" },
  { id: 16593502318, nome: "Peitoral OZY.VEST BLACK LEMON XL" },
  { id: 16593502332, nome: "Peitoral OZY.VEST SPACE ROSE XS" },
  { id: 16593502346, nome: "Peitoral OZY.VEST SPACE ROSE S" },
  { id: 16593502358, nome: "Peitoral OZY.VEST SPACE ROSE M" },
  { id: 16593502369, nome: "Peitoral OZY.VEST SPACE ROSE L" },
  { id: 16593502378, nome: "Peitoral OZY.VEST SPACE ROSE XL" },
  { id: 16593502390, nome: "Peitoral OZY.VEST SPACE GRAY XS" },
  { id: 16593502400, nome: "Peitoral OZY.VEST SPACE GRAY S" },
  { id: 16593502408, nome: "Peitoral OZY.VEST SPACE GRAY M" },
  { id: 16593502421, nome: "Peitoral OZY.VEST SPACE GRAY L" },
  { id: 16593502437, nome: "Peitoral OZY.VEST SPACE GRAY XL" },
  { id: 16593313438, nome: "Guia Slider Handle" },
  { id: 16593357347, nome: "Guia Slider Handle CANDY" },
  { id: 16593357353, nome: "Guia Slider Handle ZAYLO (Cinza)" },
  { id: 16593357362, nome: "Guia Slider Handle BLACK LEMON" },
  { id: 16593428035, nome: "Guia Slider Handle SPACE ROSE" },
  { id: 16593428043, nome: "Guia Slider Handle SPACE GRAY" },
  { id: 16593437563, nome: "Double Leash" },
  { id: 16593453754, nome: "Double Leash CANDY" },
  { id: 16593453763, nome: "Double Leash ZAYLO" },
  { id: 16593453765, nome: "Double Leash BLACK LEMON" },
  { id: 16593387135, nome: "Bungee Leash" },
  { id: 16593395347, nome: "Bungee Leash CANDY" },
  { id: 16593395362, nome: "Bungee Leash ZAYLO" },
  { id: 16593395420, nome: "Bungee Leash BLACK LEMON" },
  { id: 16593409179, nome: "Freedom Leash" },
  { id: 16593421003, nome: "Freedom Leash CANDY" },
  { id: 16593421010, nome: "Freedom Leash ZAYLO" },
  { id: 16593421018, nome: "Freedom Leash BLACK LEMON" },
  { id: 16593421035, nome: "Freedom Leash SPACE ROSE" },
  { id: 16593421051, nome: "Freedom Leash SPACE GRAY" },
  { id: 16600527142, nome: "BUNGEE HARNESS" },
  { id: 16600532065, nome: "BUNGEE HARNESS ZAYLO XS" },
  { id: 16600532071, nome: "BUNGEE HARNESS ZAYLO S" },
  { id: 16600532080, nome: "BUNGEE HARNESS BLACK LEMON XS" },
  { id: 16600532087, nome: "BUNGEE HARNESS BLACK LEMON S" },
  { id: 16600532094, nome: "BUNGEE HARNESS CANDY XS" },
  { id: 16600532103, nome: "BUNGEE HARNESS CANDY S" },
  { id: 16600535697, nome: "BUNGEE HARNESS NO PULL" },
  { id: 16600537470, nome: "BUNGEE HARNESS NO PULL ZAYLO M" },
  { id: 16600537482, nome: "BUNGEE HARNESS NO PULL ZAYLO L" },
  { id: 16600537494, nome: "BUNGEE HARNESS NO PULL BLACK LEMON M" },
  { id: 16600537498, nome: "BUNGEE HARNESS NO PULL BLACK LEMON L" },
  { id: 16600537506, nome: "BUNGEE HARNESS NO PULL CANDY M" },
  { id: 16600537514, nome: "BUNGEE HARNESS NO PULL CANDY L" },
];

const nomeCor: Record<string, string> = {
  "Black Lemon": "BLACK LEMON",
  "Black Yellow": "BLACK LEMON",
  "Candy": "CANDY",
  "Space Gray": "SPACE GRAY",
  "Space Rose": "SPACE ROSE",
  "Zaylo White": "ZAYLO",
  "Rose": "ROSÉ",
  "Black": "BLACK",
  "Preto": "BLACK",
  "Rosa": "ROSÉ",
};

const nomeSlug: Record<string, string> = {
  "steel-bowl": "STEEL BOWL",
  "ozy-vest": "Peitoral OZY.VEST",
  "leash": "Guia Slider Handle",
  "double-leash": "Double Leash",
  "bungee-leash": "Bungee Leash",
  "bungee-harness": "BUNGEE HARNESS",
  "bungee-harness-no-pull": "BUNGEE HARNESS NO PULL",
  "freedom-leash": "Freedom Leash",
};

// Mapeamento de tamanhos internos → Bling
// Bowl "Único" é tratado como "L" em buscarBlingId (caso especial)
const tamanhoBling: Record<string, string> = {
  "PP": "XS",
  "P": "S",
  "M": "M",
  "G": "L",
  "GG": "XL",
  "Único": "",
};

export function buscarBlingId(slug: string, cor?: string, tamanho?: string): number | null {
  const nomeBase = nomeSlug[slug];
  if (!nomeBase) return null;

  const corBling = cor ? nomeCor[cor] : null;
  // Bowl: "Único" → L (Bling só tem S/L, e o padrão é L)
  let tamInterno = tamanho;
  if (slug === "steel-bowl" && tamInterno === "Único") tamInterno = "L";
  const tamBling = tamInterno ? (tamanhoBling[tamInterno] ?? tamInterno) : null;

  // Tenta: nome + cor + tamanho
  if (corBling && tamBling) {
    const candidate = `${nomeBase} ${corBling} ${tamBling}`;
    const found = blingProdutos.find(p => p.nome === candidate);
    if (found) return found.id;
  }

  // Tenta: nome + cor (sem tamanho)
  if (corBling) {
    const candidate = `${nomeBase} ${corBling}`;
    const found = blingProdutos.find(p => p.nome === candidate);
    if (found) return found.id;
  }

  // Tenta: nome genérico
  const found = blingProdutos.find(p => p.nome === nomeBase);
  if (found) return found.id;

  return null;
}
