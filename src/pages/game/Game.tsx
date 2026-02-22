import { CHALLENGES } from "../../data/players";
import { CareerRow } from "./CareerRow";
import { useMemo, useState } from "react";
import "./Game.css";
import { PlayerImage } from "./PlayerImage";

export function Game() {
  const challenge = CHALLENGES[0];


  const initialBlur = 25;
  const decreaseBlur = initialBlur / challenge.career.length - 1;
  const [revealedCount, setRevealedCount] = useState(1);
  const [blurPx, setBlurPx] = useState(initialBlur);
  const revealedClubs = useMemo(() => {
    return challenge.career.slice(0, revealedCount);
  }, [challenge.career, revealedCount]);

    function handleWrong() {
    setRevealedCount((prev) => Math.min(prev + 1, challenge.career.length));

    setBlurPx((prev) => Math.max(prev - decreaseBlur, 0));
  }

  const isMaxRevealed = revealedCount >= challenge.career.length;



  return (
    <main className="game">
      <div className="bgDecor" aria-hidden="true" />

      <div className="gameCard">
        <div className="game-content">
          <h1 className="gameTitle">Guess the Player</h1>

          <PlayerImage
            src={challenge.image}
            alt="Misterious player"
            blurPx={blurPx}
            width="50%"
          />

          <CareerRow clubs={revealedClubs} />

                    <button
            className="wrongBtn"
            type="button"
            onClick={handleWrong}
            disabled={isMaxRevealed && blurPx === 0}
          >
            Errei (provisório)
          </button>

          <small className="debugText">
            revelados: {revealedCount}/{challenge.career.length} — blur: {blurPx}px
          </small>
        </div>
      </div>
    </main>
  );
}