import { CHALLENGES } from "../../data/players";
import { CareerRow } from "./CareerRow";

import "./Game.css";
import { PlayerImage } from "./playerImage";

export function Game() {
  const challenge = CHALLENGES[0];

  const revealedCount = 2;
  const revealedClubs = challenge.career.slice(0, revealedCount);

  return (
    <main className="game">
      <div className="bgDecor" aria-hidden="true" />

      <div className="gameCard">
        <div className="game-content">
          <h1>Guess the Player</h1>

          <PlayerImage
            src={challenge.image}
            alt="Misterious player"
            blurPx={25}
            width="50%"
          />

          <CareerRow clubs={revealedClubs} />
        </div>
      </div>
    </main>
  );
}