export const MANUAL_NEWS_STORAGE_KEY = "chacalon-kiosko.manual-news.v1";

export const NEWS_CATEGORIES = [
  ["politica", "Política"],
  ["economia", "Economía"],
  ["sociedad", "Sociedad"],
  ["cultura", "Cultura"],
];

// Estas portadas conservan la selección editorial que estaba visible antes
// de que el contexto automático se actualizara.
export const DEFAULT_MANUAL_NEWS = [
  {
    id: "manual-hildebrandt-policia",
    category: "politica",
    title: "Escándalo en la Policía",
    summary: "Un reportaje examina la falta de ejecución de fondos destinados a equipamiento policial y las denuncias dentro de la institución.",
    source: "Hildebrandt en sus trece",
    url: "https://www.hildebrandtensustrece.com/reportaje/articulo/3053",
    image: "https://www.hildebrandtensustrece.com/storage/reportaje/hVBeDlrEzIryyBCXiTEGcV4X7SxvFjgV1gMCGvCm.jpg",
    publishedAt: "2026-09-01T00:00:00Z",
    priority: 100,
    active: true,
  },
  {
    id: "manual-comercio-beingolea",
    category: "politica",
    title: "Ministro Alberto Beingolea sobre Óscar Arriola: “No es que sacando a un funcionario el problema se va a resolver”",
    summary: "El ministro de Cultura, Alberto Beingolea, se pronunció sobre la permanencia de Óscar Arriola en la Comandancia General de la Policía Nacional.",
    source: "El Comercio Perú",
    url: "https://elcomercio.pe/politica/gobierno/ministro-alberto-beingolea-sobre-oscar-arriola-no-es-que-sacando-a-un-funcionario-el-problema-se-va-a-resolver-pnp-trujillo-ultimas-noticia/",
    image: "https://elcomercio.pe/resizer/v2/CQEAWLLA5BCQZKHLDDPUQDSN3A.jpg?smart=true&width=1200&height=803",
    publishedAt: "2026-09-02T00:19:12Z",
    priority: 90,
    active: true,
  },
  {
    id: "manual-comercio-iran",
    category: "politica",
    title: "Perú rompe relaciones diplomáticas con Irán",
    summary: "El Gobierno peruano rompió relaciones diplomáticas con la República Islámica de Irán.",
    source: "El Comercio Perú",
    url: "https://elcomercio.pe/politica/gobierno/peru-rompe-relaciones-diplomaticas-con-la-republica-islamica-de-iran-medio-oriente-ultimas-noticia/",
    image: "https://elcomercio.pe/resizer/v2/ERDGBDXCL5DHTG6GQWAOTTJJGQ.jpg?smart=true&width=1200&height=800",
    publishedAt: "2026-09-02T00:00:50Z",
    priority: 80,
    active: true,
  },
  {
    id: "manual-gestion-lluvias",
    category: "economia",
    title: "El Niño: Gobierno declara emergencia en varias regiones del país ante peligro de lluvias",
    summary: "El Gobierno declaró el estado de emergencia en varios distritos por peligro inminente ante precipitaciones pluviales intensas.",
    source: "Gestión",
    url: "https://gestion.pe/peru/gobiernode-keiko-fujimori-declara-emergencia-en-varias-regiones-ante-peligro-de-lluvias-por-el-nino-noticia/",
    image: "https://gestion.pe/resizer/v2/BRQQVFLE3JAEJOFX53CMHI3AGQ.jpg?smart=true&width=1200&height=800",
    publishedAt: "2026-09-02T03:48:00Z",
    priority: 70,
    active: true,
  },
  {
    id: "manual-gestion-ahorros",
    category: "economia",
    title: "MEF revierte decisión y ahora descarta aplicar impuestos a intereses de cuentas de ahorro",
    summary: "El Ministerio de Economía y Finanzas informó que no tiene previsto aplicar un impuesto a los intereses de las cuentas de ahorro.",
    source: "Gestión",
    url: "https://gestion.pe/economia/mef-revierte-decision-y-ahora-descarta-aplicar-impuestos-a-intereses-de-cuentas-de-ahorro-noticia/",
    image: "https://gestion.pe/resizer/v2/INDZG4GRGBBNFNQECXJZKOGDGY.jpg?smart=true&width=1594&height=900",
    publishedAt: "2026-09-02T02:30:26Z",
    priority: 60,
    active: true,
  },
  {
    id: "manual-gestion-marsa",
    category: "economia",
    title: "Minera Marsa alista inversión cercana a US$ 980 millones para extender operación de oro",
    summary: "La minera presentó ante el Senace un estudio ambiental para ampliar la continuidad de la operación Retamas.",
    source: "Gestión",
    url: "https://gestion.pe/economia/empresas/marsa-alista-inversion-de-us-980-millones-para-ampliar-en-20-anos-la-vida-util-de-mina-en-pataz-noticia/",
    image: "https://gestion.pe/resizer/v2/BQQH3NCHHZGN3I3K3AM7NDKU34.jpg?smart=true&width=1214&height=746",
    publishedAt: "2026-09-02T02:16:00Z",
    priority: 50,
    active: true,
  },
];

function cleanText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}
function normalizeNewsItem(item, index = 0) {
  if (!item || typeof item !== "object") return null;

  const title = cleanText(item.title);
  const source = cleanText(item.source, "EL KIOSKO");
  if (!title) return null;

  return {
    id: cleanText(item.id, `manual-news-${Date.now()}-${index}`),
    category: NEWS_CATEGORIES.some(([category]) => category === item.category)
      ? item.category
      : "politica",
    title,
    summary: cleanText(item.summary),
    source,
    url: cleanText(item.url),
    image: cleanText(item.image || item.imageUrl || item.thumbnail),
    publishedAt: cleanText(item.publishedAt, new Date().toISOString()),
    priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 0,
    active: item.active !== false,
    isManual: true,
  };
}

export function sortManualNews(items) {
  return [...items].sort((first, second) =>
    second.priority - first.priority || first.title.localeCompare(second.title, "es-PE")
  );
}

export function loadManualNews() {
  if (typeof window === "undefined") {
    return sortManualNews(DEFAULT_MANUAL_NEWS.map(normalizeNewsItem).filter(Boolean));
  }

  try {
    const stored = window.localStorage.getItem(MANUAL_NEWS_STORAGE_KEY);
    if (stored === null) {
      return sortManualNews(DEFAULT_MANUAL_NEWS.map(normalizeNewsItem).filter(Boolean));
    }

    const parsed = JSON.parse(stored);
    return sortManualNews(Array.isArray(parsed) ? parsed.map(normalizeNewsItem).filter(Boolean) : []);
  } catch {
    return sortManualNews(DEFAULT_MANUAL_NEWS.map(normalizeNewsItem).filter(Boolean));
  }
}

export function saveManualNews(items) {
  const normalized = sortManualNews(
    (Array.isArray(items) ? items : []).map(normalizeNewsItem).filter(Boolean)
  );
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MANUAL_NEWS_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

function newsKey(item) {
  return cleanText(item?.url) || `${cleanText(item?.source).toLocaleLowerCase("es-PE")}::${cleanText(item?.title).toLocaleLowerCase("es-PE")}`;
}

export function mergeManualNewsIntoContext(context, manualNews = loadManualNews()) {
  if (!context || typeof context !== "object") return context;

  const activeManual = sortManualNews(manualNews.filter((item) => item.active !== false));
  const manualKeys = new Set(activeManual.map(newsKey));
  const categories = { ...(context.topics || {}) };

  for (const [category] of NEWS_CATEGORIES) {
    const manualItems = activeManual
      .filter((item) => item.category === category)
      .map((item) => ({ ...item, isManual: true }));
    const automaticItems = (Array.isArray(categories[category]) ? categories[category] : [])
      .filter((item) => !manualKeys.has(newsKey(item)))
      .map((item) => ({ ...item, isManual: false }));
    categories[category] = [...manualItems, ...automaticItems];
  }

  return { ...context, topics: categories };
}
