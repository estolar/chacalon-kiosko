import { clamp, computeRange, evaluateShot } from "./cannonPhysics";

test("limita un valor al intervalo permitido", () => {
  expect(clamp(0, 1, 89)).toBe(1);
  expect(clamp(45, 1, 89)).toBe(45);
  expect(clamp(100, 1, 89)).toBe(89);
});

test("calcula el alcance máximo a 45 grados", () => {
  expect(computeRange(45, 5000)).toBeCloseTo(5000);
});

test("clasifica un disparo como impacto, corto o largo", () => {
  expect(evaluateShot(1200, 1200).type).toBe("hit");
  expect(evaluateShot(900, 1200).type).toBe("short");
  expect(evaluateShot(1500, 1200).type).toBe("long");
});
