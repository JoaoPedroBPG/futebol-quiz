import { Link } from "react-router-dom";
import "./home.css";
import { useState } from "react";

export default function Home() {
    const [showGames, setShowGames] = useState(false);
  return (
    <main className="home">
      <div className="bgDecor" aria-hidden="true" />

      <div className="homeCard">
        <div className="homeContent">
          <div className="homeTitle">
            <img src="/logo.png" alt="Logo" className="logo" />
            <p className="subtitle">Guess the player by their career history</p>
          </div>

          <button className="playButton" onClick={() => setShowGames(true)}>
            Play
          </button>

          <p className="author">Made by JoaoPedroBPG</p>
        </div>
      </div>

      {showGames && (
        <div className="overlay" onClick={() => setShowGames(false)}>
          <div className="gamesCard" onClick={(e) => e.stopPropagation()}>
            <div className="gamesHeader">
              <h2 className="gamesTitle">Choose a minigame</h2>
              <button className="closeButton" onClick={() => setShowGames(false)}>
                ✕
              </button>
            </div>

            <div className="gamesList">
              <Link
                to="/guess-the-career"
                className="gameOption"
                onClick={() => setShowGames(false)}
              >
              
                <div className="gameName">Guess the Career</div>
                <div className="gameDesc">Guess the player by their club history</div>
              </Link>

              <button className="gameOption disabled" disabled>
                <div className="gameName">Coming soon</div>
                <div className="gameDesc">More minigames will appear here</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}