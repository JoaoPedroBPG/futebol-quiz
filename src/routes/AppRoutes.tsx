import { Routes, Route } from "react-router-dom";
import Home from "../pages/home/Home";
import { Game } from "../pages/game/Game";

// import Ranking from "../pages/Ranking";
// import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Game />} />
      {/* <Route path="/ranking" element={<Ranking />} />
      <Route path="*" element={<NotFound />} />  */}
    </Routes>
  );
}