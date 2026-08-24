const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function fitHiDPI(canvas) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = Math.max(280, Math.min(800, Math.floor(window.innerWidth - 48)));
  const cssH = clamp(Math.floor(cssW * 0.75), 420, 600);

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, cssW, cssH };
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.lastShot = 0;
    this.rate = 220;
  }

  canShoot() {
    return performance.now() - this.lastShot > this.rate;
  }

  update(dt, width) {
    this.x = clamp(this.x + this.vx * dt, 20, width - 20);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#a7b4ff";
    ctx.fillRect(-12, -6, 24, 8);
    ctx.fillRect(-4, -12, 8, 6);
    ctx.fillStyle = "#7df9ff";
    ctx.fillRect(-2, -18, 4, 6);
    ctx.restore();
  }
}

export class Invader {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.alive = true;
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    const colors = ["#7cffae", "#9cfff6", "#ffd37c", "#ff9b9b", "#c7d0ff", "#d17cff"];
    ctx.fillStyle = colors[this.row % colors.length];
    ctx.fillRect(-12, -8, 24, 16);
    ctx.fillStyle = "#0b0f17";
    ctx.fillRect(-6, -2, 4, 4);
    ctx.fillRect(2, -2, 4, 4);
    ctx.restore();
  }
}

export class Shot {
  constructor(x, y, vy) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.active = true;
  }

  update(dt, height) {
    this.y += this.vy * dt;
    if (this.y < -20 || this.y > height + 20) this.active = false;
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = rand(-80, 80);
    this.vy = rand(-120, -40);
    this.life = rand(0.3, 0.8);
    this.color = color;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 240 * dt;
  }

  draw(ctx) {
    if (this.life <= 0) return;

    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 2, 2);
    ctx.globalAlpha = 1;
  }
}

class AudioSystem {
  constructor(mutedRef) {
    this.mutedRef = mutedRef;
    this.context = null;
    this.AudioContext = window.AudioContext || window.webkitAudioContext;
  }

  ensure() {
    if (this.mutedRef.current || !this.AudioContext) return null;

    if (!this.context) this.context = new this.AudioContext();
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  }

  beep(type = "square", frequency = 440, duration = 0.07, gain = 0.02) {
    const context = this.ensure();
    if (!context) return;

    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    volume.gain.value = gain;
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  shoot() {
    this.beep("square", 680, 0.06, 0.03);
  }

  explosion() {
    this.beep("sawtooth", 100, 0.12, 0.05);
    this.beep("square", 60, 0.2, 0.04);
  }

  step() {
    this.beep("triangle", 220, 0.03, 0.015);
  }

  destroy() {
    if (this.context) this.context.close();
  }
}

export class SpaceInvadersEngine {
  constructor({ canvas, mutedRef, onHUD, onMessage }) {
    this.canvas = canvas;
    this.mutedRef = mutedRef;
    this.onHUD = onHUD;
    this.onMessage = onMessage;
    this.audio = new AudioSystem(mutedRef);
    this.keys = {};
    this.rafId = null;
    this.lastTime = null;
    this.timers = new Set();
    this.destroyed = false;
  }

  mount() {
    this.fit();
    this.reset();
    this.bindInput();
    this.loop(0);
  }

  fit() {
    const { ctx, cssW, cssH } = fitHiDPI(this.canvas);
    this.ctx = ctx;
    this.width = cssW;
    this.height = cssH;

    if (this.player) {
      this.player.y = this.height - 40;
      this.player.x = clamp(this.player.x, 20, this.width - 20);
    }
  }

  reset(level = 1) {
    this.clearTimers();
    this.phase = "menu"; // menu | play | paused | over
    this.level = level;
    this.score = 0;
    this.lives = 3;
    this.player = new Player(this.width / 2, this.height - 40);
    this.shots = [];
    this.enemyShots = [];
    this.particles = [];
    this.makeWave();
    this.updateHUD({ score: this.score, lives: this.lives, level: this.level });
    this.showMessage("Pulsa START o ESPACIO para comenzar");
  }

  makeWave() {
    const rows = clamp(2 + this.level, 2, 6);
    const columns = 8 + Math.min(this.level * 2, 8);
    const marginX = 40;
    const marginTop = 60;
    const spacingX = (this.width - marginX * 2) / (columns - 1);

    this.invaders = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        this.invaders.push(
          new Invader(marginX + column * spacingX, marginTop + row * 42, row)
        );
      }
    }

    this.invaderDirection = 1;
    this.invaderStepTimer = 0;
    this.invaderShootTimer = 0;
  }

  bindInput() {
    this.onKeyDown = (event) => {
      if (["ArrowLeft", "ArrowRight", "Space", "KeyP", "KeyR"].includes(event.code)) {
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
    this.clearTimers();
    this.audio.destroy();
  }

  schedule(callback, delay) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.destroyed) callback();
    }, delay);
    this.timers.add(timer);
  }

  clearTimers() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
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
      this.level = 1;
      this.score = 0;
      this.lives = 3;
      this.player.x = this.width / 2;
      this.shots = [];
      this.enemyShots = [];
      this.particles = [];
      this.makeWave();
      this.updateHUD({ score: this.score, lives: this.lives, level: this.level });
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
    this.reset(this.level);
  }

  playerShoot() {
    if (!this.player.canShoot()) return;

    this.shots.push(new Shot(this.player.x, this.player.y - 16, -420));
    this.audio.shoot();
    this.player.lastShot = performance.now();
  }

  explode(x, y, color) {
    for (let i = 0; i < 24; i += 1) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  hitPlayer() {
    this.lives -= 1;
    this.updateHUD({ lives: this.lives });
    this.audio.explosion();
    this.explode(this.player.x, this.player.y, "#ff6b6b");

    if (this.lives <= 0) {
      this.phase = "over";
      this.showMessage("GAME OVER — R para reiniciar");
    } else {
      this.player.x = this.width / 2;
      this.enemyShots.length = 0;
    }
  }

  nextLevel() {
    this.level += 1;
    this.makeWave();
    this.updateHUD({ level: this.level });
    this.showMessage(`NIVEL ${this.level}!`);
    this.schedule(() => this.showMessage(""), 900);
  }

  bottomRowInvaders() {
    const columns = {};
    for (const invader of this.invaders) {
      const key = Math.round(invader.x / 18);
      if (!columns[key] || columns[key].y < invader.y) columns[key] = invader;
    }
    return Object.values(columns).filter((invader) => invader.alive);
  }

  aliveInvaders() {
    return this.invaders.reduce((total, invader) => total + (invader.alive ? 1 : 0), 0);
  }

  update(dt) {
    if (this.phase !== "play") return;

    if (this.keys.ArrowLeft) this.player.vx = -260;
    else if (this.keys.ArrowRight) this.player.vx = 260;
    else this.player.vx = 0;

    if (this.keys.Space) this.playerShoot();

    this.player.update(dt, this.width);
    this.shots.forEach((shot) => shot.update(dt, this.height));
    this.enemyShots.forEach((shot) => shot.update(dt, this.height));
    this.particles.forEach((particle) => particle.update(dt));

    this.invaderStepTimer += dt;
    const stepEvery = clamp(0.8 - this.aliveInvaders() * 0.003 - this.level * 0.05, 0.12, 0.8);
    if (this.invaderStepTimer >= stepEvery) {
      this.invaderStepTimer = 0;
      this.audio.step();
      let edgeHit = false;

      for (const invader of this.invaders) {
        if (!invader.alive) continue;
        invader.x += this.invaderDirection * 18;
        if (invader.x < 24 || invader.x > this.width - 24) edgeHit = true;
      }

      if (edgeHit) {
        this.invaderDirection *= -1;
        for (const invader of this.invaders) {
          if (invader.alive) invader.y += 16;
        }
      }
    }

    this.invaderShootTimer += dt;
    if (this.invaderShootTimer > clamp(1.1 - this.level * 0.08, 0.35, 1.3)) {
      this.invaderShootTimer = 0;
      const shooters = this.bottomRowInvaders();
      if (shooters.length) {
        const invader = shooters[Math.floor(Math.random() * shooters.length)];
        this.enemyShots.push(new Shot(invader.x, invader.y + 10, 240));
      }
    }

    for (const shot of this.shots) {
      if (!shot.active) continue;
      for (const invader of this.invaders) {
        if (!invader.alive) continue;
        if (Math.abs(shot.x - invader.x) < 12 && Math.abs(shot.y - invader.y) < 12) {
          invader.alive = false;
          shot.active = false;
          this.score += 10 + invader.row * 5;
          this.updateHUD({ score: this.score });
          this.explode(invader.x, invader.y, "#7cffae");
          this.audio.explosion();
        }
      }
    }

    for (const enemyShot of this.enemyShots) {
      if (!enemyShot.active) continue;
      if (Math.abs(enemyShot.x - this.player.x) < 14 && Math.abs(enemyShot.y - this.player.y) < 10) {
        enemyShot.active = false;
        this.hitPlayer();
      }
    }

    this.shots = this.shots.filter((shot) => shot.active);
    this.enemyShots = this.enemyShots.filter((shot) => shot.active);
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (this.invaders.every((invader) => !invader.alive)) this.nextLevel();
    if (this.invaders.some((invader) => invader.alive && invader.y > this.height - 80)) {
      this.phase = "over";
      this.showMessage("INVADIDO — R para reiniciar");
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#0f1730";
    for (let i = 0; i < 80; i += 1) {
      ctx.fillRect((i * 37) % this.width, (i * 59) % this.height, 2, 2);
    }
    ctx.globalAlpha = 1;

    this.player.draw(ctx);
    this.invaders.forEach((invader) => invader.draw(ctx));

    ctx.fillStyle = "#7df9ff";
    this.shots.forEach((shot) => {
      if (shot.active) ctx.fillRect(shot.x - 2, shot.y - 8, 4, 12);
    });

    ctx.fillStyle = "#ff9b9b";
    this.enemyShots.forEach((shot) => {
      if (shot.active) ctx.fillRect(shot.x - 2, shot.y - 4, 4, 8);
    });

    this.particles.forEach((particle) => particle.draw(ctx));
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
