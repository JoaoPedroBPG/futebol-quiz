export type Club = {
  name: string;
  crest: string; // URL do escudo
};

export type PlayerChallenge = {
  id: string;
  name: string;
  image: string; // URL da imagem do jogador
  career: Club[]; // ordem: atual -> anteriores
};

export const CHALLENGES: PlayerChallenge[] = [
  {
    id: "luka-modric",
    name: "Luka Modrić",
    image: "https://img.a.transfermarkt.technology/portrait/big/27992-1687776160.jpg?lm=1",
    career: [
      {
        name: "Real Madrid",
        crest: "https://assets.football-logos.cc/logos/spain/700x700/real-madrid.81d3d699.png",
      },
      {
        name: "Tottenham",
        crest: "https://assets.football-logos.cc/logos/england/700x700/tottenham.dded87dc.png",
      },
      {
        name: "Dinamo Zagreb",
        crest: "https://assets.football-logos.cc/logos/croatia/700x700/dinamo-zagreb.75127779.png",
      },
      {
        name: "Zrinjski Mostar",
        crest: "https://assets.football-logos.cc/logos/bosnia-and-herzegovina/700x700/zrinjski.72e71246.png",
      },
    ],
  },
];