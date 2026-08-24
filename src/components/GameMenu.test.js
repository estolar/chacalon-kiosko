import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import GameMenu from "./GameMenu";

const games = [
  { id: "test-game", title: "Test Game", emoji: "🕹️", tagline: "Juego de prueba", controls: "Enter" },
];

test("renderiza los juegos y notifica cuál se quiere jugar", () => {
  const onPlay = jest.fn();
  render(<GameMenu games={games} onPlay={onPlay} />);

  expect(screen.getByText(/Test Game/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "JUGAR" }));

  expect(onPlay).toHaveBeenCalledWith("test-game");
});
