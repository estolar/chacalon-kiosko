import React, { useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { SpaceInvadersEngine } from "./spaceInvadersEngine";

export default function SpaceInvaders({ onExit }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const mutedRef = useRef(false);
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, msg: "" });
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const engine = new SpaceInvadersEngine({
      canvas: canvasRef.current,
      mutedRef,
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
      title="Space Invaders"
      emoji="👾"
      status="Canvas"
      onExit={onExit}
      controls="← → mover | Espacio disparar | P pausar | R reiniciar"
      actions={
        <>
          <button className="btn" onClick={() => engineRef.current?.start()}>
            START
          </button>
          <button className="btn" onClick={() => engineRef.current?.togglePause()}>
            Pausa (P)
          </button>
          <button className="btn btn-primary" onClick={() => setMuted((current) => !current)}>
            Sonido: {muted ? "OFF" : "ON"}
          </button>
        </>
      }
    >
      <div className="spaceWrap">
        <canvas ref={canvasRef} className="spaceCanvas" aria-label="Lienzo Space Invaders" />
        <div className="spaceHud" aria-hidden="true">
          <div className="spaceHudTop">
            <div>💯 Puntos: <span>{hud.score}</span></div>
            <div>❤️ Vidas: <span>{hud.lives}</span> &nbsp;|&nbsp; 🚀 Nivel: <span>{hud.level}</span></div>
          </div>
          <div className="spaceHudCenter">{hud.msg}</div>
        </div>
      </div>
    </GameShell>
  );
}
