import {
  DEFAULT_MANUAL_NEWS,
  MANUAL_NEWS_STORAGE_KEY,
  loadManualNews,
  mergeManualNewsIntoContext,
  saveManualNews,
} from "./manualNews";

describe("manualNews", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("recupera la selección editorial inicial cuando aún no hay cambios guardados", () => {
    const items = loadManualNews();

    expect(items).toHaveLength(DEFAULT_MANUAL_NEWS.length);
    expect(items[0].source).toMatch(/Hildebrandt/i);
    expect(items.every((item) => item.isManual)).toBe(true);
  });

  test("guarda y recupera las noticias administradas en el navegador", () => {
    const saved = saveManualNews([
      {
        id: "manual-test",
        title: "Titular de prueba",
        source: "Fuente de prueba",
        category: "cultura",
        priority: 77,
        active: true,
      },
    ]);

    expect(window.localStorage.getItem(MANUAL_NEWS_STORAGE_KEY)).toContain("Titular de prueba");
    expect(loadManualNews()).toEqual(saved);
  });

  test("pone las noticias manuales primero y evita duplicados automáticos", () => {
    const context = {
      topics: {
        politica: [
          { title: "Titular automático", source: "Google News", url: "https://auto.test" },
          { title: "Titular manual", source: "Fuente original", url: "https://manual.test" },
        ],
      },
    };
    const manual = [{
      id: "manual-test",
      title: "Titular manual",
      source: "Fuente original",
      category: "politica",
      url: "https://manual.test",
      priority: 100,
      active: true,
    }];

    const merged = mergeManualNewsIntoContext(context, manual);

    expect(merged.topics.politica).toHaveLength(2);
    expect(merged.topics.politica[0].title).toBe("Titular manual");
    expect(merged.topics.politica[0].isManual).toBe(true);
    expect(merged.topics.politica[1].title).toBe("Titular automático");
    expect(merged.topics.politica[1].isManual).toBe(false);
  });
});
