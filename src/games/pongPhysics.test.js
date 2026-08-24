import { bounceVelocity, clamp, paddleHit } from "./pongPhysics";

test("limita el movimiento de una paleta", () => {
  expect(clamp(-10, 0, 100)).toBe(0);
  expect(clamp(50, 0, 100)).toBe(50);
  expect(clamp(120, 0, 100)).toBe(100);
});

test("detecta una pelota que se acerca a una paleta", () => {
  const paddle = { x: 20, y: 40, width: 14, height: 80 };
  expect(paddleHit({ x: 31, y: 70, radius: 8, vx: -100 }, paddle)).toBe(true);
  expect(paddleHit({ x: 31, y: 200, radius: 8, vx: -100 }, paddle)).toBe(false);
});

test("calcula la dirección del rebote según el punto de impacto", () => {
  const velocity = bounceVelocity(40, 40, 80, 330, 1);

  expect(velocity.vx).toBeGreaterThan(0);
  expect(velocity.vy).toBeLessThan(0);
});
