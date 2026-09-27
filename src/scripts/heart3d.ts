import * as THREE from 'three';

/** 2D 心形曲线绕 Y 轴旋转成 3D 心形 */
function heartPosition(t: number, v: number): [number, number, number] {
  const x2d = 16 * Math.pow(Math.sin(t), 3);
  const y2d = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [x2d * Math.cos(v), y2d, x2d * Math.sin(v)];
}

/** 「咚-咚」心跳 */
function heartbeat(now: number): number {
  const p = now % 0.9;
  if (p < 0.12) return 1 + 0.15 * Math.sin((p / 0.12) * Math.PI);
  if (p < 0.22) return 1;
  if (p < 0.32) return 1 + 0.1 * Math.sin(((p - 0.22) / 0.1) * Math.PI);
  return 1;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** 发光圆点纹理 */
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export interface HeartMorph {
  setMode: (mode: 'heart' | 'scatter') => void;
  cleanup: () => void;
}

/** 创建 3D 爱心粒子，支持「爱心 → 散开淡出」 */
export function createHeartMorph(container: HTMLElement): HeartMorph {
  const W = container.clientWidth || 340;
  const H = container.clientHeight || 340;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  const COUNT = 3000;
  const heartPos = new Float32Array(COUNT * 3);
  const delays = new Float32Array(COUNT);
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const randDir = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const [x, y, z] = heartPosition(t, v);
    // 大爱心（除以 6）
    heartPos[i * 3] = x / 6;
    heartPos[i * 3 + 1] = y / 6 + 0.12;
    heartPos[i * 3 + 2] = z / 6;
    delays[i] = Math.random();

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    randDir[i * 3] = Math.sin(phi) * Math.cos(theta);
    randDir[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
    randDir[i * 3 + 2] = Math.cos(phi);

    colors[i * 3] = 0.9 + Math.random() * 0.1;
    colors[i * 3 + 1] = 0.2 + Math.random() * 0.4;
    colors[i * 3 + 2] = 0.32 + Math.random() * 0.32;
  }
  positions.set(heartPos);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.13,
    map: makeGlowTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const heart = new THREE.Points(geo, mat);
  scene.add(heart);

  let morphTarget = 0;
  let morphCurrent = 0;
  let disposed = false;
  let rafId = 0;

  const clock = new THREE.Clock();

  function animate() {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);
    const now = clock.elapsedTime;

    morphCurrent += (morphTarget - morphCurrent) * 0.025;

    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const local = Math.min(1, Math.max(0, (morphCurrent - delays[i] * 0.4) / 0.6));
      const e = easeInOutCubic(local);
      const dist = e * 6.5;
      pos[i * 3] = heartPos[i * 3] + randDir[i * 3] * dist;
      pos[i * 3 + 1] = heartPos[i * 3 + 1] + randDir[i * 3 + 1] * dist;
      pos[i * 3 + 2] = heartPos[i * 3 + 2] + randDir[i * 3 + 2] * dist;
    }
    geo.attributes.position.needsUpdate = true;

    // 爱心形态：旋转 + 心跳；散开形态：旋转归零
    const heartFactor = Math.max(0, 1 - morphCurrent * 2);
    if (heartFactor > 0.02) {
      heart.rotation.y += 0.012 * heartFactor;
      heart.rotation.x = Math.sin(now * 0.4) * 0.2 * heartFactor;
    } else {
      heart.rotation.y += (0 - heart.rotation.y) * 0.12;
      heart.rotation.x += (0 - heart.rotation.x) * 0.12;
    }
    const beat = (heartbeat(now * 1.15) - 1) * heartFactor;
    heart.scale.setScalar(1 + beat);

    // 散开时整体淡出
    mat.opacity = 0.98 * (1 - morphCurrent * 0.85);

    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(animate);

  const onResize = () => {
    const w = container.clientWidth || 340;
    const h = container.clientHeight || 340;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  return {
    setMode(mode) {
      morphTarget = mode === 'scatter' ? 1 : 0;
    },
    cleanup() {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
