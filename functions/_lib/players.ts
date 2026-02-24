import playersRaw from "../../data/players.json";

export type Club = { name: string; crest: string };
export type Player = {
  id: string;
  name: string;
  photo: string;
  clubs: Club[]; // do atual -> antigo
};

export const players = playersRaw as Player[];

export function normalizeName(input: string): string {
      // remove acentos + baixa caixa + remove pontuação básica
      return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}