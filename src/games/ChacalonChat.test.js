import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChacalonChat, {
  extractRequestedName,
  getFallbackReply,
  shouldUseDailyContext,
  toApiHistory,
} from "./ChacalonChat";

describe("ChacalonChat", () => {
  const originalFetch = global.fetch;
  const originalPlay = HTMLMediaElement.prototype.play;
  const originalPause = HTMLMediaElement.prototype.pause;

  beforeAll(() => {
    HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.localStorage.clear();
  });

  afterAll(() => {
    HTMLMediaElement.prototype.play = originalPlay;
    HTMLMediaElement.prototype.pause = originalPause;
  });

  test("shows the virtual character introduction", () => {
    render(<ChacalonChat onExit={jest.fn()} />);

    expect(screen.getByText(/dime cómo te llamas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dile tu nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Música de prueba 8-bit/i)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Visualizador cumbiambero con ondas neon/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reproducir música|Pausar música/i })
    ).toBeInTheDocument();
    expect(screen.getByAltText(/Retrato arcade de Chacalón Virtual/i)).toBeInTheDocument();
  });

  test("plays the complete song in a loop", () => {
    render(<ChacalonChat onExit={jest.fn()} />);

    expect(screen.getByLabelText(/Música de prueba 8-bit/i)).toHaveAttribute(
      "src",
      expect.stringContaining("caballito-pixelado.mp3")
    );
    expect(screen.getByLabelText(/Música de prueba 8-bit/i)).toHaveAttribute("loop");
    expect(screen.getByText(/CANCIÓN COMPLETA EN LOOP/i)).toBeInTheDocument();
  });

  test("saves the first message as the player name", () => {
    render(<ChacalonChat onExit={jest.fn()} />);

    const textarea = screen.getByLabelText(/Dile tu nombre/i);
    fireEvent.change(textarea, { target: { value: "Enrique" } });
    fireEvent.submit(textarea.closest("form"));

    expect(screen.getAllByText("Enrique")).toHaveLength(2);
    expect(screen.getByText(/Bienvenido, causa/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("chacalon-virtual.player-name")).toBe("Enrique");
  });

  function enterPlayerName(name = "Enrique") {
    const textarea = screen.getByLabelText(/Dile tu nombre/i);
    fireEvent.change(textarea, { target: { value: name } });
    fireEvent.submit(textarea.closest("form"));
  }

  test("sends a message to the local AI server and renders the reply", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "¡Dale, hermano! La partida recién comienza." }),
    });

    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();
    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, { target: { value: "¿Qué juego me recomiendas?" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/La partida recién comienza/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/ai/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"playerName":"Enrique"'),
      })
    );
    expect(global.fetch.mock.calls[0][1].body).toContain(
      '"memory":["¿Qué juego me recomiendas?"]'
    );
  });

  test("renders a JSON API reply even when the browser exposes a response body stream", async () => {
    const getReader = jest.fn(() => {
      throw new Error("JSON responses must not be parsed as SSE");
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json; charset=utf-8" },
      body: { getReader },
      json: async () => ({ reply: "Respuesta recibida desde la API PHP." }),
    });

    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();
    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, { target: { value: "hola" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/Respuesta recibida desde la API PHP/i)).toBeInTheDocument();
    });
    expect(getReader).not.toHaveBeenCalled();
  });

  test("opens the quick command palette when the player types a slash command", () => {
    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();

    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, { target: { value: "/not" } });

    expect(screen.getByRole("listbox", { name: /Comandos rápidos/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /\/noticias.*Noticias del día/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /\/salud/i })).not.toBeInTheDocument();
  });

  test("recalls the saved player name in a later visit", () => {
    const firstVisit = render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName("Enrique");
    firstVisit.unmount();

    render(<ChacalonChat onExit={jest.fn()} />);

    expect(screen.getByText(/Hola de nuevo, Enrique/i)).toBeInTheDocument();
  });

  test("updates and persists the player name when requested in the chat", () => {
    const { container } = render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName("Holaaaa");

    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, {
      target: { value: "pero ahora quiero que cambies holaaaa por Quique" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    expect(screen.getByText(/Desde ahora te llamo Quique/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("chacalon-virtual.player-name")).toBe("Quique");

    const labels = Array.from(
      container.querySelectorAll(".chacalon-message__label")
    ).map((label) => label.textContent);
    expect(labels.filter((label) => label === "Quique")).toHaveLength(2);

    fireEvent.change(textarea, { target: { value: "Ahora cambia Quique por Gus" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    expect(screen.getByText(/Desde ahora te llamo Gus/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("chacalon-virtual.player-name")).toBe("Gus");
    expect(
      Array.from(container.querySelectorAll(".chacalon-message__label"))
        .filter((label) => label.textContent === "Gus")
    ).toHaveLength(3);
  });

  test("keeps a local fallback when the AI server is unavailable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));

    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();
    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, { target: { value: "Háblame de música chicha" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/modo de respaldo local/i)).toBeInTheDocument();
    });
  });

  test("uses the local fallback when the AI returns an empty reply", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "" }),
    });

    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();
    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, { target: { value: "de cualquier tema" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/modo de respaldo local/i)).toBeInTheDocument();
    });
  });

  test("returns focus to the chat input after the AI reply", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Seguimos conversando, causa." }),
    });

    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();
    const textarea = screen.getByLabelText(/Habla con Chacalón/i);
    fireEvent.change(textarea, { target: { value: "Quiero seguir conversando" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/Seguimos conversando/i)).toBeInTheDocument();
      expect(document.activeElement).toBe(textarea);
    });
  });
});

test("maps chat roles to Gemini roles", () => {
  expect(
    toApiHistory([
      { role: "assistant", text: "Hola" },
      { role: "user", text: "¿Qué juego?" },
    ])
  ).toEqual([
    { role: "model", text: "Hola" },
    { role: "user", text: "¿Qué juego?" },
  ]);
});

test("extracts common player name changes", () => {
  expect(extractRequestedName("Cambia mi nombre a Quique")).toBe("Quique");
  expect(extractRequestedName("Mi nombre es María")).toBe("María");
  expect(extractRequestedName("Llámame Quique, por favor")).toBe("Quique");
  expect(extractRequestedName("pero ahora quiero que cambies quique por Gus")).toBe("Gus");
});

test("creates a useful fallback response", () => {
  expect(getFallbackReply("¿Qué juego quieres recomendarme?")).toMatch(/Snake|Space Invaders/i);
});

test("repeats a wish in local fallback mode", () => {
  expect(getFallbackReply("Deseo conseguir una buena chamba")).toMatch(
    /Tu deseo es conseguir una buena chamba.*se te cumpla/i
  );
});

test("detects when a message needs the daily context", () => {
  expect(shouldUseDailyContext("¿Qué está pasando hoy en la economía?"))
    .toBe(true);
  expect(shouldUseDailyContext("¿Qué pasa hoy por mi barrio?"))
    .toBe(true);
  expect(shouldUseDailyContext("¿Qué se cuenta Bill Gates?"))
    .toBe(true);
  expect(shouldUseDailyContext("¿Qué sabes de la KK?"))
    .toBe(true);
  expect(shouldUseDailyContext("¿Qué juego arcade me recomiendas?"))
    .toBe(true);
  expect(shouldUseDailyContext("Me gusta la música chicha"))
    .toBe(false);
});
