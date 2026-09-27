import rough from 'roughjs';
import { annotate } from 'rough-notation';
import Lenis from 'lenis';
import { initParticles } from './particles';
import { createHeartMorph, type HeartMorph } from './heart3d';

const GOLD = '#f2c14e';
const CORAL = '#e8836a';

document.documentElement.classList.add('js');

// 预加载页面手写体（标题用）
if ('fonts' in document) {
  document.fonts.load('400 32px "Ma Shan Zheng"');
}

let lenis: Lenis | null = null;
let prologueMorph: HeartMorph | null = null;

function ready(fn: () => void) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function safe(name: string, fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.error(`[init] ${name} 初始化失败：`, err);
  }
}

/** 锁定 / 解锁页面滚动（同时处理 html 和 body + Lenis） */
function setScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  document.body.style.overflow = locked ? 'hidden' : '';
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
}

/** 序章：点击切换 3 幕，最后进入主页 */
function initPrologue() {
  const overlay = document.getElementById('prologue');
  if (!overlay) return;
  const scenes = overlay.querySelectorAll<HTMLElement>('.prologue-scene');
  const dots = overlay.querySelectorAll<HTMLElement>('.prologue-dot');
  let current = 0;

  setScrollLocked(true);

  overlay.addEventListener('click', () => {
    current++;
    if (current >= scenes.length) {
      overlay.classList.add('prologue-done');
      setScrollLocked(false);
      prologueMorph?.cleanup();
      prologueMorph = null;
      setTimeout(() => overlay.remove(), 750);
      return;
    }
    scenes.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    if (current === 1) prologueMorph?.setMode('scatter');
  });
}

/** 顶部进度条 */
function initProgress() {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    fill.style.width = `${(p * 100).toFixed(1)}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  scale: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(0, 0, -size * 0.5, 0, -size * 0.5, size * 0.35);
  ctx.bezierCurveTo(-size * 0.5, size * 0.7, 0, size * 1.1, 0, size * 1.5);
  ctx.bezierCurveTo(0, size * 1.1, size * 0.5, size * 0.7, size * 0.5, size * 0.35);
  ctx.bezierCurveTo(size * 0.5, 0, 0, 0, 0, size * 0.35);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** 序章：跳动的爱心粒子 */
function initPrologueHearts() {
  const canvas = document.getElementById('prologue-hearts') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colors = ['#e8a0b4', '#f0b8c8', '#e8836a', '#f5a0b0', '#d4a0c8'];
  const COUNT = 22;

  interface Heart {
    x: number;
    y: number;
    vy: number;
    size: number;
    color: string;
    phase: number;
    speed: number;
    alpha: number;
  }

  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);
  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const hearts: Heart[] = [];
  for (let i = 0; i < COUNT; i++) {
    hearts.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vy: 0.35 + Math.random() * 0.9,
      size: 9 + Math.random() * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 2.5,
      alpha: 0.35 + Math.random() * 0.5,
    });
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    const now = performance.now() * 0.001;
    for (const h of hearts) {
      h.y -= h.vy;
      if (h.y < -30) {
        h.y = H + 30;
        h.x = Math.random() * W;
      }
      const scale = 1 + Math.sin(now * h.speed + h.phase) * 0.18;
      ctx.globalAlpha = h.alpha;
      drawHeartShape(ctx, h.x, h.y, h.size, h.color, scale);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function initLenis() {
  lenis = new Lenis({ duration: 1.3, smoothWheel: true });

  function raf(time: number) {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length <= 1) return;
      const target = document.querySelector<HTMLElement>(id);
      if (target) {
        e.preventDefault();
        lenis?.scrollTo(target, { offset: 0 });
      }
    });
  });
}

function initCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'sketch-cursor';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '36');
  svg.setAttribute('height', '36');
  svg.setAttribute('viewBox', '0 0 36 36');

  const rc = rough.svg(svg);
  svg.appendChild(rc.circle(18, 18, 13, { stroke: CORAL, strokeWidth: 2, roughness: 1.6 }));
  svg.appendChild(rc.circle(18, 18, 2, { stroke: GOLD, strokeWidth: 2, roughness: 0, fill: GOLD }));

  cursor.appendChild(svg);
  document.body.appendChild(cursor);

  let x = -100;
  let y = -100;
  let tx = x;
  let ty = y;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX - 18;
    ty = e.clientY - 18;
    cursor.style.opacity = '1';
  });
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  (function loop() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(loop);
  })();
}

function initAnnotations() {
  const items = document.querySelectorAll<HTMLElement>('[data-annotation]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const type = (el.dataset.annotation || 'underline') as
          | 'underline'
          | 'box'
          | 'circle'
          | 'highlight';
        annotate(el, {
          type,
          color: el.dataset.color || GOLD,
          strokeWidth: 2.5,
          padding: 5,
          animationDuration: 1000,
        }).show();
        observer.unobserve(el);
      });
    },
    { threshold: 0.4 },
  );
  items.forEach((el) => observer.observe(el));
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  items.forEach((el) => observer.observe(el));
}

function initLightbox() {
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img') as HTMLImageElement | null;
  if (!box || !img) return;

  document.querySelectorAll<HTMLElement>('[data-photo]').forEach((el) => {
    el.addEventListener('click', () => {
      img.src = el.dataset.photo || '';
      img.alt = el.dataset.caption || '';
      box.classList.remove('hidden');
      box.classList.add('flex');
    });
  });

  box.addEventListener('click', () => {
    box.classList.add('hidden');
    box.classList.remove('flex');
  });
}

function spawnStars(x: number, y: number) {
  const emojis = ['⭐', '✨', '💛', '🌟'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.className = 'star-burst';
    s.textContent = emojis[i % emojis.length];
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    const angle = (Math.PI * 2 * i) / 16;
    const dist = 60 + Math.random() * 100;
    s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(angle) * dist - 60}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
}

function initCandle() {
  const candle = document.getElementById('candle');
  const flame = document.getElementById('flame');
  const wish = document.getElementById('wish-reveal');
  if (!candle || !flame || !wish) return;

  candle.addEventListener('click', () => {
    if (candle.dataset.done === '1') return;
    candle.dataset.done = '1';
    flame.classList.add('flame-out');
    const rect = candle.getBoundingClientRect();
    spawnStars(rect.left + rect.width / 2, rect.top + 8);
    setTimeout(() => {
      wish.classList.remove('hidden');
      wish.classList.add('visible');
    }, 650);
  });
}

/** 3D 爱心：结尾 + 序章第 3 幕 */
function initHearts() {
  const finale = document.getElementById('heart3d');
  if (finale) createHeartMorph(finale);

  const prologueMorphEl = document.getElementById('prologue-morph');
  if (prologueMorphEl) {
    prologueMorph = createHeartMorph(prologueMorphEl);
  }
}

ready(() => {
  safe('prologue', initPrologue);
  safe('prologue-hearts', initPrologueHearts);
  safe('progress', initProgress);
  safe('cursor', initCursor);
  safe('annotations', initAnnotations);
  safe('reveal', initReveal);
  safe('lightbox', initLightbox);
  safe('lenis', initLenis);
  safe('candle', initCandle);
  safe('particles', initParticles);
  safe('hearts', initHearts);
});
