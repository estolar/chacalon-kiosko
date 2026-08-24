import { bounceFromPaddle, circleRectOverlap, clamp } from "./breakoutPhysics";

test("limita la posición de la paleta", () => {
  expect(clamp(-10, 0, 100)).toBe(0);
  expect(clamp(50, 0, 100)).toBe(50);
  expect(clamp(120, 0, 100)).toBe(100);
});

test("detecta el contacto entre pelota y bloque", () => {
  const brick = { x: 40, y: 40, width: 80, height: 18 };

  expect(circleRectOverlap({ x: 50, y: 50, radius: 8 }, brick)).toBe(true);
  expect(circleRectOverlap({ x: 200, y: 200, radius: 8 }, brick)).toBe(false);
});

test("devuelve un rebote hacia arriba desde la paleta", () => {
  const velocity = bounceFromPaddle(
    { x: 100, y: 50 },
    { x: 40, y: 40, width: 120, height: 14 },
    340
  );

  expect(velocity.vy).toBeLessThan(0);
  expect(velocity.vx).toBeCloseTo(0);
});
