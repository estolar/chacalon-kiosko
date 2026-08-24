import React from "react";

export default function GameShell({
  title,
  emoji = "🕹️",
  status = "READY",
  controls,
  onExit,
  actions,
  children,
}) {
  return (
    <article className="card game-shell">
      <div className="card-header">
        <h2>{emoji} {title}</h2>
        <span className="muted">{status}</span>
      </div>

      <div className="btnbar">
        <button className="btn" onClick={onExit}>Salir</button>
        {actions}
      </div>

      {controls && (
        <div className="legend muted" style={{ marginBottom: 10 }}>
          Controles: {controls}
        </div>
      )}

      {children}
    </article>
  );
}
