import { CHALLENGES } from "../../data/players";
import "./Game.css";

export function Game() {
  const challenge = CHALLENGES[0];
  const revealedCount = 1;
  const revealedClubs = challenge.career.slice(0, revealedCount);


  return (
    <main className="game">
      <div className="bgDecor" aria-hidden="true" />
      <div className="gameCard">  
        <div className="game-content">
          <h1>Guess the Player</h1>
          <div className="playerFrame">
              <img
                className="playerImage isBlurred"
                src={challenge.image}
                alt="Misterious player"
              />
          </div>
          <div className="careerRow" aria-label="Carreira revelada">
            {revealedClubs.map((club, idx) => (
              <div className="careerNode" key={club.name}>
                <div className="crestBlock">
                  <img className="clubCrest" src={club.crest} alt={club.name} />
                </div>
                <span className="clubName">{club.name}</span>

                {idx < revealedClubs.length - 1 && (
                  <span className="careerArrow" aria-hidden="true">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}