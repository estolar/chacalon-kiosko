import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChacalonChat, {
  extractRequestedName,
  getFallbackReply,
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

    expect(screen.getByText(/dime tu nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dile tu nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Música de prueba 8-bit/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Retrato arcade de Chacalón Virtual/i)).toBeInTheDocument();
  });

  test("saves the first message as the player name", () => {
    render(<ChacalonChat onExit={jest.fn()} />);

    const textarea = screen.getByLabelText(/Dile tu nombre/i);
    fireEvent.change(textarea, { target: { value: "Enrique" } });
    fireEvent.submit(textarea.closest("form"));

    expect(screen.getAllByText("Enrique")).toHaveLength(2);
    expect(screen.getByText(/Bienvenido, causa/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("retro-games.chacalon.player-name")).toBe("Enrique");
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
    const textarea = screen.getByLabelText(/Transmisión al personaje/i);
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

    const textarea = screen.getByLabelText(/Transmisión al personaje/i);
    fireEvent.change(textarea, { target: { value: "Cambia mi nombre a Quique" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    expect(screen.getByText(/Desde ahora te llamo Quique/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("retro-games.chacalon.player-name")).toBe("Quique");

    const labels = Array.from(
      container.querySelectorAll(".chacalon-message__label")
    ).map((label) => label.textContent);
    expect(labels).toContain("Holaaaa");
    expect(labels).toContain("Quique");
  });

  test("keeps a local fallback when the AI server is unavailable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));

    render(<ChacalonChat onExit={jest.fn()} />);
    enterPlayerName();
    const textarea = screen.getByLabelText(/Transmisión al personaje/i);
    fireEvent.change(textarea, { target: { value: "Háblame de música chicha" } });
    fireEvent.submit(screen.getByRole("button", { name: "ENVIAR" }).closest("form"));

    await waitFor(() => {
      expect(screen.getByText(/modo de respaldo local/i)).toBeInTheDocument();
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
});

test("creates a useful fallback response", () => {
  expect(getFallbackReply("¿Qué juego quieres recomendarme?")).toMatch(/Snake|Space Invaders/i);
});
