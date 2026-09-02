import React, { useMemo, useState } from "react";
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

function createId() {
  return `manual-news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export default function NewsAdmin() {
  const [items, setItems] = useState(loadManualNews);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");

  const categoryLabels = useMemo(() => Object.fromEntries(NEWS_CATEGORIES), []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
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

    setItems(saveManualNews(nextItems));
    setNotice(editingId ? "Noticia actualizada." : "Noticia agregada al bloque prioritario.");
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
    setItems(saveManualNews(items.filter(({ id }) => id !== item.id)));
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
    setItems(saveManualNews(reordered));
    setNotice("Orden editorial actualizado.");
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
          <Link className="news-admin__back" to="/">Volver al kiosko</Link>
        </header>

        <form className="news-admin__form" onSubmit={handleSubmit}>
          <div className="news-admin__form-heading">
            <h2>{editingId ? "Editar noticia" : "Agregar noticia prioritaria"}</h2>
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
              <input name="image" type="url" value={form.image} onChange={updateField} placeholder="https://..." />
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
                    <strong>{item.title}</strong>
                    <span>{item.source} · {categoryLabels[item.category] || "Política"}{item.active === false ? " · OCULTA" : ""}</span>
                  </div>
                  <div className="news-admin__item-actions">
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
