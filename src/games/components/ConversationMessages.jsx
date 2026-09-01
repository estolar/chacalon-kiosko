import React from "react";

export default function ConversationMessages({
  messages,
  playerName,
  status,
  messagesEndRef,
  onSuggestedReply,
}) {
  return (
    <div className="chacalon-chat__messages" aria-live="polite">
      {messages.map((message, index) => (
        <div
          className={`chacalon-message chacalon-message--${message.role}`}
          key={message.id}
        >
          <div className="chacalon-message__label">
            {message.role === "user"
              ? playerName || message.playerName || "PLAYER"
              : "CHACALÓN VIRTUAL"}
          </div>
          <p>{message.text}</p>
          {message.fallback && (
            <small className="chacalon-message__fallback">MODO LOCAL</small>
          )}
          {index === messages.length - 1 &&
            message.role === "assistant" &&
            message.suggestions?.length > 0 && (
            <div
              className="chacalon-message__suggestions"
              aria-label="Opciones para continuar la conversación"
            >
              {message.suggestions.map((suggestion) => (
                <button
                  className="chacalon-message__suggestion"
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestedReply(suggestion)}
                  disabled={status === "CONNECTING"}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
