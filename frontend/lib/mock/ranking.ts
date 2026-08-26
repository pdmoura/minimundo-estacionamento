export type ItemRanking = {
  posicao: number;
  setorId: string;
  nome: string;
  totalReservas: number;
};

const RANKING_MOCK: ItemRanking[] = [
  { posicao: 1, setorId: "1", nome: "Setor Central", totalReservas: 87 },
  { posicao: 2, setorId: "2", nome: "Setor Norte", totalReservas: 64 },
  { posicao: 3, setorId: "3", nome: "Setor Sul", totalReservas: 43 },
  { posicao: 4, setorId: "4", nome: "Setor Leste", totalReservas: 21 },
];

const LATENCIA_MS = 300;

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), LATENCIA_MS));
}

export async function obterRanking(): Promise<ItemRanking[]> {
  return atraso([...RANKING_MOCK]);
}
