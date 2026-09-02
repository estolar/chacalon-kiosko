import React from "react";

export default function GameShell({
  title,
  emoji = "🕹️",
  status = "READY",
  controls,
  onExit,
  actions,
  showTitle = true,
  headerContent,
  controlsInContent = false,
  actionsInHeader = false,
  hideHeader = false,
  className = "",
  children,
}) {
  return (
    <article className={`card game-shell ${className}`.trim()}>
      {!hideHeader && <div className="card-header">
        {showTitle && <h2>{emoji} {title}</h2>}
        <span className="muted">{status}</span>
        {headerContent}
        {actionsInHeader && <div className="game-shell__header-actions">{actions}</div>}
      </div>}

      {!actionsInHeader && <div className="btnbar">
        <button className="btn" onClick={onExit}>Salir</button>
        {actions}
      </div>}

      {controls && !controlsInContent && (
        <div className="legend muted" style={{ marginBottom: 10 }}>
          Controles: {controls}
        </div>
      )}

      {children}
    </article>
  );
}
