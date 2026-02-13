import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  captured: boolean;
  captureProgress: number;
}

const COLORS = ['#EF4444', '#F4BB30', '#3B82F6', '#9B7AF7', '#10B981', '#1A7AA8', '#808894'];
const CONVERGENCE_X = 0.78;
const CONVERGENCE_Y = 0.5;

export default function NoiseParticles({ width = 600, height = 200 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width * CONVERGENCE_X;
    const cy = height * CONVERGENCE_Y;

    // Init particles
    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width * 0.6,
        y: Math.random() * height,
        vx: (Math.random() - 0.3) * 1.5,
        vy: (Math.random() - 0.5) * 1.2,
        r: 1.5 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        captured: false,
        captureProgress: 0,
      });
    }
    particlesRef.current = particles;

    let pulsePhase = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      pulsePhase += 0.03;

      // Draw convergence dot (pulsing)
      const pulseR = 5 + Math.sin(pulsePhase) * 3;
      const pulseAlpha = 0.7 + Math.sin(pulsePhase) * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR + 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 187, 48, ${pulseAlpha * 0.2})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 187, 48, ${pulseAlpha})`;
      ctx.fill();

      // Output line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(width * 0.95, cy);
      ctx.strokeStyle = 'rgba(244, 187, 48, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(244, 187, 48, 0.4)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // "one signal" label
      ctx.font = '600 11px monospace';
      ctx.fillStyle = '#F4BB30';
      ctx.textAlign = 'left';
      ctx.fillText('one signal', width * 0.95 + 4 > width - 60 ? width - 60 : width * 0.95 + 4, cy + 4);

      // "scattered inputs" label
      ctx.font = '11px monospace';
      ctx.fillStyle = '#808894';
      ctx.textAlign = 'left';
      ctx.fillText('scattered inputs', 8, 16);

      for (const p of particles) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Random chance to get "captured" (start streaming toward dot)
        if (!p.captured && dist < width * 0.45 && Math.random() < 0.003) {
          p.captured = true;
          p.captureProgress = 0;
        }

        if (p.captured) {
          // Accelerate toward convergence point
          p.captureProgress += 0.012;
          const pull = 0.02 + p.captureProgress * 0.08;
          p.vx += dx * pull * 0.01;
          p.vy += dy * pull * 0.01;

          // Draw stretching line from particle toward convergence
          const lineAlpha = Math.min(1, p.captureProgress * 2);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          // Line stretches toward convergence as particle approaches
          const lx = p.x + dx * Math.min(0.5, p.captureProgress);
          const ly = p.y + dy * Math.min(0.5, p.captureProgress);
          ctx.lineTo(lx, ly);
          ctx.strokeStyle = p.color.replace(')', `, ${lineAlpha * 0.5})`).replace('rgb', 'rgba').replace('#', '');
          // Use hex color with alpha via globalAlpha
          ctx.globalAlpha = lineAlpha * 0.5;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Reset when reached
          if (dist < 8) {
            p.x = Math.random() * width * 0.3;
            p.y = Math.random() * height;
            p.vx = (Math.random() - 0.3) * 1.5;
            p.vy = (Math.random() - 0.5) * 1.2;
            p.captured = false;
            p.captureProgress = 0;
          }
        } else {
          // Random bouncing
          p.vx += (Math.random() - 0.5) * 0.3;
          p.vy += (Math.random() - 0.5) * 0.3;

          // Dampen
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounds (left 60% for non-captured)
        if (!p.captured) {
          if (p.x < 0) { p.x = 0; p.vx *= -1; }
          if (p.x > width * 0.65) { p.x = width * 0.65; p.vx *= -1; }
        }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.captured ? 0.8 : 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw connections between nearby particles (collision/proximity)
        for (const q of particles) {
          if (p === q) continue;
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 40 && !p.captured && !q.captured) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.1 * (1 - dd / 40);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
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
