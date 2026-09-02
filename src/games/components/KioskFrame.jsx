import React from "react";
import NewspaperCover from "./NewspaperCover";
import kioskPanorama from "../../assets/chacalon-kiosk-panorama.png";
import counterExtension from "../../assets/chacalon-counter-extension.png";

const RACK_CATEGORIES = ["politica", "economia", "sociedad", "cultura"];
const ADMIN_NEWS_BASE = process.env.NODE_ENV === "production"
  ? (process.env.PUBLIC_URL || "/chacalon")
  : "";
const ADMIN_NEWS_URL = `${ADMIN_NEWS_BASE.replace(/\/$/, "")}/admin/noticias`;

function getNewsKey(item) {
  return item.url || `${item.source || ""}::${item.title || ""}`;
}

function getRackItems(context, categories, usedKeys = new Set()) {
  const items = categories.flatMap((category) =>
    (Array.isArray(context?.topics?.[category]) ? context.topics[category] : [])
      .map((item) => ({ ...item, category }))
  );
  const visibleItems = items.filter((item) => {
    if (usedKeys.has(getNewsKey(item))) return false;
    if (item.isManual) return true;
    const source = String(item.source || "").toLocaleLowerCase("es-PE");
    return !source.includes("agencia andina") && !source.includes("infobae");
  });
  const preferred = (item) => {
    if (item.isManual) return 0;
    const source = String(item.source || "").toLocaleLowerCase("es-PE");
    const hasImage = item.image || item.imageUrl || item.thumbnail;
    const preferredSource = source.includes("la república") || source.includes("hildebrandt");
    return (hasImage ? 0 : 2) + (preferredSource ? 0 : 1);
  };
  const selected = visibleItems
    .sort((first, second) => preferred(first) - preferred(second))
    .slice(0, 3);
  selected.forEach((item) => usedKeys.add(getNewsKey(item)));
  return selected;
}

function KioskRack({ title, items, onOpenNews }) {
  return (
    <aside className="kiosk-rack" aria-label={title}>
      <div className="kiosk-rack__papers">
        {items.map((item, index) => (
          <NewspaperCover
            item={item}
            category={item.category}
            onOpen={onOpenNews}
            key={`${item.url || item.title}-${index}`}
          />
        ))}
      </div>
    </aside>
  );
}

function KioskProducts() {
  return (
    <div className="kiosk-products" aria-label="Productos del kiosko">
      <span>GOLOSINAS</span>
      <span>LOTITO</span>
      <span>POSTALES DE LIMA</span>
      <span>CHICHA Y BARRIO</span>
    </div>
  );
}

export default function KioskFrame({ context, children, onOpenNews }) {
  const usedNewsKeys = new Set();
  const leftItems = getRackItems(context, RACK_CATEGORIES.slice(0, 2), usedNewsKeys);
  const centerItems = getRackItems(context, ["cultura", "economia"], usedNewsKeys);
  const rightItems = getRackItems(context, RACK_CATEGORIES.slice(2), usedNewsKeys);

  return (
    <section className="kiosk-frame" aria-label="Kiosko de Chacalón">
      <img
        className="kiosk-scene-layer kiosk-scene-layer--interior"
        src={kioskPanorama}
        alt=""
        aria-hidden="true"
      />
      <img
        className="kiosk-scene-layer kiosk-scene-layer--counter"
        src={kioskPanorama}
        alt=""
        aria-hidden="true"
      />
      <div className="kiosk-counter-extension-layer" aria-hidden="true">
        <img src={counterExtension} alt="" />
      </div>
      <header className="kiosk-sign">
        <div className="kiosk-sign__identity">
          <span className="kiosk-sign__lights" aria-hidden="true">✦ ✦ ✦</span>
          <h1>KIOSKO DE CHACALÓN</h1>
          <p>DIARIOS · REVISTAS · NOTICIAS · BUENA CONVERSA</p>
          <a className="kiosk-sign__admin-link" href={ADMIN_NEWS_URL}>Administrar noticias</a>
        </div>
      </header>

      <KioskRack title="EL DIARIO" items={leftItems} onOpenNews={onOpenNews} />
      <KioskRack
        title="ANAQUEL CENTRAL"
        items={centerItems}
        onOpenNews={onOpenNews}
      />
      <div className="kiosk-center kiosk-center--right">
        {children}
      </div>
      <KioskRack title="REVISTAS Y MÁS" items={rightItems} onOpenNews={onOpenNews} />

      <div className="kiosk-bottom kiosk-bottom--left" aria-hidden="true">
        EDICIONES DEL DÍA · CENTRO DE LIMA
      </div>
      <div className="kiosk-bottom kiosk-bottom--right">
        <KioskProducts />
      </div>
    </section>
  );
}
