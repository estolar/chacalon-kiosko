import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  NEWS_CATEGORIES,
  loadManualNews,
  saveManualNews,
} from "../news/manualNews";

const EMPTY_FORM = {
  title: "",
  source: "",
  category: "politica",
  summary: "",
  image: "",
  url: "",
  priority: 50,
  active: true,
};
const PUBLIC_BASE_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const NEWS_API_BASE_URL = process.env.NODE_ENV === "production" ? PUBLIC_BASE_URL : "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const LOCAL_AUTH_ENABLED = process.env.REACT_APP_ADMIN_AUTH === "local";
const AUTH_REQUIRED = IS_PRODUCTION || LOCAL_AUTH_ENABLED;
const LOCAL_ADMIN_USERNAME = process.env.REACT_APP_ADMIN_USERNAME || "admin";
const LOCAL_ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || "chacalon-local";
const ADMIN_SESSION_API_URL = process.env.REACT_APP_ADMIN_SESSION_API_URL || `${NEWS_API_BASE_URL}/api/admin/session.php`;
const ADMIN_LOGIN_API_URL = process.env.REACT_APP_ADMIN_LOGIN_API_URL || `${NEWS_API_BASE_URL}/api/admin/login.php`;
const ADMIN_LOGOUT_API_URL = process.env.REACT_APP_ADMIN_LOGOUT_API_URL || `${NEWS_API_BASE_URL}/api/admin/logout.php`;
const NEWS_IMPORT_API_URL = process.env.REACT_APP_NEWS_IMPORT_API_URL || `${NEWS_API_BASE_URL}/api/news/import`;
const NEWS_MANUAL_API_URL = process.env.REACT_APP_NEWS_MANUAL_API_URL || `${NEWS_API_BASE_URL}/api/news/manual`;
const NEWS_GENERATE_IMAGE_API_URL = process.env.REACT_APP_NEWS_GENERATE_IMAGE_API_URL || `${NEWS_API_BASE_URL}/api/news/generate-image`;

function createId() {
  return `manual-news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchServerItems(token) {
  const response = await fetch(NEWS_MANUAL_API_URL, {
    cache: "no-store",
    credentials: "same-origin",
    headers: token ? { "X-CSRF-Token": token } : {},
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(payload.items)) {
    const error = new Error(payload.error || "No se pudieron cargar las noticias.");
    error.status = response.status;
    throw error;
  }
  return payload.items;
}

export default function NewsAdmin() {
  const [items, setItems] = useState(AUTH_REQUIRED ? [] : loadManualNews);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [articleUrls, setArticleUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [imageStatus, setImageStatus] = useState({});
  const [generatingImageId, setGeneratingImageId] = useState(null);
  const [authState, setAuthState] = useState(AUTH_REQUIRED ? "checking" : "local");
  const [authError, setAuthError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const categoryLabels = useMemo(() => Object.fromEntries(NEWS_CATEGORIES), []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (LOCAL_AUTH_ENABLED) {
        const localSession = window.sessionStorage.getItem("chacalon-admin-local-session");
        if (active) {
          setAuthState(localSession ? "authenticated" : "unauthenticated");
          if (localSession) setItems(loadManualNews());
        }
        return;
      }
      if (IS_PRODUCTION) {
        try {
          const sessionResponse = await fetch(ADMIN_SESSION_API_URL, { cache: "no-store", credentials: "same-origin" });
          const sessionPayload = await sessionResponse.json().catch(() => ({}));
          if (sessionResponse.status === 401) {
            if (active) setAuthState("unauthenticated");
            return;
          }
          if (!sessionResponse.ok || !sessionPayload.csrfToken) {
            throw new Error(sessionPayload.error || "No se pudo comprobar la sesión administrativa.");
          }
          if (active) {
            setCsrfToken(sessionPayload.csrfToken);
            setAuthState("authenticated");
          }
          const serverItems = await fetchServerItems(sessionPayload.csrfToken);
          if (active) setItems(saveManualNews(serverItems));
        } catch (error) {
          if (active) {
            if (error.status === 401) {
              setAuthState("unauthenticated");
            } else {
              setAuthError(error.message);
              setAuthState("error");
            }
          }
        }
        return;
      }

      try {
        const response = await fetch(NEWS_MANUAL_API_URL, { cache: "no-store" });
        const payload = response.ok ? await response.json() : null;
        if (active && Array.isArray(payload?.items)) setItems(saveManualNews(payload.items));
      } catch {
        // El administrador conserva la copia local si el proxy todavía no está levantado.
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  function protectedHeaders() {
    return {
      "Content-Type": "application/json",
      ...(IS_PRODUCTION && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    };
  }

  async function handleLogin(event) {
    event.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");
    try {
      if (LOCAL_AUTH_ENABLED) {
        if (username !== LOCAL_ADMIN_USERNAME || password !== LOCAL_ADMIN_PASSWORD) {
          throw new Error("Usuario o contraseña incorrectos.");
        }
        window.sessionStorage.setItem("chacalon-admin-local-session", "active");
        setPassword("");
        setAuthState("authenticated");
        setItems(loadManualNews());
        return;
      }
      const response = await fetch(ADMIN_LOGIN_API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.csrfToken) throw new Error(payload.error || "No se pudo iniciar sesión.");
      setCsrfToken(payload.csrfToken);
      setPassword("");
      setAuthState("authenticated");
      setItems(saveManualNews(await fetchServerItems(payload.csrfToken)));
    } catch (error) {
      setAuthError(error.message);
      setAuthState("unauthenticated");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (LOCAL_AUTH_ENABLED) {
      window.sessionStorage.removeItem("chacalon-admin-local-session");
      setAuthState("unauthenticated");
      setItems([]);
      return;
    }
    try {
      await fetch(ADMIN_LOGOUT_API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: protectedHeaders(),
      });
    } finally {
      setCsrfToken("");
      setAuthState("unauthenticated");
      setItems([]);
    }
  }

  async function persistItems(nextItems, successMessage) {
    const normalized = saveManualNews(nextItems);
    setItems(normalized);
    if (LOCAL_AUTH_ENABLED) {
      if (successMessage) setNotice(`${successMessage} (modo local)`);
      return normalized;
    }
    if (IS_PRODUCTION && authState !== "authenticated") {
      setNotice("Inicia sesión para guardar cambios en el servidor.");
      return normalized;
    }
    try {
      const response = await fetch(NEWS_MANUAL_API_URL, {
        method: "PUT",
        credentials: "same-origin",
        headers: protectedHeaders(),
        body: JSON.stringify({ items: normalized }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) setAuthState("unauthenticated");
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar en el servidor.");
      if (Array.isArray(payload.items)) setItems(saveManualNews(payload.items));
      if (successMessage) setNotice(successMessage);
    } catch (error) {
      setNotice(IS_PRODUCTION
        ? error.message
        : `${successMessage || "Cambios guardados localmente."} ${error.message} Se conservaron en este navegador.`);
    }
    return normalized;
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleImport(event) {
    event.preventDefault();
    const urls = [...new Set(articleUrls.split(/\s+/).map((url) => url.trim()).filter(Boolean))];
    if (!urls.length) {
      setNotice("Pega uno o varios enlaces para publicarlos.");
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    setNotice("Leyendo los artículos y preparando las portadas...");
    try {
      const response = await fetch(NEWS_IMPORT_API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: protectedHeaders(),
        body: JSON.stringify({ urls }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) setAuthState("unauthenticated");
      if (!response.ok && !payload.items?.length) {
        throw new Error(payload.error || "No se pudieron importar las noticias.");
      }

      const existingUrls = new Set(items.map((item) => item.url).filter(Boolean));
      const newItems = (payload.items || []).filter((item) => !existingUrls.has(item.url));
      await persistItems([...newItems, ...items]);
      setArticleUrls("");
      setNotice(`${newItems.length} noticia${newItems.length === 1 ? "" : "s"} publicada${newItems.length === 1 ? "" : "s"} en el bloque prioritario.`);
      setImportErrors(payload.errors || []);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsImporting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.source.trim()) {
      setNotice("Completa por lo menos el titular y la fuente.");
      return;
    }

    const nextItem = {
      ...form,
      id: editingId || createId(),
      priority: Number(form.priority) || 0,
      publishedAt: new Date().toISOString(),
      isManual: true,
    };
    const nextItems = editingId
      ? items.map((item) => (item.id === editingId ? { ...item, ...nextItem } : item))
      : [...items, nextItem];

    persistItems(nextItems, editingId ? "Noticia actualizada." : "Noticia agregada al bloque prioritario.");
    resetForm();
  }

  function editItem(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      source: item.source || "",
      category: item.category || "politica",
      summary: item.summary || "",
      image: item.image || "",
      url: item.url || "",
      priority: item.priority ?? 0,
      active: item.active !== false,
    });
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteItem(item) {
    if (!window.confirm(`¿Eliminar “${item.title}” de las noticias prioritarias?`)) return;
    persistItems(items.filter(({ id }) => id !== item.id));
    if (editingId === item.id) resetForm();
    setNotice("Noticia eliminada. Google News ocupará su lugar disponible.");
  }

  function moveItem(item, direction) {
    const sorted = [...items];
    const index = sorted.findIndex(({ id }) => id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;

    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    const reordered = sorted.map((entry, position) => ({
      ...entry,
      priority: (sorted.length - position) * 10,
    }));
    persistItems(reordered, "Orden editorial actualizado.");
  }

  async function generateImage(item) {
    setGeneratingImageId(item.id);
    setNotice(`Generando una imagen para “${item.title}”...`);
    try {
      const response = await fetch(NEWS_GENERATE_IMAGE_API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: protectedHeaders(),
        body: JSON.stringify({
          title: item.title,
          summary: item.summary,
          source: item.source,
          category: item.category,
          newsId: item.id,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) setAuthState("unauthenticated");
      if (!response.ok || !payload.image) {
        throw new Error(payload.detail || payload.error || "El servidor no devolvió una imagen.");
      }

      const nextItems = items.map((entry) =>
        entry.id === item.id ? { ...entry, image: payload.image } : entry
      );
      await persistItems(nextItems, "Imagen generada y guardada en la noticia.");
      setImageStatus((current) => ({ ...current, [item.id]: "loading" }));
    } catch (error) {
      setNotice(`No se pudo generar la imagen: ${error.message}`);
    } finally {
      setGeneratingImageId(null);
    }
  }

  if (AUTH_REQUIRED && authState !== "authenticated") {
    return (
      <main className="news-admin-page">
        <section className="news-admin news-admin--auth" aria-labelledby="news-admin-auth-title">
          <header className="news-admin__header">
            <div>
              <p className="news-admin__eyebrow">KIOSKO DE CHACALÓN · ACCESO RESTRINGIDO</p>
              <h1 id="news-admin-auth-title">Administrador de noticias</h1>
              <p>{LOCAL_AUTH_ENABLED ? "Modo local de prueba: inicia sesión para revisar el flujo del administrador." : "Inicia sesión para importar, editar y publicar noticias."}</p>
            </div>
            <Link className="news-admin__back" to="/">Volver al kiosko</Link>
          </header>
          {authState === "checking" && <p className="news-admin__notice news-admin__notice--block">Comprobando sesión...</p>}
          {authState === "error" && (
            <div className="news-admin__auth-message" role="alert">
              <p>{authError}</p>
              <button className="news-admin__submit" type="button" onClick={() => window.location.reload()}>Reintentar</button>
            </div>
          )}
          {authState === "unauthenticated" && (
            <form className="news-admin__login" onSubmit={handleLogin}>
              <label>Usuario<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
              <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
              {authError && <p className="news-admin__auth-error" role="alert">{authError}</p>}
              <button className="news-admin__submit" type="submit" disabled={isLoggingIn}>{isLoggingIn ? "ENTRANDO..." : "INICIAR SESIÓN"}</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="news-admin-page">
      <section className="news-admin" aria-labelledby="news-admin-title">
        <header className="news-admin__header">
          <div>
            <p className="news-admin__eyebrow">KIOSKO DE CHACALÓN · EDICIÓN MANUAL</p>
            <h1 id="news-admin-title">Administrador de noticias</h1>
            <p>
              Las noticias manuales aparecen primero. Google News completa los espacios que queden libres.
            </p>
          </div>
          <div className="news-admin__header-actions">
            {AUTH_REQUIRED && <button className="news-admin__back" type="button" onClick={handleLogout}>Cerrar sesión</button>}
            <Link className="news-admin__back" to="/">Volver al kiosko</Link>
          </div>
        </header>

        <form className="news-admin__importer" onSubmit={handleImport}>
          <div>
            <p className="news-admin__eyebrow">PUBLICACIÓN DIRECTA</p>
            <h2>Pega los enlaces de las noticias</h2>
            <p>El sistema leerá cada sitio y preparará el titular, resumen, fuente, imagen y categoría. Si la imagen no está disponible, podrás generarla desde la lista.</p>
          </div>
          <textarea
            value={articleUrls}
            onChange={(event) => setArticleUrls(event.target.value)}
            rows="4"
            placeholder={"https://www.hildebrandtensustrece.com/reportaje/articulo/3055\nhttps://larepublica.pe/politica/..."}
            aria-label="Enlaces de noticias para publicar"
          />
          <button className="news-admin__submit" type="submit" disabled={isImporting}>
            {isImporting ? "LEYENDO Y PUBLICANDO..." : "LEER Y PUBLICAR"}
          </button>
          {importErrors.length > 0 && (
            <ul className="news-admin__import-errors">
              {importErrors.map((entry) => <li key={entry.url}>{entry.url}: {entry.error}</li>)}
            </ul>
          )}
        </form>

        <form className="news-admin__form" onSubmit={handleSubmit}>
          <div className="news-admin__form-heading">
            <h2>{editingId ? "Editar noticia publicada" : "Agregar manualmente (opcional)"}</h2>
            {editingId && <button type="button" className="news-admin__text-button" onClick={resetForm}>Cancelar edición</button>}
          </div>
          <div className="news-admin__fields">
            <label>
              Titular
              <input name="title" value={form.title} onChange={updateField} placeholder="Escribe el titular" required />
            </label>
            <label>
              Fuente
              <input name="source" value={form.source} onChange={updateField} placeholder="El Comercio, Gestión..." required />
            </label>
            <label>
              Categoría
              <select name="category" value={form.category} onChange={updateField}>
                {NEWS_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              Prioridad
              <input name="priority" type="number" min="0" max="999" value={form.priority} onChange={updateField} />
            </label>
            <label className="news-admin__wide">
              Resumen
              <textarea name="summary" value={form.summary} onChange={updateField} rows="3" placeholder="Texto breve para el detalle de la noticia" />
            </label>
            <label>
              Imagen (URL)
              <input name="image" type="text" value={form.image} onChange={updateField} placeholder="URL o archivo generado" />
            </label>
            <label>
              Enlace original (URL)
              <input name="url" type="url" value={form.url} onChange={updateField} placeholder="https://..." />
            </label>
          </div>
          <label className="news-admin__checkbox">
            <input name="active" type="checkbox" checked={form.active} onChange={updateField} />
            Mostrar esta noticia en el kiosko
          </label>
          <button className="news-admin__submit" type="submit">{editingId ? "Guardar cambios" : "Agregar al kiosko"}</button>
          {notice && <p className="news-admin__notice" role="status">{notice}</p>}
        </form>

        <section className="news-admin__list" aria-labelledby="news-admin-list-title">
          <div className="news-admin__list-heading">
            <h2 id="news-admin-list-title">Noticias manuales ({items.length})</h2>
            <span>Ordenadas por prioridad</span>
          </div>
          {items.length === 0 ? (
            <p className="news-admin__empty">No hay noticias manuales. El kiosko usará solo Google News.</p>
          ) : (
            <ol>
              {items.map((item, index) => (
                <li className={`news-admin__item ${item.active === false ? "is-disabled" : ""}`} key={item.id}>
                  <div className="news-admin__item-order">
                    <button type="button" onClick={() => moveItem(item, -1)} disabled={index === 0} aria-label={`Subir ${item.title}`}>↑</button>
                    <strong>{item.priority}</strong>
                    <button type="button" onClick={() => moveItem(item, 1)} disabled={index === items.length - 1} aria-label={`Bajar ${item.title}`}>↓</button>
                  </div>
                  <div className="news-admin__item-copy">
                    {item.image ? (
                      <img
                        className="news-admin__item-thumb"
                        src={item.image}
                        alt=""
                        loading="lazy"
                        onLoad={() => setImageStatus((current) => ({ ...current, [item.id]: "ok" }))}
                        onError={() => setImageStatus((current) => ({ ...current, [item.id]: "error" }))}
                      />
                    ) : (
                      <span className="news-admin__image-missing">SIN IMAGEN</span>
                    )}
                    <strong>{item.title}</strong>
                    <span>{item.source} · {categoryLabels[item.category] || "Política"}{item.active === false ? " · OCULTA" : ""}{imageStatus[item.id] === "error" ? " · IMAGEN NO DISPONIBLE" : ""}</span>
                  </div>
                  <div className="news-admin__item-actions">
                    {(!item.image || imageStatus[item.id] === "error") && (
                      <button type="button" onClick={() => generateImage(item)} disabled={generatingImageId === item.id}>
                        {generatingImageId === item.id ? "Generando..." : "Generar imagen"}
                      </button>
                    )}
                    <button type="button" onClick={() => editItem(item)}>Editar</button>
                    <button type="button" onClick={() => deleteItem(item)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}
