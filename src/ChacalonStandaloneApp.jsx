import React from "react";
import ChacalonChat from "./games/ChacalonChat";

export default function ChacalonStandaloneApp() {
  function goToArcade() {
    window.location.href = "/retro-games/";
  }

  return (
    <div className="crt">
      <div className="container">
        <ChacalonChat onExit={goToArcade} />

        <footer className="footer muted">
          Chacalón Virtual · homenaje interactivo desarrollado por <strong>Enrique Stolar</strong>
        </footer>
      </div>
    </div>
  );
}
