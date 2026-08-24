import { bounceVelocity, clamp, paddleHit } from "./pongPhysics";

function fitCanvas(canvas) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(300, Math.min(800, Math.floor(window.innerWidth - 48)));
  const height = Math.floor(width * 0.5625);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, width, height };
}

export class Paddle {
  constructor(x, y, width = 14, height = 82) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 360;
  }

  update(dt, direction, canvasHeight) {
    this.y = clamp(
      this.y + direction * this.speed * dt,
      12,
      canvasHeight - this.height - 12
    );
  }

  draw(ctx, color) {
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export class Ball {
  constructor(radius = 8) {
    this.radius = radius;
    this.speed = 330;
    this.reset(0, 0, 1);
  }

  reset(x, y, direction) {
    this.x = x;
    this.y = y;
    this.vx = this.speed * direction;
    this.vy = this.speed * (Math.random() * 0.8 - 0.4);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.fillStyle = "#fff300";
    ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
  }
}

export class PongEngine {
  constructor({ canvas, onHUD, onMessage, winningScore = 7 }) {
    this.canvas = canvas;
    this.onHUD = onHUD;
    this.onMessage = onMessage;
    this.winningScore = winningScore;
    this.keys = {};
    this.rafId = null;
    this.lastTime = null;
    this.destroyed = false;
  }

  mount() {
    this.fit();
    this.reset();
    this.bindInput();
    this.loop(0);
  }

  fit() {
    const { ctx, width, height } = fitCanvas(this.canvas);
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    if (this.leftPaddle && this.rightPaddle) {
      this.leftPaddle.y = clamp(this.leftPaddle.y, 12, this.height - this.leftPaddle.height - 12);
      this.rightPaddle.y = clamp(this.rightPaddle.y, 12, this.height - this.rightPaddle.height - 12);
    }
  }

  reset() {
    this.phase = "menu"; // menu | play | paused | over
    this.score = { left: 0, right: 0 };
    this.leftPaddle = new Paddle(28, this.height / 2 - 41);
    this.rightPaddle = new Paddle(this.width - 42, this.height / 2 - 41);
    this.ball = new Ball();
    this.resetBall(1);
    this.updateHUD(this.score);
    this.showMessage("Pulsa START o ESPACIO para comenzar");
  }

  resetBall(direction) {
    this.ball.reset(this.width / 2, this.height / 2, direction);
  }

  bindInput() {
    this.onKeyDown = (event) => {
      if (["KeyW", "KeyS", "ArrowUp", "ArrowDown", "Space", "KeyP", "KeyR"].includes(event.code)) {
        event.preventDefault();
      }

      this.keys[event.code] = true;
      if (event.code === "Space" && this.phase !== "play") this.start();
      if (event.code === "KeyP") this.togglePause();
      if (event.code === "KeyR") this.restart();
    };

    this.onKeyUp = (event) => {
      this.keys[event.code] = false;
    };

    this.onResize = () => this.fit();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
  }

  cleanup() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.cleanup();
  }

  updateHUD(next) {
    this.onHUD(next);
  }

  showMessage(message) {
    this.onMessage(message);
  }

  start() {
    if (this.phase === "play") return;

    if (this.phase === "menu" || this.phase === "over") {
      this.score = { left: 0, right: 0 };
      this.updateHUD(this.score);
      this.resetBall(Math.random() > 0.5 ? 1 : -1);
    }

    this.phase = "play";
    this.showMessage("");
  }

  togglePause() {
    if (this.phase === "play") {
      this.phase = "paused";
      this.showMessage("PAUSA — P para reanudar");
    } else if (this.phase === "paused") {
      this.phase = "play";
      this.showMessage("");
    }
  }

  restart() {
    this.reset();
  }

  scorePoint(side) {
    this.score = { ...this.score, [side]: this.score[side] + 1 };
    this.updateHUD(this.score);

    if (this.score[side] >= this.winningScore) {
      this.phase = "over";
      this.showMessage(`${side === "left" ? "PLAYER 1" : "PLAYER 2"} GANA — R para reiniciar`);
      return;
    }

    this.resetBall(side === "left" ? 1 : -1);
  }

  update(dt) {
    if (this.phase !== "play") return;

    const leftDirection = (this.keys.KeyS ? 1 : 0) - (this.keys.KeyW ? 1 : 0);
    const rightDirection = (this.keys.ArrowDown ? 1 : 0) - (this.keys.ArrowUp ? 1 : 0);
    this.leftPaddle.update(dt, leftDirection, this.height);
    this.rightPaddle.update(dt, rightDirection, this.height);
    this.ball.update(dt);

    if (this.ball.y - this.ball.radius <= 12 || this.ball.y + this.ball.radius >= this.height - 12) {
      this.ball.vy *= -1;
      this.ball.y = clamp(this.ball.y, 12 + this.ball.radius, this.height - 12 - this.ball.radius);
    }

    if (paddleHit(this.ball, this.leftPaddle)) {
      const velocity = bounceVelocity(
        this.ball.y,
        this.leftPaddle.y,
        this.leftPaddle.height,
        this.ball.speed,
        1
      );
      this.ball.x = this.leftPaddle.x + this.leftPaddle.width + this.ball.radius;
      this.ball.vx = velocity.vx;
      this.ball.vy = velocity.vy;
    }

    if (paddleHit(this.ball, this.rightPaddle)) {
      const velocity = bounceVelocity(
        this.ball.y,
        this.rightPaddle.y,
        this.rightPaddle.height,
        this.ball.speed,
        -1
      );
      this.ball.x = this.rightPaddle.x - this.ball.radius;
      this.ball.vx = velocity.vx;
      this.ball.vy = velocity.vy;
    }

    if (this.ball.x < -this.ball.radius) this.scorePoint("right");
    if (this.ball.x > this.width + this.ball.radius) this.scorePoint("left");
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = "rgba(0, 255, 255, .35)";
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 12);
    ctx.lineTo(this.width / 2, this.height - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    this.leftPaddle.draw(ctx, "#00ffff");
    this.rightPaddle.draw(ctx, "#ff00ff");
    this.ball.draw(ctx);
  }

  loop(timestamp) {
    if (this.destroyed) return;
    if (this.lastTime === null) this.lastTime = timestamp;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
  }
}
