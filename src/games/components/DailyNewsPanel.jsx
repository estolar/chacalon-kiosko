import React from "react";
import NewspaperCover from "./NewspaperCover";

export default function DailyNewsPanel({ context }) {
  if (!context) return null;

  const items = Object.entries(context.topics || {}).flatMap(([category, entries]) =>
    (Array.isArray(entries) ? entries : []).slice(0, 2).map((item) => ({
      ...item,
      category,
    }))
  ).slice(0, 8);

  return (
    <section className="chacalon-news-panel" aria-labelledby="chacalon-news-title">
      <div className="chacalon-news-panel__header">
        <h2 id="chacalon-news-title">TITULARES DEL PUESTO</h2>
        <span>{items.length} disponibles</span>
      </div>
      {items.length > 0 ? (
        <div className="chacalon-news-panel__grid">
          {items.map((item, index) => (
            <NewspaperCover
              item={item}
              category={item.category}
              key={`${item.url || item.title}-${index}`}
            />
          ))}
        </div>
      ) : (
        <p className="chacalon-news-panel__empty">No hay titulares disponibles.</p>
      )}
    </section>
  );
}
