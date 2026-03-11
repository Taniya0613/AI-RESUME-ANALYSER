/**
 * Attractive "Aurora Ribbons" background for Auth page (no dependencies).
 * - Smooth animated neon ribbons + subtle stars
 * - Low-contrast and modern (looks premium behind glass UI)
 * - Respects prefers-reduced-motion and pauses on tab hidden
 */

(function () {
  const canvas = document.getElementById('auth3dCanvas');
  if (!canvas) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  /** @type {CanvasRenderingContext2D | null} */
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const rand = (min, max) => min + Math.random() * (max - min);

  const cfg = {
    stars: 130,
    ribbons: 4,
    segments: 46,
    speed: 0.55, // overall animation speed
    amp: 44, // wave amplitude
    glow: 20, // glow width
  };

  const palette = [
    { r: 99, g: 102, b: 241 },  // indigo
    { r: 139, g: 92, b: 246 },  // violet
    { r: 168, g: 85, b: 247 },  // purple
  ];

  /** @type {{x:number,y:number,z:number,a:number}[]} */
  let stars = [];

  let mouse = { x: 0.5, y: 0.5 };
  let time = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    stars = [];
    for (let i = 0; i < cfg.stars; i++) {
      stars.push({
        x: rand(0, w),
        y: rand(0, h),
        z: rand(0.35, 1.0),
        a: rand(0.03, 0.09),
      });
    }
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.06,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.78
    );
    g.addColorStop(0, 'rgba(255,255,255,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawStars() {
    for (const s of stars) {
      const px = s.x + (mouse.x - 0.5) * 18 * s.z;
      const py = s.y + (mouse.y - 0.5) * 12 * s.z;
      const r = 1.0 * s.z;
      ctx.fillStyle = `rgba(170,130,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function ribbonY(x, base, phase) {
    // A "pseudo-noise" smooth wave (layered sin) — looks like aurora
    const nx = x / w;
    const t = time * cfg.speed;
    const a1 = Math.sin(nx * Math.PI * 2 * 1.2 + t * 0.9 + phase);
    const a2 = Math.sin(nx * Math.PI * 2 * 2.4 - t * 0.55 + phase * 1.7);
    const a3 = Math.sin(nx * Math.PI * 2 * 0.6 + t * 0.35 - phase);
    return base + (a1 * 0.55 + a2 * 0.28 + a3 * 0.22) * cfg.amp;
  }

  function drawRibbon(idx) {
    const p = palette[idx % palette.length];

    // Base line placement: upper-mid and lower-mid bands
    const row = idx % 2;
    const base =
      row === 0
        ? mix(h * 0.28, h * 0.40, idx / Math.max(1, cfg.ribbons - 1))
        : mix(h * 0.60, h * 0.76, idx / Math.max(1, cfg.ribbons - 1));

    const phase = idx * 1.35 + (mouse.x - 0.5) * 0.6;
    const width = Math.max(2, cfg.glow - idx * 2);

    // Gradient along ribbon
    const grad = ctx.createLinearGradient(0, base, w, base);
    grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.00)`);
    grad.addColorStop(0.15, `rgba(${p.r},${p.g},${p.b},0.22)`);
    grad.addColorStop(0.50, `rgba(${p.r},${p.g},${p.b},0.30)`);
    grad.addColorStop(0.85, `rgba(${p.r},${p.g},${p.b},0.20)`);
    grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0.00)`);

    // Draw multiple strokes for glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let pass = 0; pass < 3; pass++) {
      ctx.strokeStyle = grad;
      ctx.lineWidth = width * (pass === 0 ? 1.6 : pass === 1 ? 1.0 : 0.55);
      ctx.globalAlpha = pass === 0 ? 0.18 : pass === 1 ? 0.22 : 0.26;

      ctx.beginPath();
      for (let i = 0; i <= cfg.segments; i++) {
        const x = (i / cfg.segments) * w;
        const y = ribbonY(x, base, phase) + (mouse.y - 0.5) * 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    drawVignette();
    drawStars();

    for (let i = 0; i < cfg.ribbons; i++) {
      drawRibbon(i);
    }

    time += 0.016;
  }

  let raf = 0;
  let running = true;

  function loop() {
    if (!running) return;
    frame();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  // init
  resize();
  init();
  loop();

  window.addEventListener('resize', () => {
    resize();
    init();
  });

  window.addEventListener(
    'mousemove',
    (e) => {
      mouse.x = e.clientX / Math.max(1, w);
      mouse.y = e.clientY / Math.max(1, h);
    },
    { passive: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
})();


