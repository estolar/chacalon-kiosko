import React, { useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";

const API_URL = process.env.REACT_APP_AI_API_URL || "";
const API_PATH = process.env.REACT_APP_AI_API_PATH || "/api/ai/chat";
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const AUDIO_SRC = `${PUBLIC_URL}/audio/caballito-pixelado-45s-test.mp3`;
const IMAGE_SRC = `${PUBLIC_URL}/images/chacalon-arcade.png`;
const PLAYER_NAME_STORAGE_KEY = "retro-games.chacalon.player-name";
const PLAYER_PROFILE_STORAGE_KEY = "retro-games.chacalon.profile";
const MAX_SAVED_ANSWERS = 8;
const MAX_SAVED_ANSWER_LENGTH = 240;

const INTRO_MESSAGE = {
  id: "intro",
  role: "assistant",
  text: "¡Hola, mi hermano! Soy Chacalón Virtual, un homenaje interactivo. Antes de empezar, dime tu nombre, causa.",
};

function readStoredProfile() {
  if (typeof window === "undefined") return { name: "", answers: [] };

  try {
    const storedProfile = window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      return {
        name: typeof profile.name === "string" ? profile.name.slice(0, 40) : "",
        answers: Array.isArray(profile.answers)
          ? profile.answers
              .filter((answer) => typeof answer === "string")
              .map((answer) => answer.slice(0, MAX_SAVED_ANSWER_LENGTH))
              .slice(-MAX_SAVED_ANSWERS)
          : [],
      };
    }

    return {
      name: window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || "",
      answers: [],
    };
  } catch {
    return { name: "", answers: [] };
  }
}

function storePlayerProfile(name, answers = []) {
  try {
    const profile = {
      name: name.slice(0, 40),
      answers: answers.slice(-MAX_SAVED_ANSWERS),
    };
    window.localStorage.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, profile.name);
  } catch {
    // Si el navegador bloquea localStorage, el nombre queda disponible durante la sesión.
  }
}

function createIntroMessage(playerName) {
  if (!playerName) return INTRO_MESSAGE;

  return {
    ...INTRO_MESSAGE,
    text: `¡Hola de nuevo, ${playerName}! Qué gusto verte por aquí, mi hermano. ¿Qué juego quieres jugar hoy?`,
  };
}

function extractRequestedName(message) {
  const patterns = [
    /(?:cambia(?:r)?\s+mi\s+nombre\s+(?:a|por)|mi\s+nombre\s+es|me\s+llamo|ll[aá]mame|quiero\s+que\s+me\s+llames)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const name = match[1]
      .split(/\s+(?:por favor|desde ahora|ahora)\b/i)[0]
      .replace(/[.,!?;:]+$/, "")
      .trim()
      .slice(0, 40);

    if (name) return name;
  }

  return "";
}

const FALLBACK_REPLIES = [
  "La señal está descansando, causa. Prueba un juego y volvemos con fe.",
  "La máquina pide una pausa. Dale a Space Invaders, Pong o Breakout y seguimos.",
  "Aunque se corte la señal, las ganas siguen. ¿Qué juego quieres dominar?",
];

function getFallbackReply(message) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("juego")) {
    return "Prueba Space Invaders, Pong o Breakout, causa. ¿Cuál te vacila más?";
  }

  if (normalizedMessage.includes("música") || normalizedMessage.includes("chicha")) {
    return "La música chicha tiene barrio y corazón. ¿Qué canción o ritmo te trae recuerdos?";
  }

  return FALLBACK_REPLIES[message.length % FALLBACK_REPLIES.length];
}

function toApiHistory(messages) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      text: message.text,
    }));
}

export default function ChacalonChat({ onExit }) {
  const [profile] = useState(readStoredProfile);
  const [playerName, setPlayerName] = useState(profile.name);
  const [savedAnswers, setSavedAnswers] = useState(profile.answers);
  const [messages, setMessages] = useState(() => [
    createIntroMessage(profile.name),
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("READY");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const [musicBlocked, setMusicBlocked] = useState(false);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function startMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise
          .then(() => setMusicBlocked(false))
          .catch(() => setMusicBlocked(true));
      } else {
        setMusicBlocked(false);
      }
    } catch {
      setMusicBlocked(true);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = 0.35;
    startMusic();

    const unlockMusic = () => startMusic();
    window.addEventListener("pointerdown", unlockMusic);
    window.addEventListener("keydown", unlockMusic);

    return () => {
      window.removeEventListener("pointerdown", unlockMusic);
      window.removeEventListener("keydown", unlockMusic);
      try {
        audio.pause();
      } catch {
        // Algunos entornos de prueba no implementan HTMLMediaElement.
      }
    };
  }, []);

  function resetChat() {
    setMessages([createIntroMessage(playerName)]);
    setInput("");
    setError("");
    setStatus("READY");
  }

  function rememberAnswer(answer) {
    const normalizedAnswer = answer.trim().slice(0, MAX_SAVED_ANSWER_LENGTH);
    const nextAnswers = [...savedAnswers, normalizedAnswer].slice(-MAX_SAVED_ANSWERS);
    setSavedAnswers(nextAnswers);
    storePlayerProfile(playerName, nextAnswers);
    return nextAnswers;
  }

  async function sendMessage(event) {
    event.preventDefault();
    const message = input.trim();

    if (!message || status === "CONNECTING") return;

    if (!playerName) {
      const name = message.split(/\r?\n/)[0].trim().slice(0, 40);
      storePlayerProfile(name, savedAnswers);
      setPlayerName(name);
      setMessages((current) => [
        ...current,
        {
          id: `player-name-${Date.now()}`,
          role: "user",
          text: name,
          playerName: name,
        },
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          text: `¡Qué tal, ${name}! Bienvenido, causa. Que tengas salud, chamba y harta fe. ¿Qué jugamos?`,
        },
      ]);
      setInput("");
      setError("");
      setStatus("READY");
      return;
    }

    const requestedName = extractRequestedName(message);
    if (requestedName) {
      const messageId = Date.now();
      storePlayerProfile(requestedName, savedAnswers);
      setPlayerName(requestedName);
      setMessages((current) => [
        ...current,
        {
          id: `rename-${messageId}`,
          role: "user",
          text: message,
          playerName: requestedName,
        },
        {
          id: `rename-confirmation-${messageId}`,
          role: "assistant",
          text: `¡Hecho, ${requestedName}! Desde ahora te llamo ${requestedName}, causa. ¿Qué conversamos?`,
        },
      ]);
      setInput("");
      setError("");
      setStatus("READY");
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: message,
        playerName,
      },
    ]);
    setInput("");
    setError("");
    setStatus("CONNECTING");
    const nextAnswers = rememberAnswer(message);

    try {
      const response = await fetch(
        `${API_URL.replace(/\/$/, "")}${API_PATH}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: toApiHistory(messages),
            playerName,
            memory: nextAnswers,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "AI server unavailable");
      }

      setMessages((current) => [
        ...current,
        {
          id: `model-${Date.now()}`,
          role: "assistant",
          text: payload.reply,
        },
      ]);
      setStatus("ONLINE");
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `fallback-${Date.now()}`,
          role: "assistant",
          text: getFallbackReply(message),
          fallback: true,
        },
      ]);
      setError("IA no disponible: usamos el modo de respaldo local.");
      setStatus("OFFLINE");
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <GameShell
      title="Conversando con Chacalón Virtual"
      emoji="🎙️"
      status={status}
      controls="Escribe tu mensaje y pulsa Enter | Shift + Enter para una nueva línea"
      onExit={onExit}
      actions={
        <button className="btn" onClick={resetChat} type="button">
          Reiniciar conversación
        </button>
      }
    >
      <div className="chacalon-notice">
        PERSONAJE VIRTUAL DE HOMENAJE · LA API KEY PERMANECE EN EL SERVIDOR
      </div>

      <div className="chacalon-music">
        <div className="chacalon-music__label">MÚSICA DE PRUEBA · CABALLITO PIXELADO · 45 SEGUNDOS</div>
        <audio
          ref={audioRef}
          aria-label="Música de prueba 8-bit"
          autoPlay
          controls
          loop
          preload="auto"
          src={AUDIO_SRC}
        >
          Tu navegador no permite reproducir este audio.
        </audio>
        {musicBlocked && (
          <button className="btn chacalon-music__start" onClick={startMusic} type="button">
            ACTIVAR MÚSICA
          </button>
        )}
      </div>

      <div className="chacalon-main-grid">
        <div className="chacalon-identity">
          <img
            className="chacalon-identity__portrait"
            src={IMAGE_SRC}
            alt="Retrato arcade de Chacalón Virtual"
          />
          <div className="chacalon-identity__copy">
            <div className="chacalon-identity__eyebrow">TRANSMISIÓN VISUAL ONLINE</div>
            <h3>CHACALÓN VIRTUAL</h3>
            <p>Homenaje interactivo · música chicha · arcade</p>
          </div>
        </div>

        <div className="chacalon-chat">
          <div className="chacalon-chat__messages" aria-live="polite">
            {messages.map((message) => (
              <div
                className={`chacalon-message chacalon-message--${message.role}`}
                key={message.id}
              >
                <div className="chacalon-message__label">
                  {message.role === "user"
                    ? message.playerName || playerName || "PLAYER"
                    : "CHACALÓN VIRTUAL"}
                </div>
                <p>{message.text}</p>
                {message.fallback && (
                  <small className="chacalon-message__fallback">MODO LOCAL</small>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className="banner banner-warn">{error}</div>}

          <form className="chacalon-form" onSubmit={sendMessage}>
              <label className="chacalon-form__label" htmlFor="chacalon-message">
                {playerName ? "TRANSMISIÓN AL PERSONAJE" : "DILE TU NOMBRE A CHACALÓN"}
              </label>
              <textarea
                id="chacalon-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
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
        </div>
      </div>
    </GameShell>
  );
}

export { extractRequestedName, getFallbackReply, toApiHistory };
