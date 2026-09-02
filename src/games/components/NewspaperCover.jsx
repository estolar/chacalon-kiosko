import React from "react";

const CATEGORY_COLORS = {
  politica: "#2d8cff",
  economia: "#39ff14",
  sociedad: "#ff8c00",
  cultura: "#ff00ff",
};

const BRAND_THEMES = [
  ["ojo", { color: "#0a9f45", ink: "#075f2c", logo: "ojo.pe" }],
  ["infobae", { color: "#d71920", ink: "#8c1015", logo: "infobae.com" }],
  ["agencia andina", { color: "#1389c9", ink: "#07547e", logo: "andina.pe" }],
  ["la república", { color: "#e21b23", ink: "#8a1116", logo: "larepublica.pe" }],
  ["el comercio", { color: "#ed1c24", ink: "#851016", logo: "elcomercio.pe" }],
  ["el peruano", { color: "#0b5da7", ink: "#073b6a", logo: "elperuano.pe" }],
  ["gestión", { color: "#1d4f91", ink: "#102e57", logo: "gestion.pe" }],
  ["perú21", { color: "#f58220", ink: "#91490e", logo: "peru21.pe" }],
  ["trome", { color: "#e31b23", ink: "#851016", logo: "trome.pe" }],
  ["hildenbrandt", { color: "#7a1f32", ink: "#4e1420", logo: "hildebrandtensustrece.com" }],
  ["exitosa", { color: "#ef2027", ink: "#8d1217", logo: "exitosa.pe" }],
];

function getBrandTheme(source) {
  const normalized = String(source || "").toLocaleLowerCase("es-PE");
  return BRAND_THEMES.find(([name]) => normalized.includes(name))?.[1] || {
    color: "#1d6fa5",
    ink: "#123f5d",
  };
}

function getLogoUrl(brand) {
  return brand.logo
    ? `https://www.google.com/s2/favicons?domain=${brand.logo}&sz=128`
    : "";
}

function formatEditionDate(value) {
  if (!value) return "EDICIÓN DEL DÍA";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "EDICIÓN DEL DÍA";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Lima",
  }).format(date).toUpperCase();
}

export default function NewspaperCover({ item, category, onOpen }) {
  const image = item.image || item.imageUrl || item.thumbnail;
  const accent = CATEGORY_COLORS[category] || "#00ffff";
  const brand = getBrandTheme(item.source);
  const CoverTag = item.url ? "a" : "article";
  const coverLinkProps = item.url && !onOpen
    ? { href: item.url, target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <CoverTag
      className="newspaper-cover"
      style={{
        "--newspaper-accent": accent,
        "--newspaper-brand": brand.color,
        "--newspaper-ink": brand.ink,
      }}
      aria-label={item.url ? `Leer noticia: ${item.title || "titular"}` : undefined}
      onClick={onOpen ? (event) => {
        event.preventDefault();
        onOpen(item);
      } : undefined}
      {...coverLinkProps}
    >
      <header className="newspaper-cover__masthead">
        <span className="newspaper-cover__brand">
          {getLogoUrl(brand) && <img src={getLogoUrl(brand)} alt="" aria-hidden="true" />}
          <strong>{item.source || "EL KIOSKO"}</strong>
        </span>
        <small>{formatEditionDate(item.publishedAt)} · S/ 1.20</small>
      </header>
      <div className="newspaper-cover__rule" />
      <div className="newspaper-cover__visual">
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">
            {(category || "kiosko").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="newspaper-cover__category">
          {category.replace(/_/g, " ").toUpperCase()}
        </div>
      </div>
      <h3 title={item.title || "Titular sin título"}>
        {item.title || "Titular sin título"}
      </h3>
      <div className="newspaper-cover__hover-detail">
        <span>{item.summary || "Ver el detalle de esta noticia."}</span>
        <strong>{item.url ? "ABRIR NOTICIA ↗" : "SIN ENLACE"}</strong>
      </div>
    </CoverTag>
  );
}
