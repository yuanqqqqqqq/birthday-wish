// 2D canvas 粒子系统：花瓣飘落 + 星星闪烁 + 点击爆发（烟花式）

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'star' | 'petal' | 'circle';
  size: number;
  life: number;
  decay: number;
  color: string;
  rot: number;
  rotSpeed: number;
  phase: number;
  gravity: number;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let W = 0;
let H = 0;
const parts: P[] = [];

// 莫兰迪色系
const PALETTE = ['#d4b5b5', '#b5c9b7', '#e8a0b4', '#f2c14e', '#b8a0d8', '#7fb3d5'];
const PETALS = ['#e8a0b4', '#d4b5b5', '#f2c9c9', '#e8c4a0', '#f0b8c8'];
const STARS = ['#f2c14e', '#e8c9a0', '#f5d98a'];

let spawnTimer = 0;
let last = performance.now();

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
}

function spawnAmbient() {
  // 花瓣（主要）
  parts.push({
    x: Math.random() * W,
    y: -24,
    vx: (Math.random() - 0.5) * 0.7,
    vy: 0.7 + Math.random() * 1.3,
    type: 'petal',
    size: 6 + Math.random() * 7,
    life: 1,
    decay: 0.0012,
    color: PETALS[Math.floor(Math.random() * PETALS.length)],
    rot: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.05,
    phase: Math.random() * Math.PI * 2,
    gravity: 0.015,
  });
  // 偶尔一颗星星
  if (Math.random() < 0.35) {
    parts.push({
      x: Math.random() * W,
      y: -20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.35 + Math.random() * 0.6,
      type: 'star',
      size: 4 + Math.random() * 5,
      life: 1,
      decay: 0.0008,
      color: STARS[Math.floor(Math.random() * STARS.length)],
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      phase: Math.random() * Math.PI * 2,
      gravity: 0.005,
    });
  }
}

/** 点击爆发（烟花式） */
function burst(x: number, y: number) {
  const count = 28;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const sp = 2 + Math.random() * 5;
    parts.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      type: Math.random() > 0.45 ? 'star' : 'circle',
      size: 3 + Math.random() * 5,
      life: 1,
      decay: 0.014,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      phase: Math.random() * Math.PI * 2,
      gravity: 0.06,
    });
  }
}

function drawStar(p: P) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? p.size : p.size * 0.42;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.restore();
}

function drawPetal(p: P) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.beginPath();
  ctx.moveTo(0, -p.size);
  ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.4, p.size * 0.6, p.size * 0.4, 0, p.size);
  ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.4, -p.size * 0.6, -p.size * 0.4, 0, -p.size);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.restore();
}

function drawCircle(p: P) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();
}

function update(dt: number, now: number) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vy += p.gravity;
    p.x += p.vx + Math.sin(now * 0.001 + p.phase) * 0.3;
    p.y += p.vy;
    p.rot += p.rotSpeed;
    p.life -= p.decay;
    if (p.life <= 0 || p.y > H + 40 || p.x < -40 || p.x > W + 40) {
      parts.splice(i, 1);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, W, H);
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    if (p.type === 'star') drawStar(p);
    else if (p.type === 'petal') drawPetal(p);
    else drawCircle(p);
  }
  ctx.globalAlpha = 1;
}

function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = 0.12 + Math.random() * 0.22;
    spawnAmbient();
  }

  update(dt, now);
  render();
  requestAnimationFrame(loop);
}

export function initParticles() {
  canvas = document.getElementById('particles') as HTMLCanvasElement | null;
  if (!canvas) return;
  const c = canvas.getContext('2d');
  if (!c) return;
  ctx = c;

  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('a, button, video, [data-photo], #candle, #lightbox')) return;
    burst(e.clientX, e.clientY);
  });

  requestAnimationFrame(loop);
}
