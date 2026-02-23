import { CHALLENGES } from "../../data/players";
import { CareerRow } from "./CareerRow";
import { useMemo, useState } from "react";
import "./Game.css";
import { PlayerImage } from "./PlayerImage";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from 'lucide-react';
import { Check } from "lucide-react"; 





export function Game() {
  const challenge = CHALLENGES[0];


  const initialBlur = 25;

  const decreaseBlur = initialBlur / challenge.career.length - 1;

  const [revealedCount, setRevealedCount] = useState(1);

  const [guessed, setGuessed] = useState(false);

  const [blurPx, setBlurPx] = useState(initialBlur);

  const revealedClubs = useMemo(() => {
    return challenge.career.slice(0, revealedCount);
  }, [challenge.career, revealedCount]);

  const [decreaseBlurEnabled, setDecreaseBlurEnabled] = useState(true);

    function handleWrong() {
    setRevealedCount((prev) => (prev + 1));

    setBlurPx((prev) => Math.max(prev - decreaseBlur, 0));
  }


  const isMaxRevealed = revealedCount >= challenge.career.length + 1;

  



  return (
    <main className="game">
      <div className="bgDecor" aria-hidden="true" />

      <div className="gameCard">
        <div className="game-content">
          <div className="header">
            <h1 className="gameTitle">Guess the Player</h1>
            <div className="switchRow">
              <Switch id="decrease-blur" checked={decreaseBlurEnabled} onCheckedChange={setDecreaseBlurEnabled} />
              <Label htmlFor="decrease-blur">Decrease Blur</Label>
            </div>
          </div>

          <PlayerImage
            src={challenge.image}
            alt="Misterious player"
            blurPx={guessed ? 0 : isMaxRevealed ? 0 : decreaseBlurEnabled ? blurPx : initialBlur}
            width="50%"
          />

          <CareerRow clubs={revealedClubs} />

          {!guessed 
          ? ( 
              !isMaxRevealed ? (
                                <button
                                  className="wrongBtn"
                                  type="button"
                                  onClick={handleWrong}
                                  disabled={isMaxRevealed && blurPx === 0}
                                >
                                  Errei (provisório)
                                </button>
              ) : (
              <div className="gameOver">
                <X className="wrongIcon" size={64} color="#FF746C" />
                <h1 className="wrongText">The player was {challenge.name}</h1>
              </div>
            
            )
          )
          : (
              <div className="guessed">
                <Check className="correctIcon" size={64} color="#4BBF73" />
                <h1 className="guessedText">Congrats! The player is {challenge.name}</h1>
              </div>
             )}

          <small className="debugText">
            revelados: {revealedCount}/{challenge.career.length} — blur: {blurPx}px {isMaxRevealed ? "true" : "false"}
          </small>
        </div>
      </div>
    </main>
  );
}