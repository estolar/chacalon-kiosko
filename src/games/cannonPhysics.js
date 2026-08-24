export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeRange(angleDeg, maxRange) {
  const radians = (angleDeg * Math.PI) / 180;
  const range = maxRange * Math.sin(2 * radians);
  return Math.max(0, range);
}

export function evaluateShot(range, targetDistance, tolerance = 100) {
  const diff = range - targetDistance;

  if (Math.abs(diff) <= tolerance) {
    return { type: "hit", result: "🎯 ¡Impacto!", diff };
  }

  if (diff < 0) {
    return { type: "short", result: "⬇️ Corto", diff };
  }

  return { type: "long", result: "⬆️ Largo", diff };
}
