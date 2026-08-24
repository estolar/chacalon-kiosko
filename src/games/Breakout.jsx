import React, { useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { BreakoutEngine } from "./breakoutEngine";

export default function Breakout({ onExit }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, lives: 3, bricks: 50, msg: "" });

  useEffect(() => {
    const engine = new BreakoutEngine({
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
      title="Breakout"
      emoji="🧱"
      status="Canvas / 1P"
      onExit={onExit}
      controls="← → mover | Espacio iniciar | P pausar | R reiniciar"
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
      <div className="breakoutHud">
        <span>PUNTOS: {hud.score}</span>
        <span>VIDAS: {hud.lives}</span>
        <span>BLOQUES: {hud.bricks}</span>
      </div>

      <div className="spaceWrap">
        <canvas ref={canvasRef} className="breakoutCanvas" aria-label="Lienzo Breakout" />
        <div className="spaceHudCenter">{hud.msg}</div>
      </div>
    </GameShell>
  );
}
