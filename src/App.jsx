import React from "react";
import { Routes, Route } from "react-router-dom";
import ChacalonStandaloneApp from "./ChacalonStandaloneApp";
import NotFound404 from "./pages/NotFound404";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChacalonStandaloneApp />} />
      <Route path="*" element={<NotFound404 />} />
    </Routes>
  );
}
