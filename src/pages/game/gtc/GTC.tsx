/* eslint-disable @typescript-eslint/no-explicit-any */
import { CareerRow } from "./CareerRow";
import { useEffect, useMemo, useState } from "react";
import "./Gtc.css";
import { PlayerImage } from "./PlayerImage";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";

type Club = { name: string; crest: string };

type Challenge = {
  id: string | number;
  name: string;
  image: string;
  career: Club[];
};

export function GTC() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const initialBlur = 25;

  const [revealedCount, setRevealedCount] = useState(1);
  const [guessed, setGuessed] = useState(false);
  const [blurPx, setBlurPx] = useState(initialBlur);
  const [decreaseBlurEnabled, setDecreaseBlurEnabled] = useState(true);

  const FINAL_EXTRA_CHANCES = 3;
  const [finalChancesLeft, setFinalChancesLeft] = useState(FINAL_EXTRA_CHANCES);

  const careerLen = challenge?.career?.length ?? 0;
  const blurStep = careerLen > 1 ? initialBlur / careerLen : initialBlur;

  const revealedClubs = useMemo(() => {
    return (challenge?.career ?? []).slice(0, revealedCount);
  }, [challenge?.career, revealedCount]);

  const isMaxRevealed = careerLen > 0 ? revealedCount >= careerLen : false;

  const inFinalPhase = isMaxRevealed;

  useEffect(() => {
    fetch("/api/challenge?mode=unlimited")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const normalized: Challenge = {
          id: data.id,
          name: data.name,
          image: data.image,
          career: (data.career ?? []).map((c: any) =>
            typeof c === "string"
              ? { name: c, crest: "/crests/default.png" }
              : { name: c.name, crest: c.crest }
          ),
        };

        setChallenge(normalized);
        setRevealedCount(1);
        setGuessed(false);
        setBlurPx(initialBlur);

        setFinalChancesLeft(FINAL_EXTRA_CHANCES);
      })
      .catch((e) => console.error("Failed to load challenge:", e));
  }, []);

  if (!challenge) return <div style={{ padding: 20 }}>Loading...</div>;

  function handleWrong() {
    if (guessed) return;

    if (inFinalPhase) {
      setFinalChancesLeft((prev) => Math.max(prev - 1, 0));
      return;
    }

    setRevealedCount((prev) => Math.min(prev + 1, careerLen));

    if (decreaseBlurEnabled) {
      setBlurPx((prev) => Math.max(prev - blurStep, 0));
    }
  }

  const isGameOver = !guessed && inFinalPhase && finalChancesLeft <= 0;

  const effectiveBlur = guessed
    ? 0
    : !finalChancesLeft 
      ? 0 : inFinalPhase
        ? 8.5 
        : !decreaseBlurEnabled
          ? initialBlur
            : blurPx > 8.5 ? blurPx : 8.5;

  return (
    <main className="game">
      <div className="bgDecor" aria-hidden="true" />

      <div className="gameCard">
        <div className="game-content">
          <div className="header">
            <h1 className="gameTitle">Guess the Player</h1>

            <div className="switchRow">
              <Switch
                id="decrease-blur"
                checked={decreaseBlurEnabled}
                onCheckedChange={setDecreaseBlurEnabled}
              />
              <Label htmlFor="decrease-blur">Decrease Blur</Label>
            </div>
          </div>

          <PlayerImage
            src={challenge.image}
            alt="Mysterious player"
            blurPx={effectiveBlur}
            width="50%"
          />

          <CareerRow clubs={revealedClubs} />

          {!guessed ? (
            !isGameOver ? (
              <>
                <button className="wrongBtn" type="button" onClick={handleWrong}>
                  Errei (provisório)
                </button>

                <button className="rightBtn" type="button" onClick={() => setGuessed(true)}>
                  Acertei!
                </button>

                {inFinalPhase && (
                  <small className="debugText">
                    Últimas chances: {finalChancesLeft}/{FINAL_EXTRA_CHANCES}
                  </small>
                )}
              </>
            ) : (
              <div className="gameOver">
                <X className="wrongIcon" size={64} color="#FF746C" />
                <h1 className="wrongText">The player was {challenge.name}</h1>
              </div>
            )
          ) : (
            <div className="guessed">
              <Check className="correctIcon" size={64} color="#4BBF73" />
              <h1 className="guessedText">
                Congrats! The player is {challenge.name}
              </h1>
            </div>
          )}

          <small className="debugText">
            revelados: {revealedCount}/{careerLen} — blur: {blurPx}px — final?{" "}
            {inFinalPhase ? "true" : "false"} — chances: {finalChancesLeft}
          </small>
        </div>
      </div>
    </main>
  );
}