import React from "react";

export default function ConversationComposer({
  playerName,
  input,
  inputRef,
  status,
  controls,
  slashCommands,
  slashCommandIndex,
  slashActiveOptionRef,
  showSlashMenu,
  onSlashCommandSelect,
  mentionOptions,
  mentionIndex,
  mentionActiveOptionRef,
  showMentionMenu,
  onMentionSelect,
  onInputChange,
  onInputKeyDown,
  onSubmit,
}) {
  return (
    <form className="chacalon-form" onSubmit={onSubmit}>
      <label className="chacalon-form__label" htmlFor="chacalon-message">
        {playerName ? "HABLA CON CHACALÓN" : "DILE TU NOMBRE A CHACALÓN"}
      </label>
      {controls && <div className="chacalon-form__controls">CONTROLES: {controls}</div>}
      {showSlashMenu && (
        <div
          id="chacalon-slash-menu"
          className="chacalon-slash-menu"
          role="listbox"
          aria-label="Comandos rápidos de Chacalón"
        >
          <div className="chacalon-slash-menu__hint">
            COMANDOS RÁPIDOS · ELIGE UNA OPCIÓN
          </div>
          {slashCommands.map((command, index) => (
            <button
              className={`chacalon-slash-menu__item ${
                index === slashCommandIndex ? "is-active" : ""
              }`}
              key={command.command}
              ref={index === slashCommandIndex ? slashActiveOptionRef : null}
              type="button"
              role="option"
              aria-selected={index === slashCommandIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSlashCommandSelect(command)}
            >
              <span className="chacalon-slash-menu__command">{command.command}</span>
              <span className="chacalon-slash-menu__label">{command.label}</span>
              <span className="chacalon-slash-menu__description">
                {command.description}
              </span>
            </button>
          ))}
        </div>
      )}
      {showMentionMenu && (
        <div
          id="chacalon-mention-menu"
          className="chacalon-mention-menu"
          role="listbox"
          aria-label="Menciones del contexto de Chacalón"
        >
          <div className="chacalon-mention-menu__hint">
            MENCIONES · BUSCAR EN LAS NOTICIAS DEL DÍA
          </div>
          {mentionOptions.map((entity, index) => (
            <button
              className={`chacalon-mention-menu__item ${
                index === mentionIndex ? "is-active" : ""
              }`}
              key={entity.token}
              ref={index === mentionIndex ? mentionActiveOptionRef : null}
              type="button"
              role="option"
              aria-selected={index === mentionIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onMentionSelect(entity)}
            >
              <span className="chacalon-mention-menu__token">{entity.token}</span>
              <span className="chacalon-mention-menu__label">{entity.label}</span>
              <span className="chacalon-mention-menu__meta">
                {entity.category} · {entity.contextMatches
                  ? `${entity.contextMatches} coincidencia${entity.contextMatches === 1 ? "" : "s"}`
                  : "sin coincidencias recientes"}
              </span>
            </button>
          ))}
        </div>
      )}
      <textarea
        id="chacalon-message"
        ref={inputRef}
        value={input}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        aria-controls={
          showSlashMenu
            ? "chacalon-slash-menu"
            : showMentionMenu
              ? "chacalon-mention-menu"
              : undefined
        }
        placeholder={playerName ? "Escribe un mensaje..." : "Escribe tu nombre..."}
        rows={3}
        maxLength={1200}
        disabled={status === "CONNECTING"}
      />
      <div className="chacalon-form__footer">
        <span className="muted">{input.length}/1200</span>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!input.trim() || status === "CONNECTING"}
        >
          {status === "CONNECTING" ? "TRANSMITIENDO..." : "ENVIAR"}
        </button>
      </div>
    </form>
  );
}
