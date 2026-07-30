/**
 * Lightweight procedural HTML5 Canvas Confetti Burst
 * Respects prefers-reduced-motion and accessibility toggles.
 */

export function triggerConfetti(options = {}) {
  // Check browser prefers-reduced-motion setting
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const duration = options.duration || 1200; // ms
  const count = options.count || 45;
  
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const context = ctx;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  context.scale(window.devicePixelRatio, window.devicePixelRatio);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7'];
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: width / 2,
      y: height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }

  const startTime = Date.now();

  function render() {
    const elapsed = Date.now() - startTime;
    if (elapsed >= duration) {
      canvas.remove();
      return;
    }

    context.clearRect(0, 0, width, height);

    const progress = elapsed / duration;
    const fade = 1 - progress;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravity
      p.rotation += p.rSpeed;

      context.save();
      context.translate(p.x, p.y);
      context.rotate((p.rotation * Math.PI) / 180);
      context.globalAlpha = fade * p.opacity;
      context.fillStyle = p.color;
      context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      context.restore();
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
