export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function paddleHit(ball, paddle) {
  const overlapsVertically =
    ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height;
  const overlapsHorizontally =
    ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
  const movingTowardPaddle = ball.vx < 0 ? ball.x > paddle.x : ball.x < paddle.x;

  return overlapsVertically && overlapsHorizontally && movingTowardPaddle;
}

export function bounceVelocity(ballY, paddleY, paddleHeight, speed, direction) {
  const relativeHit = (ballY - (paddleY + paddleHeight / 2)) / (paddleHeight / 2);
  const angle = relativeHit * (Math.PI / 3);

  return {
    vx: Math.cos(angle) * speed * direction,
    vy: Math.sin(angle) * speed,
  };
}
