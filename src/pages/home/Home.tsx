import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <main className="home">
      <div className="bgDecor" aria-hidden="true" />

      <div className="homeCard">
        <div className="homeContent">
          <div className="homeTitle">
            <img src="/logo.png" alt="Logo" className="logo" />
            <p className="subtitle">Guess the player by their career history</p>
          </div>

          <Link to="/play" className="playButton">
            Play
          </Link>

          <p className="author">Made by JoaoPedroBPG</p>
        </div>
      </div>
    </main>
  );
}