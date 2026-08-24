import { bounceFromPaddle, circleRectOverlap, clamp } from "./breakoutPhysics";

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

export class BreakoutPaddle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 112;
    this.height = 14;
    this.speed = 420;
  }

  update(dt, direction, canvasWidth) {
    this.x = clamp(
      this.x + direction * this.speed * dt,
      14,
      canvasWidth - this.width - 14
    );
  }

  draw(ctx) {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + 10, this.y + 4, this.width - 20, 3);
  }
}

export class BreakoutBall {
  constructor(radius = 8) {
    this.radius = radius;
    this.speed = 340;
    this.reset(0, 0);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  launch() {
    this.vx = (Math.random() * 2 - 1) * 190;
    this.vy = -this.speed;
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

export class Brick {
  constructor(x, y, width, height, color, points) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.points = points;
    this.alive = true;
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(this.x + 4, this.y + 3, this.width - 8, 2);
  }
}

export class BreakoutEngine {
  constructor({ canvas, onHUD, onMessage, startingLives = 3 }) {
    this.canvas = canvas;
    this.onHUD = onHUD;
    this.onMessage = onMessage;
    this.startingLives = startingLives;
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

    if (this.paddle) {
      this.paddle.y = this.height - 34;
      this.paddle.x = clamp(this.paddle.x, 14, this.width - this.paddle.width - 14);
    }
  }

  reset() {
    this.phase = "menu"; // menu | serve | play | paused | over | win
    this.score = 0;
    this.lives = this.startingLives;
    this.paddle = new BreakoutPaddle(this.width / 2 - 56, this.height - 34);
    this.ball = new BreakoutBall();
    this.createBricks();
    this.resetBall();
    this.updateHUD();
    this.showMessage("Pulsa START o ESPACIO para comenzar");
  }

  createBricks() {
    const rows = 5;
    const columns = 10;
    const gap = 6;
    const marginX = 28;
    const brickWidth = (this.width - marginX * 2 - gap * (columns - 1)) / columns;
    const colors = ["#ff00ff", "#ff6b6b", "#fff300", "#39ff14", "#00ffff"];

    this.bricks = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        this.bricks.push(
          new Brick(
            marginX + column * (brickWidth + gap),
            48 + row * 24,
            brickWidth,
            17,
            colors[row],
            (rows - row) * 10
          )
        );
      }
    }
  }

  resetBall() {
    this.ball.reset(this.paddle.x + this.paddle.width / 2, this.paddle.y - 18);
  }

  launch() {
    if (this.phase === "menu" || this.phase === "serve") {
      this.ball.launch();
      this.phase = "play";
      this.showMessage("");
    }
  }

  bindInput() {
    this.onKeyDown = (event) => {
      if (["ArrowLeft", "ArrowRight", "Space", "KeyP", "KeyR"].includes(event.code)) {
        event.preventDefault();
      }

      this.keys[event.code] = true;
      if (event.code === "Space") this.launch();
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

  updateHUD() {
    const remainingBricks = this.bricks.filter((brick) => brick.alive).length;
    this.onHUD({ score: this.score, lives: this.lives, bricks: remainingBricks });
  }

  showMessage(message) {
    this.onMessage(message);
  }

  start() {
    if (this.phase === "paused") {
      this.phase = "play";
      this.showMessage("");
      return;
    }

    if (this.phase === "menu" || this.phase === "over" || this.phase === "win") {
      this.reset();
    }

    this.launch();
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

  loseLife() {
    this.lives -= 1;
    this.updateHUD();

    if (this.lives <= 0) {
      this.phase = "over";
      this.showMessage("GAME OVER — R para reiniciar");
      return;
    }

    this.resetBall();
    this.phase = "serve";
    this.showMessage("VIDA PERDIDA — ESPACIO para continuar");
  }

  update(dt) {
    if (this.phase !== "play") {
      if (this.phase === "menu" || this.phase === "serve") {
        this.paddle.update(dt, (this.keys.ArrowRight ? 1 : 0) - (this.keys.ArrowLeft ? 1 : 0), this.width);
        this.resetBall();
      }
      return;
    }

    const direction = (this.keys.ArrowRight ? 1 : 0) - (this.keys.ArrowLeft ? 1 : 0);
    this.paddle.update(dt, direction, this.width);
    this.ball.update(dt);

    if (this.ball.x - this.ball.radius <= 12 || this.ball.x + this.ball.radius >= this.width - 12) {
      this.ball.vx *= -1;
      this.ball.x = clamp(this.ball.x, 12 + this.ball.radius, this.width - 12 - this.ball.radius);
    }

    if (this.ball.y - this.ball.radius <= 12) {
      this.ball.vy = Math.abs(this.ball.vy);
      this.ball.y = 12 + this.ball.radius;
    }

    if (circleRectOverlap(this.ball, this.paddle) && this.ball.vy > 0) {
      const velocity = bounceFromPaddle(this.ball, this.paddle, this.ball.speed);
      this.ball.y = this.paddle.y - this.ball.radius;
      this.ball.vx = velocity.vx;
      this.ball.vy = velocity.vy;
    }

    for (const brick of this.bricks) {
      if (!brick.alive || !circleRectOverlap(this.ball, brick)) continue;

      brick.alive = false;
      this.score += brick.points;
      this.ball.vy *= -1;
      this.updateHUD();
      break;
    }

    if (this.bricks.every((brick) => !brick.alive)) {
      this.phase = "win";
      this.showMessage("NIVEL COMPLETADO — R para reiniciar");
    }

    if (this.ball.y > this.height + this.ball.radius) this.loseLife();
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = "rgba(0,255,255,.22)";
    ctx.strokeRect(12, 12, this.width - 24, this.height - 24);
    this.bricks.forEach((brick) => brick.draw(ctx));
    this.paddle.draw(ctx);
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
