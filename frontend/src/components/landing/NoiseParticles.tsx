import React, { useRef, useEffect } from 'react';

/**
 * NoNoise particle animation v2:
 * - Particles drift randomly, colliding with each other
 * - On collision, particles stretch into lines (merge into a streak)
 * - Streaks flow into a pulsating gold convergence dot
 * - Clean output line extends right from the dot
 */

const PALETTE = [
  [239, 68, 68],   // red
  [244, 187, 48],  // gold
  [59, 130, 246],  // blue
  [155, 122, 247], // purple
  [16, 185, 129],  // green
  [26, 122, 168],  // teal
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: number[]; // RGB
  alpha: number;
  id: number;
}

interface Streak {
  // A merged pair that stretches into a line and flows to the dot
  x: number;
  y: number;
  angle: number;
  length: number;
  targetLength: number;
  color: number[];
  alpha: number;
  // Flow to convergence
  t: number; // 0→1 progress toward dot
  startX: number;
  startY: number;
  speed: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export default function NoiseParticles({ width = 600, height = 200 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Convergence point
    const cx = width * 0.78;
    const cy = height * 0.5;

    let nextId = 0;
    const particles: Particle[] = [];
    const streaks: Streak[] = [];
    let pulsePhase = 0;

    function spawnParticle(): Particle {
      return {
        x: Math.random() * width * 0.55 + 10,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 0.9,
        r: 2.5 + Math.random() * 2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 0.4 + Math.random() * 0.4,
        id: nextId++,
      };
    }

    // Initial particles
    for (let i = 0; i < 28; i++) {
      particles.push(spawnParticle());
    }

    function dist(a: Particle, b: Particle) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function bezier(t: number, p0: number, p1: number, p2: number, p3: number) {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      pulsePhase += 0.025;

      // --- Update particles ---
      for (const p of particles) {
        // Random walk
        p.vx += (Math.random() - 0.5) * 0.2;
        p.vy += (Math.random() - 0.5) * 0.15;
        // Occasional kick
        if (Math.random() < 0.015) {
          p.vx += (Math.random() - 0.5) * 2.0;
          p.vy += (Math.random() - 0.5) * 1.5;
        }
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off bounds (left zone only)
        if (p.x < 5) { p.x = 5; p.vx = Math.abs(p.vx) * 0.6; }
        if (p.x > width * 0.58) { p.x = width * 0.58; p.vx = -Math.abs(p.vx) * 0.6; }
        if (p.y < 5) { p.y = 5; p.vy = Math.abs(p.vy) * 0.6; }
        if (p.y > height - 5) { p.y = height - 5; p.vy = -Math.abs(p.vy) * 0.6; }
      }

      // --- Detect collisions → create streaks ---
      const toRemove = new Set<number>();
      for (let i = 0; i < particles.length; i++) {
        if (toRemove.has(particles[i].id)) continue;
        for (let j = i + 1; j < particles.length; j++) {
          if (toRemove.has(particles[j].id)) continue;
          const a = particles[i], b = particles[j];
          const d = dist(a, b);
          if (d < (a.r + b.r) + 6) {
            // Collision! Merge into a streak
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            streaks.push({
              x: mx,
              y: my,
              angle,
              length: d,
              targetLength: 20 + Math.random() * 25,
              color: a.color,
              alpha: 0.8,
              t: 0,
              startX: mx,
              startY: my,
              speed: 0.006 + Math.random() * 0.006,
              trail: [],
            });
            toRemove.add(a.id);
            toRemove.add(b.id);
            break; // one collision per particle per frame
          }
        }
      }

      // Remove collided particles and respawn new ones
      if (toRemove.size > 0) {
        const ids = [...toRemove];
        for (const id of ids) {
          const idx = particles.findIndex(p => p.id === id);
          if (idx >= 0) particles.splice(idx, 1);
        }
        // Respawn after a delay (stagger)
        setTimeout(() => {
          for (let k = 0; k < ids.length; k++) {
            particles.push(spawnParticle());
          }
        }, 400 + Math.random() * 600);
      }

      // --- Draw particles ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const breathe = Math.sin(pulsePhase * 1.5 + i * 1.7) * 0.6;
        const drawR = p.r + breathe;
        const [r, g, b] = p.color;

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        ctx.fill();
      }

      // --- Update & draw streaks (stretch then flow to dot) ---
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        const [r, g, b] = s.color;

        // Phase 1: Stretch (t < 0.15)
        if (s.t < 0.15) {
          s.length += (s.targetLength - s.length) * 0.15;
          s.t += s.speed;

          // Draw stretching line at collision point
          const cos = Math.cos(s.angle);
          const sin = Math.sin(s.angle);
          const halfL = s.length / 2;

          ctx.beginPath();
          ctx.moveTo(s.x - cos * halfL, s.y - sin * halfL);
          ctx.lineTo(s.x + cos * halfL, s.y + sin * halfL);
          ctx.strokeStyle = `rgba(${r},${g},${b},${s.alpha})`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          // Phase 2: Flow to convergence dot
          s.t += s.speed + s.t * 0.01;

          const flowT = Math.min((s.t - 0.15) / 0.85, 1); // normalize to 0-1

          // Bezier curve to dot
          const cp1x = s.startX + (cx - s.startX) * 0.3;
          const cp1y = s.startY - 25 + Math.sin(s.startY) * 15;
          const cp2x = cx - 50;
          const cp2y = cy;

          const px = bezier(flowT, s.startX, cp1x, cp2x, cx);
          const py = bezier(flowT, s.startY, cp1y, cp2y, cy);

          // Rotate angle toward dot as it flows
          const targetAngle = Math.atan2(cy - py, cx - px);
          s.angle += (targetAngle - s.angle) * 0.08;

          // Shrink as it approaches
          const scale = 1 - flowT * 0.6;
          const halfL = (s.length * scale) / 2;
          const cos = Math.cos(s.angle);
          const sin = Math.sin(s.angle);

          // Trail
          s.trail.push({ x: px, y: py, alpha: 0.4 });
          if (s.trail.length > 15) s.trail.shift();

          for (const tp of s.trail) {
            tp.alpha *= 0.9;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${tp.alpha})`;
            ctx.fill();
          }

          // Draw flowing streak
          s.alpha = 0.8 * (1 - flowT * 0.5);
          ctx.beginPath();
          ctx.moveTo(px - cos * halfL, py - sin * halfL);
          ctx.lineTo(px + cos * halfL, py + sin * halfL);
          ctx.strokeStyle = `rgba(${r},${g},${b},${s.alpha})`;
          ctx.lineWidth = 2.5 * scale;
          ctx.lineCap = 'round';
          ctx.stroke();

          if (flowT >= 1) {
            streaks.splice(i, 1);
          }
        }
      }

      // --- Convergence dot with pulse ---
      const glowR = 14 + Math.sin(pulsePhase) * 5;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      gradient.addColorStop(0, 'rgba(244, 187, 48, 0.55)');
      gradient.addColorStop(0.5, 'rgba(244, 187, 48, 0.12)');
      gradient.addColorStop(1, 'rgba(244, 187, 48, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core gold dot — pulsating
      const dotR = 4.5 + Math.sin(pulsePhase * 1.3) * 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = '#F4BB30';
      ctx.fill();

      // --- Output line ---
      ctx.beginPath();
      ctx.moveTo(cx + dotR + 2, cy);
      ctx.lineTo(width * 0.92, cy);
      ctx.strokeStyle = 'rgba(244, 187, 48, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // --- Labels ---
      ctx.font = '600 11px "SF Mono", "Fira Code", monospace';
      ctx.fillStyle = '#F4BB30';
      ctx.textAlign = 'left';
      ctx.fillText('one signal', Math.min(width * 0.92 + 6, width - 62), cy + 4);

      ctx.font = '11px "SF Mono", "Fira Code", monospace';
      ctx.fillStyle = '#808894';
      ctx.textAlign = 'left';
      ctx.fillText('scattered inputs', 8, 16);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px`, display: 'block', margin: '0 auto' }}
    />
  );
}
