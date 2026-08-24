import React, { useEffect, useMemo, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import { clamp, computeRange, evaluateShot } from "./cannonPhysics";

export default function CannonTrainer({ onExit }) {
  const MIN_ANGLE = 1;
  const MAX_ANGLE = 89;
  const MAX_ATTEMPTS = 5;
  const TOLERANCE = 100;

  const targets = useMemo(
    () => [
      { id: 1, distance: 1200 },
      { id: 2, distance: 2800 },
      { id: 3, distance: 3500 },
    ],
    []
  );

  const [targetIndex, setTargetIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [hits, setHits] = useState(0);
  const [finished, setFinished] = useState(false);
  const [angle, setAngle] = useState(45);
  const [shots, setShots] = useState([]);
  const [maxRangeA, setMaxRangeA] = useState(randomMaxRange);
  const [banner, setBanner] = useState({
    kind: "banner-info",
    text: "Ajusta el ángulo y dispara.",
  });
  const transitionTimerRef = useRef(null);

  const currentTarget = targets[targetIndex];

  function nextTarget(hitCount = hits) {
    const next = targetIndex + 1;

    if (next >= targets.length) {
      setFinished(true);
      setBanner({
        kind: "banner-ok",
        text: `✅ Fin del juego — Hits: ${hitCount}/${targets.length}`,
      });
      return;
    }

    setTargetIndex(next);
    setAttempt(1);
    setAngle(45);
    setShots([]);
    setMaxRangeA(randomMaxRange());
    setBanner({
      kind: "banner-info",
      text: "Nuevo objetivo cargado. Ajusta el ángulo y dispara.",
    });
  }

  function scheduleNextTarget(callback, delay) {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      callback();
    }, delay);
  }

  function onShoot() {
    if (finished) return;

    const ang = clamp(Number(angle), MIN_ANGLE, MAX_ANGLE);
    const range = computeRange(ang, maxRangeA);
    const evaluation = evaluateShot(range, currentTarget.distance, TOLERANCE);
    const shot = {
      attempt,
      angle: ang,
      range,
      diff: evaluation.diff,
      diffSign: evaluation.diff >= 0 ? "+" : "-",
      result: evaluation.result,
    };

    setShots((previous) => [shot, ...previous]);

    if (evaluation.type === "hit") {
      const newHits = hits + 1;
      setHits(newHits);
      setBanner({ kind: "banner-ok", text: "🎯 ¡Impacto! Pasamos al siguiente objetivo…" });
      scheduleNextTarget(() => nextTarget(newHits), 450);
      return;
    }

    if (evaluation.type === "short") {
      setBanner({ kind: "banner-warn", text: "⬇️ Te quedaste corto. Ajusta y vuelve a intentar." });
    }

    if (evaluation.type === "long") {
      setBanner({ kind: "banner-warn", text: "⬆️ Te pasaste. Ajusta y vuelve a intentar." });
    }

    if (attempt >= MAX_ATTEMPTS) {
      setBanner({ kind: "banner-danger", text: "💥 Se acabaron los intentos. Siguiente objetivo…" });
      scheduleNextTarget(nextTarget, 650);
      return;
    }

    setAttempt((previous) => previous + 1);
  }

  function resetAll() {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
    setTargetIndex(0);
    setAttempt(1);
    setHits(0);
    setFinished(false);
    setAngle(45);
    setShots([]);
    setMaxRangeA(randomMaxRange());
    setBanner({ kind: "banner-info", text: "Nuevo juego. Ajusta el ángulo y dispara." });
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") onShoot();
  }

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  return (
    <section className="grid" onKeyDown={handleKeyDown} tabIndex={0}>
      <GameShell
        title="Cannon Trainer"
        emoji="🎯"
        status={finished ? "FIN" : `A = ${maxRangeA} m`}
        onExit={onExit}
        controls="Enter o botón DISPARAR"
        actions={
          <>
            <button className="btn" onClick={resetAll}>Reiniciar</button>
            <button className="btn btn-primary" onClick={onShoot} disabled={finished}>
              Disparar
            </button>
          </>
        }
      >
        <div className="stats">
          <div className="stat">
            <div className="label">Objetivo</div>
            <div className="value">
              {finished ? "—" : `${currentTarget.distance} m (obj ${targetIndex + 1}/${targets.length})`}
            </div>
          </div>
          <div className="stat">
            <div className="label">Intento</div>
            <div className="value">{finished ? "—" : `${attempt}/${MAX_ATTEMPTS}`}</div>
          </div>
          <div className="stat">
            <div className="label">Hits</div>
            <div className="value">{hits}/{targets.length}</div>
          </div>
        </div>

        <div className={`banner ${banner.kind}`}>{banner.text}</div>

        <div className="control">
          <label className="control-label">
            Ángulo: <span className="neon">{angle}</span>°
            <input
              type="range"
              min={MIN_ANGLE}
              max={MAX_ANGLE}
              value={angle}
              disabled={finished}
              onChange={(event) => setAngle(clamp(Number(event.target.value), MIN_ANGLE, MAX_ANGLE))}
            />
          </label>

          <div className="control-row">
            <input
              type="number"
              min={MIN_ANGLE}
              max={MAX_ANGLE}
              value={angle}
              disabled={finished}
              onChange={(event) => setAngle(clamp(Number(event.target.value), MIN_ANGLE, MAX_ANGLE))}
              aria-label="Ángulo en grados"
            />
            <div className="muted" style={{ fontFamily: "var(--font-mono)" }}>
              R = A × sin(2θ)
            </div>
          </div>
        </div>
      </GameShell>

      <article className="card">
        <div className="card-header">
          <h2>Historial</h2>
          <span className="muted">{shots.length} tiro(s)</span>
        </div>

        <div className={`history ${shots.length ? "" : "muted"}`}>
          {!shots.length && "Aún no hay tiros registrados."}

          {shots.map((shot, index) => (
            <div key={`${shot.attempt}-${index}`} className="history-item">
              <div><strong>#{shot.attempt}</strong></div>
              <div>θ: {shot.angle}°</div>
              <div>
                R: {Math.round(shot.range)} m — <strong>{shot.result}</strong> ({shot.diffSign}{Math.round(Math.abs(shot.diff))} m)
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function randomMaxRange() {
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(5000 * jitter);
}
