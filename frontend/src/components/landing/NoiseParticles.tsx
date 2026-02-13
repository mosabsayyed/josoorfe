import React, { useRef, useEffect } from 'react';

/**
 * Elegant noise-to-signal animation:
 * - Soft glowing dots drift lazily across the left side
 * - Periodically, a dot gets "captured" and flows smoothly along a curved path into the convergence point
 * - A thin luminous trail follows the captured dot
 * - The convergence dot pulses gently with a warm glow
 * - Clean output line extends right
 */

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
  // Capture state
  captured: boolean;
  t: number; // 0-1 interpolation along capture path
  startX: number;
  startY: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

const PALETTE = [
  'rgba(239, 68, 68, 0.6)',   // red
  'rgba(244, 187, 48, 0.5)',  // gold
  'rgba(59, 130, 246, 0.6)',  // blue
  'rgba(155, 122, 247, 0.5)', // purple
  'rgba(16, 185, 129, 0.6)',  // green
  'rgba(26, 122, 168, 0.5)',  // teal
];

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

    const cx = width * 0.78;
    const cy = height * 0.5;

    // Create dots — gentle drifters
    const dots: Dot[] = [];
    for (let i = 0; i < 24; i++) {
      dots.push(makeDot(width, height));
    }

    let pulsePhase = 0;
    let captureTimer = 0;

    function makeDot(w: number, h: number): Dot {
      return {
        x: Math.random() * w * 0.55 + 10,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        r: 2 + Math.random() * 2.5,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 0.3 + Math.random() * 0.4,
        captured: false,
        t: 0,
        startX: 0,
        startY: 0,
        trail: [],
      };
    }

    // Cubic bezier interpolation for smooth capture path
    function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number) {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      pulsePhase += 0.025;
      captureTimer++;

      // --- Convergence glow ---
      const glowR = 12 + Math.sin(pulsePhase) * 4;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      gradient.addColorStop(0, 'rgba(244, 187, 48, 0.5)');
      gradient.addColorStop(0.5, 'rgba(244, 187, 48, 0.1)');
      gradient.addColorStop(1, 'rgba(244, 187, 48, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core dot
      const dotR = 4 + Math.sin(pulsePhase) * 1.5;
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

      // Labels
      ctx.font = '600 11px "SF Mono", "Fira Code", monospace';
      ctx.fillStyle = '#F4BB30';
      ctx.textAlign = 'left';
      ctx.fillText('one signal', Math.min(width * 0.92 + 6, width - 62), cy + 4);

      ctx.font = '11px "SF Mono", "Fira Code", monospace';
      ctx.fillStyle = '#808894';
      ctx.textAlign = 'left';
      ctx.fillText('scattered inputs', 8, 16);

      // --- Capture one dot every ~120 frames ---
      if (captureTimer > 90 + Math.random() * 60) {
        captureTimer = 0;
        const free = dots.filter(d => !d.captured);
        if (free.length > 0) {
          const pick = free[Math.floor(Math.random() * free.length)];
          pick.captured = true;
          pick.t = 0;
          pick.startX = pick.x;
          pick.startY = pick.y;
          pick.trail = [];
        }
      }

      // --- Update & draw dots ---
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        if (d.captured) {
          d.t += 0.008 + d.t * 0.012; // ease-in: accelerates

          // Bezier control points for a nice curve
          const cp1x = d.startX + (cx - d.startX) * 0.3;
          const cp1y = d.startY - 30 + Math.sin(d.startY) * 20;
          const cp2x = cx - 60;
          const cp2y = cy;

          const px = bezierPoint(d.t, d.startX, cp1x, cp2x, cx);
          const py = bezierPoint(d.t, d.startY, cp1y, cp2y, cy);

          // Trail
          d.trail.push({ x: px, y: py, alpha: 0.6 });
          if (d.trail.length > 20) d.trail.shift();

          // Draw trail
          for (let j = 0; j < d.trail.length; j++) {
            const tp = d.trail[j];
            tp.alpha *= 0.92;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, d.r * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = d.color.replace(/[\d.]+\)$/, `${tp.alpha})`);
            ctx.fill();
          }

          // Draw dot
          ctx.beginPath();
          ctx.arc(px, py, d.r * (1 - d.t * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();

          d.x = px;
          d.y = py;

          // Reset when arrived
          if (d.t >= 1) {
            Object.assign(d, makeDot(width, height));
          }
        } else {
          // Gentle drift
          d.vx += (Math.random() - 0.5) * 0.05;
          d.vy += (Math.random() - 0.5) * 0.05;
          d.vx *= 0.98;
          d.vy *= 0.98;
          d.x += d.vx;
          d.y += d.vy;

          // Soft bounds
          if (d.x < 5) d.vx += 0.1;
          if (d.x > width * 0.58) d.vx -= 0.1;
          if (d.y < 5) d.vy += 0.1;
          if (d.y > height - 5) d.vy -= 0.1;

          // Draw dot with soft glow
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.fill();
        }
      }

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
