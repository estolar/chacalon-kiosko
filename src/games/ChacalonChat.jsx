import React, { useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import ConversationMessages from "./components/ConversationMessages";
import ConversationComposer from "./components/ConversationComposer";
import KioskFrame from "./components/KioskFrame";

const API_URL = process.env.REACT_APP_AI_API_URL || "";
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const API_PATH =
  process.env.REACT_APP_AI_API_PATH ||
  (process.env.NODE_ENV === "production"
    ? `${PUBLIC_URL.replace(/\/$/, "")}/api/ai/chat.php`
    : "/api/ai/chat");
const AUDIO_SRC = `${PUBLIC_URL}/audio/caballito-pixelado.mp3`;
const IMAGE_SRC = `${PUBLIC_URL}/images/chacalon-arcade.png`;
const WINK_IMAGE_SRC = `${PUBLIC_URL}/images/chacalon-arcade-wink.png`;
const BODY_MOTION_SRC = `${PUBLIC_URL}/images/chacalon-arcade-body.png`;
const SALUTE_IMAGE_SRC = `${PUBLIC_URL}/images/chacalon-arcade-salute.png`;
const LOCAL_CONTEXT_URL = `${PUBLIC_URL.replace(/\/$/, "")}/data/context.json`;
const PRODUCTION_CONTEXT_URL =
  "https://raw.githubusercontent.com/estolar/chacalon-kiosko/main/public/data/context.json";
const CONTEXT_URL =
  process.env.REACT_APP_CONTEXT_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_CONTEXT_URL : LOCAL_CONTEXT_URL);
const CONTEXT_REFRESH_INTERVAL = 60 * 60 * 1000;
const PLAYER_NAME_STORAGE_KEY = "chacalon-virtual.player-name";
const PLAYER_PROFILE_STORAGE_KEY = "chacalon-virtual.profile";
const MAX_SAVED_ANSWERS = 20;
const MAX_SAVED_ANSWER_LENGTH = 240;
const AI_REQUEST_TIMEOUT_MS = 30_000;

function getDayPhase(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    hour: "numeric", hour12: false, timeZone: "America/Lima",
  }).format(date));
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "sunset";
  return "night";
}

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function formatContextUpdatedAt(value) {
  if (!value) return "fecha no disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "fecha no disponible";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(date);
}

function shouldUseDailyContext(message) {
  return /actualidad|noticia|hoy|ahora|pol[ií]tica|keiko|\bkk\b|la\s+k\b|señora\s+k|chik[ao]|ministro|gobierno|presidente|congreso|econom[ií]a|sociedad|seguridad|d[oó]lar|inflaci[oó]n|precio|empleo|trabajo|negocio|empresa|emprend|inversi[oó]n|mercado|innovaci[oó]n|tecnolog[ií]a|inteligencia artificial|\bia\b|bill\s+gates|\bgates\b|microsoft|openai|google|meta|idea|redes sociales|viral|tendencia|far[aá]ndula|espect[aá]culo|chisme|evento|qu[eé] hacer|d[oó]nde (comer|ir)|recom|lugar|restaurante|discoteca|cebicher[ií]a|barrio/i.test(
    message
  );
}

function shouldTriggerSalute(message) {
  return /\b(salud|chela|chelas|helena|helenas|helada|heladas|cerveza|cervezas|trago|tragos|brindis|tomar|tomamos|copa|copas)\b/i.test(
    message
  );
}

function shouldTriggerWink(message) {
  return /\b(guiñ[oa]|guino|parpadea|parpadee)\b/i.test(message);
}

const SLASH_COMMANDS = [
  {
    command: "/salud",
    label: "Hacer un brindis",
    description: "Levantar la chela y celebrar",
    prompt: "salud",
  },
  {
    command: "/guiño",
    label: "Guiñar el ojo",
    description: "Un guiño especial para la causa",
    prompt: "hazme un guiño",
  },
  {
    command: "/noticias",
    label: "Noticias del día",
    description: "Revisar la actualidad reciente",
    prompt: "¿Qué noticias tienes hoy?",
  },
  {
    command: "/politica",
    label: "Política peruana",
    description: "Keiko, ministros, Gobierno y Congreso",
    prompt: "¿Qué novedades hay hoy en la política peruana?",
  },
  {
    command: "/economia",
    label: "Economía y negocios",
    description: "Empresas, empleo e inversiones",
    prompt: "¿Qué novedades hay hoy en economía y negocios?",
  },
  {
    command: "/ia",
    label: "Noticias de IA",
    description: "Tecnología e inteligencia artificial",
    prompt: "¿Qué novedades hay hoy sobre inteligencia artificial?",
  },
  {
    command: "/musica",
    label: "Música chicha",
    description: "Conversar de música y barrio",
    prompt: "Hablemos de música chicha",
  },
  {
    command: "/juego",
    label: "Recomendar un juego",
    description: "Elegir una partida arcade",
    prompt: "¿Qué juego arcade me recomiendas?",
  },
  {
    command: "/memoria",
    label: "Lo que recuerdo de ti",
    description: "Conversar sobre nuestra memoria",
    prompt: "¿Qué recuerdas de mí?",
  },
  {
    command: "/ayuda",
    label: "Ver los comandos",
    description: "Mostrar cómo conversar con Chacalón",
    prompt: "¿Qué comandos puedo usar contigo?",
  },
];

const MENTION_CATALOG = [
  {
    token: "@keiko",
    label: "Keiko Fujimori",
    category: "PERSONAS",
    aliases: ["keiko", "keiko fujimori", "kk", "la k", "señora k", "chika"],
  },
  {
    token: "@billgates",
    label: "Bill Gates",
    category: "PERSONAS",
    aliases: ["bill gates", "gates"],
  },
  {
    token: "@dinaboluarte",
    label: "Dina Boluarte",
    category: "PERSONAS",
    aliases: ["dina boluarte", "dina"],
  },
  {
    token: "@congreso",
    label: "Congreso de la República",
    category: "INSTITUCIONES",
    aliases: ["congreso", "congreso de la republica", "parlamento"],
  },
  {
    token: "@consejodeministros",
    label: "Consejo de Ministros",
    category: "INSTITUCIONES",
    aliases: ["consejo de ministros", "ministros", "gabinete"],
  },
  {
    token: "@gobierno",
    label: "Gobierno del Perú",
    category: "INSTITUCIONES",
    aliases: ["gobierno", "ejecutivo", "gobierno del peru"],
  },
  {
    token: "@microsoft",
    label: "Microsoft",
    category: "EMPRESAS Y TECNOLOGÍA",
    aliases: ["microsoft"],
  },
  {
    token: "@google",
    label: "Google",
    category: "EMPRESAS Y TECNOLOGÍA",
    aliases: ["google"],
  },
  {
    token: "@openai",
    label: "OpenAI",
    category: "EMPRESAS Y TECNOLOGÍA",
    aliases: ["openai"],
  },
  {
    token: "@ia",
    label: "Inteligencia artificial",
    category: "TEMAS",
    aliases: ["inteligencia artificial", "ia", "ai"],
  },
  {
    token: "@economia",
    label: "Economía y negocios",
    category: "TEMAS",
    aliases: ["economia", "economía", "negocios", "empresa", "empleo"],
  },
  {
    token: "@farandula",
    label: "Farándula peruana",
    category: "TEMAS",
    aliases: ["farandula", "farándula", "espectaculo", "espectáculo"],
  },
];

function normalizeMentionText(value) {
  return String(value || "")
    .toLocaleLowerCase("es-PE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createMentionToken(label) {
  const slug = normalizeMentionText(label)
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 28);
  return slug ? `@${slug}` : "@tema";
}

function getContextSearchText(context) {
  if (!context || typeof context !== "object") return "";

  const values = [];
  for (const fact of Array.isArray(context.currentFacts) ? context.currentFacts : []) {
    values.push(fact?.subject, fact?.fact, fact?.source);
  }

  for (const items of Object.values(context.topics || {})) {
    for (const item of Array.isArray(items) ? items : []) {
      values.push(item?.title, item?.summary, item?.source, item?.name);
    }
  }

  for (const item of Array.isArray(context.recommendations)
    ? context.recommendations
    : []) {
    values.push(item?.title, item?.summary, item?.source, item?.name);
  }

  return normalizeMentionText(values.filter(Boolean).join(" "));
}

function countMentionMatches(text, aliases) {
  const uniqueAliases = [
    ...new Set(aliases.map((alias) => normalizeMentionText(alias).trim())),
  ];

  return uniqueAliases.reduce((total, normalizedAlias) => {
    if (!normalizedAlias || !text.includes(normalizedAlias)) return total;

    let count = 0;
    let start = 0;
    while (start < text.length) {
      const matchIndex = text.indexOf(normalizedAlias, start);
      if (matchIndex === -1) break;
      count += 1;
      start = matchIndex + normalizedAlias.length;
    }
    return total + count;
  }, 0);
}

function getMentionOptions(context, query = "") {
  const contextSearchText = getContextSearchText(context);
  const hasContext = Boolean(contextSearchText);
  const normalizedQuery = normalizeMentionText(query).replace(/^@/, "").trim();
  const catalog = [...MENTION_CATALOG];
  const catalogLabels = new Set(catalog.map(({ label }) => normalizeMentionText(label)));

  for (const fact of Array.isArray(context?.currentFacts) ? context.currentFacts : []) {
    const subject = typeof fact?.subject === "string" ? fact.subject.trim() : "";
    const normalizedSubject = normalizeMentionText(subject);
    if (!subject || normalizedSubject.length < 3 || catalogLabels.has(normalizedSubject)) {
      continue;
    }

    catalog.push({
      token: createMentionToken(subject),
      label: subject,
      category: "CONTEXTO DEL DÍA",
      aliases: [subject],
    });
    catalogLabels.add(normalizedSubject);
  }

  return catalog
    .map((entity, index) => {
      const terms = [entity.token.slice(1), entity.label, ...(entity.aliases || [])];
      const matchesQuery = !normalizedQuery || terms.some((term) => {
        const normalizedTerm = normalizeMentionText(term);
        return (
          normalizedTerm.startsWith(normalizedQuery) ||
          normalizedTerm.includes(normalizedQuery)
        );
      });

      return {
        ...entity,
        contextMatches: countMentionMatches(contextSearchText, terms),
        matchesQuery,
        catalogIndex: index,
      };
    })
    .filter(({ matchesQuery, contextMatches }) => {
      if (!matchesQuery) return false;
      if (normalizedQuery) return true;
      return hasContext ? contextMatches > 0 : true;
    })
    .sort(
      (left, right) =>
        right.contextMatches - left.contextMatches || left.catalogIndex - right.catalogIndex
    )
    .slice(0, 10);
}

function getConversationSuggestions(text) {
  const normalizedText = normalizeMentionText(text);
  const suggestions = [];
  const addSuggestion = (suggestion) => {
    if (!suggestions.includes(suggestion)) suggestions.push(suggestion);
  };

  if (
    /keiko|\bkk\b|la\s+k|senora\s+k|chik[ao]|congreso|ministro|gobierno|president/.test(
      normalizedText
    )
  ) {
    addSuggestion("¿Qué implica esto para el Congreso?");
    addSuggestion("¿Qué dice la gente sobre esta medida?");
    addSuggestion("¿Qué podría pasar después?");
  } else if (
    /economia|negocio|empleo|inversion|mercado|precio|dolar|inflacion/.test(
      normalizedText
    )
  ) {
    addSuggestion("¿Cómo afecta esto al bolsillo?");
    addSuggestion("¿Qué sectores se beneficiarían?");
    addSuggestion("¿Qué otras noticias económicas hay?");
  } else if (/(^|\s)ia(\s|$)|inteligencia artificial|tecnologia|microsoft|google|openai/.test(normalizedText)) {
    addSuggestion("¿Cómo nos afecta en la vida diaria?");
    addSuggestion("¿Qué empresas están metidas?");
    addSuggestion("¿Qué otras novedades hay?");
  } else if (/musica|chicha|cancion|ritmo/.test(normalizedText)) {
    addSuggestion("¿Qué canción chicha me recomiendas?");
    addSuggestion("¿Qué recuerdos trae esta música?");
    addSuggestion("Hablemos de otra canción, causa");
  } else if (/juego|arcade|invaders|pong|breakout/.test(normalizedText)) {
    addSuggestion("¿Cuál es el juego más difícil?");
    addSuggestion("Recomiéndame otro juego arcade");
    addSuggestion("¿Jugamos una partida?");
  } else {
    addSuggestion("¿Qué más sabes de esto?");
    addSuggestion("¿Y qué otras noticias hay, causa?");
    addSuggestion("¿Tú qué opinas, hermano?");
  }

  return suggestions.slice(0, 3);
}

const INTRO_MESSAGE = {
  id: "intro",
  role: "assistant",
  text: "¡Hola, mi hermano! Soy Chacalón Virtual, un homenaje interactivo. Antes de empezar, dime cómo te llamas, causa. ¿Con qué nombre te recibo?",
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
    /(?:quiero\s+que\s+)?(?:me\s+)?cambi(?:a|e|ar|es)\s+(?:mi\s+nombre\s+)?(?:de\s+)?[^,.!?]+?\s+(?:a|por)\s+(.+)/i,
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

  if (/(?:deseo|ojal[aá]|conc[eé]deme|cumple mi deseo)/i.test(message)) {
    const wish = message
      .replace(/^(?:yo\s+)?(?:deseo|ojal[aá]|conc[eé]deme(?:\s+un)?\s+deseo|cumple mi deseo)\s*:?[\s]*/i, "")
      .trim();

    return wish
      ? `Tu deseo es ${wish}. Con fe, causa, que se te cumpla y se haga realidad.`
      : "Dime tu deseo, causa, y lo recibimos con fe para que se te cumpla.";
  }

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

function rotateContextItems(items, rotation = 0, categoryIndex = 0) {
  if (!Array.isArray(items) || items.length < 2) return items || [];

  const offset = (Math.max(0, rotation) + categoryIndex * 2) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function compactDailyContext(context, rotation = 0) {
  if (!context || typeof context !== "object") return null;

  const trim = (value, length) =>
    typeof value === "string" ? value.slice(0, length) : "";
  const compactItem = (item) => ({
    title: trim(item?.title, 240),
    summary: trim(item?.summary, 320),
    source: trim(item?.source, 100),
    url: trim(item?.url, 500),
    image: trim(item?.image || item?.imageUrl || item?.thumbnail, 500),
    publishedAt: trim(item?.publishedAt, 40),
    name: trim(item?.name, 160),
    district: trim(item?.district, 100),
    sponsored: Boolean(item?.sponsored),
  });
  const topics = {};

  for (const [categoryIndex, category] of ["politica", "economia", "sociedad", "cultura"].entries()) {
    topics[category] = Array.isArray(context.topics?.[category])
      ? rotateContextItems(context.topics[category], rotation, categoryIndex)
          .slice(0, 6)
          .map(compactItem)
      : [];
  }

  return {
    generatedAt: trim(context.generatedAt, 40),
    region: trim(context.region, 100),
    currentFacts: Array.isArray(context.currentFacts)
      ? context.currentFacts.slice(0, 8).map((fact) => ({
          subject: trim(fact?.subject, 120),
          fact: trim(fact?.fact, 360),
          source: trim(fact?.source, 100),
          url: trim(fact?.url, 500),
          validFrom: trim(fact?.validFrom, 20),
        }))
      : [],
    topics,
    recommendations: Array.isArray(context.recommendations)
      ? context.recommendations.slice(0, 6).map(compactItem)
      : [],
  };
}

function extractStreamText(payload) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("") || "";
}

async function readSseStream(response, onText) {
  if (!response.body) throw new Error("Streaming is not supported by this browser");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processEvent = (event) => {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data || data === "[DONE]") return data === "[DONE]";

    const payload = JSON.parse(data);
    const text = extractStreamText(payload);
    if (text) onText(text);
    return false;
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";

    for (const event of events) {
      if (processEvent(event)) return;
    }

    if (done) break;
  }

  if (buffer.trim()) processEvent(buffer);
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
  const inputRef = useRef(null);
  const slashActiveOptionRef = useRef(null);
  const mentionActiveOptionRef = useRef(null);
  const audioRef = useRef(null);
  const portraitFrameRef = useRef(null);
  const visualizerCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioSourceRef = useRef(null);
  const musicPausedByUserRef = useRef(false);
  const animationFrameRef = useRef(null);
  const visualizerDataRef = useRef(null);
  const [musicBlocked, setMusicBlocked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.35);
  const volumeRef = useRef(0.35);
  const [dailyContext, setDailyContext] = useState(null);
  const [isWinking, setIsWinking] = useState(false);
  const [isSaluting, setIsSaluting] = useState(false);
  const saluteTimerRef = useRef(null);
  const winkCommandTimerRef = useRef(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashCommandIndex, setSlashCommandIndex] = useState(0);
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null);
  const [dayPhase, setDayPhase] = useState(() => getDayPhase());

  useEffect(() => {
    const timer = window.setInterval(() => setDayPhase(getDayPhase()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const slashMatch = playerName && input.match(/^\/([^\s]*)$/);
  const slashQuery = slashMatch ? slashMatch[1].toLocaleLowerCase("es-PE") : "";
  const slashCommands = slashMatch
    ? SLASH_COMMANDS.filter(({ command }) =>
        command.slice(1).toLocaleLowerCase("es-PE").startsWith(slashQuery)
      )
    : [];
  const showSlashMenu =
    slashMenuOpen && slashCommands.length > 0 && status !== "CONNECTING";
  const mentionMatch = playerName && input.match(/(?:^|\s)@([^\s]*)$/);
  const mentionQuery = mentionMatch ? mentionMatch[1] : "";
  const mentionOptions = getMentionOptions(dailyContext, mentionQuery);
  const showMentionMenu =
    mentionMenuOpen && mentionOptions.length > 0 && status !== "CONNECTING";

  useEffect(() => {
    if (!showSlashMenu) return;
    slashActiveOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [showSlashMenu, slashCommandIndex, slashCommands.length]);

  useEffect(() => {
    if (!showMentionMenu) return;
    mentionActiveOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [showMentionMenu, mentionIndex, mentionOptions.length]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (status === "CONNECTING" || typeof inputRef.current?.focus !== "function") return undefined;

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [messages, playerName, status]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test" || typeof fetch !== "function") return undefined;

    let active = true;
    const loadDailyContext = () => {
      const cacheBuster = Math.floor(Date.now() / CONTEXT_REFRESH_INTERVAL);
      fetch(`${CONTEXT_URL}?v=${cacheBuster}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((context) => {
          if (active && context && typeof context === "object") setDailyContext(context);
        })
        .catch(() => {
          // El chat sigue funcionando aunque el contexto diario no esté disponible.
        });
    };

    loadDailyContext();
    const refreshTimer = window.setInterval(loadDailyContext, CONTEXT_REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(saluteTimerRef.current);
      window.clearTimeout(winkCommandTimerRef.current);
    },
    []
  );

  function finishSalute() {
    window.clearTimeout(saluteTimerRef.current);
    saluteTimerRef.current = null;
    setIsSaluting(false);
  }

  function triggerSalute() {
    window.clearTimeout(saluteTimerRef.current);
    setIsSaluting(true);
    saluteTimerRef.current = window.setTimeout(finishSalute, 1800);
  }

  function triggerWink() {
    window.clearTimeout(winkCommandTimerRef.current);
    setIsWinking(true);
    winkCommandTimerRef.current = window.setTimeout(() => {
      setIsWinking(false);
      winkCommandTimerRef.current = null;
    }, 180);
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "test") return undefined;

    let active = true;
    let winkTimer;
    let winkEndTimer;

    const scheduleWink = () => {
      winkTimer = window.setTimeout(() => {
        if (!active) return;

        setIsWinking(true);
        winkEndTimer = window.setTimeout(() => {
          if (!active) return;
          setIsWinking(false);
          scheduleWink();
        }, 140);
      }, 3600 + Math.random() * 4200);
    };

    scheduleWink();
    return () => {
      active = false;
      window.clearTimeout(winkTimer);
      window.clearTimeout(winkEndTimer);
    };
  }, []);

  function setupAudioVisualizer() {
    const audio = audioRef.current;
    const canvas = visualizerCanvasRef.current;
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!audio || !canvas || !AudioContext || audioSourceRef.current) return;

    try {
      const context = audioContextRef.current || new AudioContext();
      const analyser = context.createAnalyser();
      const source = context.createMediaElementSource(audio);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      audioSourceRef.current = source;
      visualizerDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // El reproductor sigue funcionando aunque Web Audio no esté disponible.
    }
  }

  function startVisualizer() {
    const canvas = visualizerCanvasRef.current;
    const analyser = analyserRef.current;
    const data = visualizerDataRef.current;
    if (!canvas || !analyser || !data || animationFrameRef.current) return;

    const draw = () => {
      const context = canvas.getContext("2d");
      if (!context) return;

      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(bounds.width, 320);
      const height = Math.max(bounds.height, 180);

      if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      analyser.getByteFrequencyData(data);

      const average = data.reduce((sum, value) => sum + value, 0) / data.length / 255;
      portraitFrameRef.current?.style.setProperty("--audio-energy", average.toFixed(3));
      const time = performance.now() / 1000;
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#080014");
      gradient.addColorStop(0.48, "#16051f");
      gradient.addColorStop(1, "#001719");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.globalAlpha = 0.18;
      context.strokeStyle = "#00ffff";
      context.lineWidth = 1;
      for (let line = 0; line < height; line += 4) {
        context.beginPath();
        context.moveTo(0, line + 0.5);
        context.lineTo(width, line + 0.5);
        context.stroke();
      }
      context.globalAlpha = 1;

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRingRadius = width * 0.54;
      const rings = [
        { size: 0.18, color: "#ff00ff", lineWidth: 2, glow: 14 },
        { size: 0.29, color: "#00ffff", lineWidth: 1, glow: 10 },
        { size: 0.4, color: "#fff300", lineWidth: 3, glow: 14 },
        { size: 0.52, color: "#39ff14", lineWidth: 1, glow: 10 },
        { size: 0.64, color: "#ff00ff", lineWidth: 2, glow: 12 },
        { size: 0.76, color: "#00ffff", lineWidth: 4, glow: 16 },
        { size: 0.89, color: "#fff300", lineWidth: 1, glow: 10 },
        { size: 1.02, color: "#39ff14", lineWidth: 3, glow: 14 },
      ];
      rings.forEach((ring, ringIndex) => {
        const pulse =
          1 + average * (0.4 + ringIndex * 0.04) +
          Math.sin(time * (3.5 + ringIndex * 0.45) + ringIndex) * 0.025;
        context.globalAlpha = 0.3 + average * 0.45;
        context.strokeStyle = ring.color;
        context.shadowBlur = ring.glow;
        context.shadowColor = ring.color;
        context.lineWidth = ring.lineWidth;
        context.beginPath();
        context.arc(centerX, centerY, maxRingRadius * ring.size * pulse, 0, Math.PI * 2);
        context.stroke();
      });
      context.globalAlpha = 1;
      context.shadowBlur = 0;

      const barCount = 40;
      const gap = Math.max(2, Math.min(5, width * 0.004));
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);
      const centerIndex = (barCount - 1) / 2;
      for (let index = 0; index < barCount; index += 1) {
        const spectrumIndex = Math.floor((index / barCount) * data.length);
        const value = (data[spectrumIndex] || 0) / 255;
        const distanceFromCenter = Math.abs(index - centerIndex) / centerIndex;
        const centerEnvelope = Math.max(0.24, 1 - distanceFromCenter * 0.76);
        const barHeight =
          6 + centerEnvelope * (22 + value * (height * 0.3) + average * 8);
        const x = index * (barWidth + gap);
        const hue = index % 3 === 0 ? "#fff300" : index % 2 === 0 ? "#00ffff" : "#ff00ff";
        context.fillStyle = hue;
        context.shadowBlur = 10;
        context.shadowColor = hue;
        context.fillRect(x, height - 18 - barHeight, barWidth, barHeight);
        context.fillRect(x, 18, barWidth, barHeight * 0.62);
      }
      context.shadowBlur = 0;

      context.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const index = Math.floor((x / width) * data.length);
        const waveform = (data[index] || 0) / 255;
        const y = centerY + Math.sin((x / width) * Math.PI * 8 + time * 4) * (8 + waveform * 30);
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = "#55ff33";
      context.shadowBlur = 12;
      context.shadowColor = "#55ff33";
      context.lineWidth = 2;
      context.stroke();
      context.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);
  }

  async function startMusic({ userInitiated = false } = {}) {
    const audio = audioRef.current;
    if (!audio) return;
    if (userInitiated) musicPausedByUserRef.current = false;

    try {
      audio.volume = volumeRef.current;
      await audio.play();
    } catch {
      setMusicBlocked(true);
      setIsPlaying(false);
      return;
    }

    setMusicBlocked(false);
    setIsPlaying(true);

    try {
      setupAudioVisualizer();
      const context = audioContextRef.current;
      if (context?.state === "suspended") await context.resume();
      startVisualizer();
    } catch {
      // El audio nativo sigue funcionando aunque el visualizador falle.
    }
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void startMusic({ userInitiated: true });
    } else {
      musicPausedByUserRef.current = true;
      audio.pause();
    }
  }

  function handleVolumeChange(event) {
    const nextVolume = Number(event.target.value);
    volumeRef.current = nextVolume;
    setVolume(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
  }

  function handleProgressChange(event) {
    const nextTime = Number(event.target.value);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    if (process.env.NODE_ENV === "test") return undefined;

    audio.volume = volumeRef.current;
    const unlockMusic = () => {
      if (musicPausedByUserRef.current) return;
      if (audio.paused || audioContextRef.current?.state === "suspended" || !audioSourceRef.current) {
        void startMusic();
      }
    };
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      audioSourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioContextRef.current?.close?.();
      audioSourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
    };
    // La inicialización del reproductor debe ejecutarse una sola vez por montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetChat() {
    setMessages([createIntroMessage(playerName)]);
    setInput("");
    setSlashMenuOpen(false);
    setMentionMenuOpen(false);
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
      setSlashMenuOpen(false);
      setMentionMenuOpen(false);
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
      setSlashMenuOpen(false);
      setMentionMenuOpen(false);
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
    setSlashMenuOpen(false);
    setMentionMenuOpen(false);
    setError("");
    setStatus("CONNECTING");
    if (shouldTriggerSalute(message)) triggerSalute();
    if (shouldTriggerWink(message)) triggerWink();
    const nextAnswers = rememberAnswer(message);
    const assistantId = `model-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: assistantId, role: "assistant", text: "" },
    ]);
    const requestController = new AbortController();
    const timeoutId = window.setTimeout(
      () => requestController.abort(),
      AI_REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${API_URL.replace(/\/$/, "")}${API_PATH}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: requestController.signal,
          body: JSON.stringify({
            message,
            history: toApiHistory(messages),
            playerName,
            memory: nextAnswers,
            dailyContext: shouldUseDailyContext(message)
              ? compactDailyContext(dailyContext, Math.floor(messages.length / 2))
              : null,
          }),
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "AI server unavailable");
      }

      let streamedText = "";
      const contentType = response.headers?.get?.("content-type") || "";
      const isSseResponse = contentType.toLowerCase().includes("text/event-stream");

      if (isSseResponse && response.body?.getReader) {
        await readSseStream(response, (text) => {
          streamedText += text;
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantId ? { ...item, text: streamedText } : item
            )
          );
        });
      } else {
        const payload = await response.json().catch(() => ({}));
        streamedText = typeof payload.reply === "string" ? payload.reply : "";
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId ? { ...item, text: streamedText } : item
          )
        );
      }

      if (!streamedText.trim()) throw new Error("AI server returned an empty stream");
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, suggestions: getConversationSuggestions(streamedText) }
            : item
        )
      );
      setStatus("ONLINE");
    } catch (error) {
      const timedOut = error?.name === "AbortError";
      const fallbackText = getFallbackReply(message);
      setMessages((current) => [
        ...current.filter((item) => item.id !== assistantId),
        {
          id: `fallback-${Date.now()}`,
          role: "assistant",
          text: fallbackText,
          fallback: true,
          suggestions: getConversationSuggestions(fallbackText),
        },
      ]);
      setError(
        timedOut
          ? "La IA está tardando demasiado: usamos el modo de respaldo local."
          : "IA no disponible: usamos el modo de respaldo local."
      );
      setStatus("OFFLINE");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function handleInputKeyDown(event) {
    if (showMentionMenu) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((current) => (current + 1) % mentionOptions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex(
          (current) => (current - 1 + mentionOptions.length) % mentionOptions.length
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionMenuOpen(false);
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleMentionSelect(mentionOptions[mentionIndex]);
        return;
      }
    }

    if (showSlashMenu) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashCommandIndex((current) => (current + 1) % slashCommands.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashCommandIndex(
          (current) => (current - 1 + slashCommands.length) % slashCommands.length
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSlashMenuOpen(false);
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSlashCommandSelect(slashCommands[slashCommandIndex]);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleInputChange(event) {
    const nextInput = event.target.value;
    setInput(nextInput);
    setSlashCommandIndex(0);
    setMentionIndex(0);
    setSlashMenuOpen(Boolean(playerName && /^\/[^\s]*$/.test(nextInput)));
    setMentionMenuOpen(Boolean(playerName && /(?:^|\s)@[^\s]*$/.test(nextInput)));
  }

  function handleSlashCommandSelect(command) {
    if (!command) return;

    setSlashMenuOpen(false);
    setMentionMenuOpen(false);
    setInput(command.prompt);
    window.setTimeout(() => inputRef.current?.form?.requestSubmit(), 0);
  }

  function handleMentionSelect(entity) {
    if (!entity || !mentionMatch) return;

    const tokenStart =
      mentionMatch.index + mentionMatch[0].length - mentionMatch[1].length - 1;
    const prefix = input.slice(0, tokenStart);
    setInput(`${prefix}${entity.token} `);
    setMentionMenuOpen(false);
    setMentionIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSuggestedReply(suggestion) {
    if (!suggestion || status === "CONNECTING") return;

    setInput(suggestion);
    window.setTimeout(() => inputRef.current?.form?.requestSubmit(), 0);
  }

  return (
    <GameShell
      title=""
      emoji=""
      status={status}
      controls="Escribe tu mensaje y pulsa Enter | Shift + Enter para una nueva línea"
      onExit={onExit}
      showTitle={false}
      controlsInContent
      actionsInHeader
      hideHeader
      className={`game-shell--chacalon game-shell--${dayPhase}`}
      headerContent={dailyContext && (
        <div className="chacalon-context-status">
          CONTEXTO DEL DÍA · {dailyContext.region || "PERÚ"} · ACTUALIZADO {formatContextUpdatedAt(dailyContext.generatedAt)}
        </div>
      )}
      actions={
        <>
          <button className="btn" onClick={onExit} type="button">Salir</button>
          <button className="btn" onClick={resetChat} type="button">Reiniciar conversación</button>
        </>
      }
    >
      <KioskFrame context={dailyContext} onOpenNews={setSelectedNews}>
        <div className="chacalon-player">
        {musicBlocked && (
          <div className="chacalon-music__activation">
            <span>SI QUIERES UN CUMBIÓN CHACALONERO</span>
            <button
              className="btn chacalon-music__start"
              onClick={() => void startMusic({ userInitiated: true })}
              type="button"
            >
              ACTIVAR MÚSICA
            </button>
          </div>
        )}
        <div
          className="chacalon-visualizer"
          role="img"
          aria-label="Visualizador cumbiambero con ondas neon"
        >
          <canvas ref={visualizerCanvasRef} aria-hidden="true" />
          <div className="chacalon-visualizer__scanlines" aria-hidden="true" />
          <div className="chacalon-visualizer__overlay">
            <span>♪ CUMBIA</span>
            <span className="chacalon-visualizer__track-title">
              CANCIÓN: CABALLITO PIXELADO - LOOP
            </span>
            <span>{isPlaying ? "BAILANDO" : "PAUSA"}</span>
          </div>
        </div>
        <audio
          ref={audioRef}
          aria-label="Música de prueba 8-bit"
          loop
          preload="auto"
          className="chacalon-audio"
          onPlay={() => {
            setIsPlaying(true);
            setupAudioVisualizer();
            startVisualizer();
          }}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            setMusicBlocked(true);
            setIsPlaying(false);
          }}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          src={AUDIO_SRC}
        >
          Tu navegador no permite reproducir este audio.
        </audio>
        <div className="chacalon-player__controls">
          <button
            className="chacalon-player__play"
            type="button"
            onClick={toggleMusic}
            aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <span className="chacalon-player__time">{formatAudioTime(currentTime)}</span>
          <input
            className="chacalon-player__progress"
            type="range"
            aria-label="Progreso de la canción"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={handleProgressChange}
            disabled={!duration}
          />
          <span className="chacalon-player__time">{formatAudioTime(duration)}</span>
          <label className="chacalon-player__volume">
            VOL
            <input
              type="range"
              aria-label="Volumen de la música"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
            />
          </label>
        </div>
        </div>

        <div className="chacalon-main-grid">
        <div
          className={`chacalon-identity ${isPlaying ? "is-playing" : ""} ${
            isSaluting ? "is-saluting" : ""
          }`}
        >
          <div className="chacalon-identity__portrait-frame" ref={portraitFrameRef}>
            <img
              className="chacalon-identity__portrait"
              src={isWinking ? WINK_IMAGE_SRC : IMAGE_SRC}
              alt="Retrato arcade de Chacalón Virtual"
            />
            <img
              className="chacalon-identity__body-motion"
              src={BODY_MOTION_SRC}
              alt=""
              aria-hidden="true"
            />
            <img
              className="chacalon-identity__salute"
              src={SALUTE_IMAGE_SRC}
              alt=""
              aria-hidden="true"
              onAnimationEnd={finishSalute}
            />
          </div>
          <div className="chacalon-identity__copy">
            <div className="chacalon-identity__eyebrow">TRANSMISIÓN VISUAL ONLINE</div>
            <h3>CHACALÓN VIRTUAL</h3>
            <p>Homenaje interactivo · música chicha · arcade</p>
          </div>
        </div>

        <div className="chacalon-chat">
          <ConversationMessages
            messages={messages}
            playerName={playerName}
            status={status}
            messagesEndRef={messagesEndRef}
            onSuggestedReply={handleSuggestedReply}
          />

          {error && <div className="banner banner-warn">{error}</div>}

          <ConversationComposer
            playerName={playerName}
            input={input}
            inputRef={inputRef}
            status={status}
            controls="Escribe tu mensaje y pulsa Enter | Shift + Enter para una nueva línea"
            slashCommands={slashCommands}
            slashCommandIndex={slashCommandIndex}
            slashActiveOptionRef={slashActiveOptionRef}
            showSlashMenu={showSlashMenu}
            onSlashCommandSelect={handleSlashCommandSelect}
            mentionOptions={mentionOptions}
            mentionIndex={mentionIndex}
            mentionActiveOptionRef={mentionActiveOptionRef}
            showMentionMenu={showMentionMenu}
            onMentionSelect={handleMentionSelect}
            onInputChange={handleInputChange}
            onInputKeyDown={handleInputKeyDown}
            onSubmit={sendMessage}
          />
        </div>
        </div>
      </KioskFrame>
      {selectedNews && (
        <div className="news-modal" role="dialog" aria-modal="true" aria-label="Detalle de noticia">
          <button className="news-modal__close" type="button" onClick={() => setSelectedNews(null)} aria-label="Cerrar noticia">×</button>
          <div className="news-modal__masthead">{selectedNews.source || "EL KIOSKO"}</div>
          <div className="news-modal__rule" />
          <div className="news-modal__category">NOTICIAS</div>
          {selectedNews.image && <img className="news-modal__image" src={selectedNews.image} alt="" />}
          <h2>{selectedNews.title}</h2>
          <p>{selectedNews.summary || "Consulta la noticia completa en el medio original."}</p>
          {selectedNews.url && (
            <a className="btn news-modal__link" href={selectedNews.url} target="_blank" rel="noreferrer">
              IR A LA NOTICIA ORIGINAL ↗
            </a>
          )}
        </div>
      )}
    </GameShell>
  );
}

export {
  extractRequestedName,
  compactDailyContext,
  formatContextUpdatedAt,
  getConversationSuggestions,
  getFallbackReply,
  getMentionOptions,
  shouldUseDailyContext,
  toApiHistory,
};
