import { Routes, Route } from "react-router-dom";
import Home from "../pages/home/Home";
import { GTC } from "@/pages/game/gtc/GTC";
// import Ranking from "../pages/Ranking";
// import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/guess-the-career" element={<GTC />} />
      {/* <Route path="/ranking" element={<Ranking />} />
      <Route path="*" element={<NotFound />} />  */}
    </Routes>
  );
}