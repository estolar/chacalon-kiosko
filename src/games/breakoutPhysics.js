export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function circleRectOverlap(circle, rectangle) {
  const closestX = clamp(circle.x, rectangle.x, rectangle.x + rectangle.width);
  const closestY = clamp(circle.y, rectangle.y, rectangle.y + rectangle.height);
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  return distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius;
}

export function bounceFromPaddle(ball, paddle, speed) {
  const relativeHit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  const angle = relativeHit * (Math.PI / 3);

  return {
    vx: Math.sin(angle) * speed,
    vy: -Math.cos(angle) * speed,
  };
}
