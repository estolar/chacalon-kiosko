import React, { useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { PongEngine } from "./pongEngine";

export default function Pong({ onExit }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [hud, setHud] = useState({ left: 0, right: 0, msg: "" });

  useEffect(() => {
    const engine = new PongEngine({
      canvas: canvasRef.current,
      onHUD: (next) => setHud((current) => ({ ...current, ...next })),
      onMessage: (msg) => setHud((current) => ({ ...current, msg })),
    });

    engineRef.current = engine;
    engine.mount();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <GameShell
      title="Pong"
      emoji="🏓"
      status="Canvas / 2P"
      onExit={onExit}
      controls="W/S jugador 1 | ↑/↓ jugador 2 | Espacio iniciar | P pausar | R reiniciar"
      actions={
        <>
          <button className="btn" onClick={() => engineRef.current?.start()}>
            START
          </button>
          <button className="btn" onClick={() => engineRef.current?.togglePause()}>
            Pausa (P)
          </button>
          <button className="btn btn-primary" onClick={() => engineRef.current?.restart()}>
            Reiniciar
          </button>
        </>
      }
    >
      <div className="pongHud">
        <span>PLAYER 1: {hud.left}</span>
        <span>{hud.msg || "FIRST TO 7"}</span>
        <span>PLAYER 2: {hud.right}</span>
      </div>

      <div className="spaceWrap">
        <canvas ref={canvasRef} className="pongCanvas" aria-label="Lienzo Pong para dos jugadores" />
      </div>
    </GameShell>
  );
}
