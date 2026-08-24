import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ArcadeApp from "./ArcadeApp";

describe("ArcadeApp", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("muestra la pantalla de arranque", () => {
    render(<ArcadeApp />);

    expect(screen.getByText("RETRO ARCADE")).toBeInTheDocument();
    expect(screen.getByText("LOADING…")).toBeInTheDocument();
  });

  test("permite entrar al menú cuando termina el arranque", () => {
    render(<ArcadeApp />);

    act(() => {
      jest.advanceTimersByTime(900);
    });

    fireEvent.click(screen.getByRole("button", { name: "START" }));

    expect(screen.getAllByRole("button", { name: "JUGAR" })).toHaveLength(2);
    expect(screen.getByText(/Space Invaders/)).toBeInTheDocument();
    expect(screen.getByText(/Cannon Trainer/)).toBeInTheDocument();
  });
});
