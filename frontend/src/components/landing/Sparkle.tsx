import React, { useEffect, useRef } from 'react';

interface SparkleProps {
  imageSrc: string;
  dotCount?: number;
}

export default function Sparkle({ imageSrc, dotCount = 600 }: SparkleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const W = canvas.width;
      const H = canvas.height;
      const scale = Math.min(W / img.width, H / img.height) * 0.85;
      const iw = img.width * scale;
      const ih = img.height * scale;
      const ox = (W - iw) / 2;
      const oy = (H - ih) / 2;

      // Hidden canvas for pixel sampling
      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = W;
      hiddenCanvas.height = H;
      const hiddenCtx = hiddenCanvas.getContext('2d');
      if (!hiddenCtx) return;

      hiddenCtx.drawImage(img, ox, oy, iw, ih);
      const pixelData = hiddenCtx.getImageData(0, 0, W, H).data;

      const isDark = (px: number, py: number): boolean => {
        const i = (Math.floor(py) * W + Math.floor(px)) * 4;
        return (
          pixelData[i + 3] > 100 &&
          pixelData[i] < 80 &&
          pixelData[i + 1] < 80 &&
          pixelData[i + 2] < 90
        );
      };

      // Map contour for border
      const getMapContour = (): { x: number; y: number }[] => {
        const contour: { x: number; y: number }[] = [];
        const step = 4;
        for (let y = Math.floor(oy); y < Math.floor(oy + ih); y += step) {
          for (let x = Math.floor(ox); x < Math.floor(ox + iw); x += step) {
            if (isDark(x, y)) {
              const isEdge =
                !isDark(x - step, y) || !isDark(x + step, y) ||
                !isDark(x, y - step) || !isDark(x, y + step);
              if (isEdge) contour.push({ x, y });
            }
          }
        }
        return contour;
      };

      const mapContour = getMapContour();

      // ── Particle type with velocity for morphing ──
      interface Dot {
        x: number;
        y: number;
        homeX: number;  // original position inside map
        homeY: number;
        vx: number;     // velocity for scatter phase
        vy: number;
        speed: number;  // twinkle speed
        phase: number;  // twinkle phase offset
        radius: number;
      }

      const isMobile = W <= 768;
      const velocityMultiplier = isMobile ? 0.6 : 1.0;
      const dots: Dot[] = [];
      let attempts = 0;
      const maxAttempts = 20000;

      while (dots.length < dotCount && attempts < maxAttempts) {
        const dx = ox + Math.random() * iw;
        const dy = oy + Math.random() * ih;

        if (isDark(dx, dy)) {
          dots.push({
            x: dx,
            y: dy,
            homeX: dx,
            homeY: dy,
            vx: (Math.random() - 0.5) * velocityMultiplier,
            vy: (Math.random() - 0.5) * velocityMultiplier,
            speed: 0.002 + Math.random() * 0.012,
            phase: Math.random() * Math.PI * 2,
            radius: 0.4 + Math.random() * 1.0,
          });
        }
        attempts++;
      }

      // ── Morph cycle timing (ms) ──
      const SCATTER_DUR = 3000;   // random drift
      const MORPH_IN_DUR = 2000;  // forming graph
      const GRAPH_DUR = 3000;     // hold as graph
      const MORPH_OUT_DUR = 2000; // dissolving back
      const CYCLE = SCATTER_DUR + MORPH_IN_DUR + GRAPH_DUR + MORPH_OUT_DUR;

      // Connection config
      const maxConnections = isMobile ? 2 : 3;
      const connectionDistance = isMobile ? 60 : 90;

      const startTime = Date.now();
      let animationId: number;

      const draw = () => {
        const t = Date.now() - startTime;
        const cycleT = t % CYCLE;

        // ── Compute morph progress (0 = scattered, 1 = graph) ──
        let morphProgress: number;
        if (cycleT < SCATTER_DUR) {
          // Scattered phase
          morphProgress = 0;
        } else if (cycleT < SCATTER_DUR + MORPH_IN_DUR) {
          // Morphing in
          const p = (cycleT - SCATTER_DUR) / MORPH_IN_DUR;
          morphProgress = p * p * (3 - 2 * p); // smoothstep
        } else if (cycleT < SCATTER_DUR + MORPH_IN_DUR + GRAPH_DUR) {
          // Holding as graph
          morphProgress = 1;
        } else {
          // Morphing out
          const p = (cycleT - SCATTER_DUR - MORPH_IN_DUR - GRAPH_DUR) / MORPH_OUT_DUR;
          const smooth = p * p * (3 - 2 * p);
          morphProgress = 1 - smooth;
        }

        const sp = morphProgress; // shorthand

        // ── Clear ──
        ctx.fillStyle = '#06080f';
        ctx.fillRect(0, 0, W, H);

        // ── Draw KSA map image + contour ──
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.drawImage(img, ox, oy, iw, ih);

        if (mapContour.length > 0) {
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = 'rgba(244, 187, 48, 0.6)';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(mapContour[0].x, mapContour[0].y);
          for (let i = 1; i < mapContour.length; i++) {
            ctx.lineTo(mapContour[i].x, mapContour[i].y);
          }
          ctx.stroke();

          ctx.globalAlpha = 0.15;
          ctx.lineWidth = 8;
          ctx.filter = 'blur(6px)';
          ctx.beginPath();
          ctx.moveTo(mapContour[0].x, mapContour[0].y);
          for (let i = 1; i < mapContour.length; i++) {
            ctx.lineTo(mapContour[i].x, mapContour[i].y);
          }
          ctx.stroke();
          ctx.filter = 'none';
        }
        ctx.restore();

        // ── Move particles ──
        // Smooth cubic ease: drift strongest at sp=0, zero at sp=1
        const scatter = 1 - sp;
        const speedFactor = scatter * scatter * scatter; // cubic ease-in for drift

        for (const dot of dots) {
          // Drift with velocity (smoothly fades out as graph forms)
          dot.x += dot.vx * speedFactor;
          dot.y += dot.vy * speedFactor;

          // Lerp toward home — cubic ease so it ramps up/down symmetrically
          const homePull = sp * sp * 0.1;
          if (homePull > 0.001) {
            dot.x += (dot.homeX - dot.x) * homePull;
            dot.y += (dot.homeY - dot.y) * homePull;
          }

          // Bounce off map bounds (keep well inside image area)
          const pad = 40;
          if (dot.x < ox + pad || dot.x > ox + iw - pad) dot.vx *= -1;
          if (dot.y < oy + pad || dot.y > oy + ih - pad) dot.vy *= -1;
          dot.x = Math.max(ox + pad, Math.min(ox + iw - pad, dot.x));
          dot.y = Math.max(oy + pad, Math.min(oy + ih - pad, dot.y));
        }

        // ── Color: white → gold ──
        const r = Math.floor(255 + (244 - 255) * sp);
        const g = Math.floor(255 + (187 - 255) * sp);
        const b = Math.floor(255 + (48 - 255) * sp);

        // ── Draw connections (when morphing in) ──
        if (sp > 0.1) {
          for (let i = 0; i < dots.length; i++) {
            let conn = 0;
            for (let j = i + 1; j < dots.length; j++) {
              if (conn >= maxConnections) break;
              const dx = dots[i].x - dots[j].x;
              const dy = dots[i].y - dots[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < connectionDistance) {
                conn++;
                const dOp = (1 - dist / connectionDistance) * sp;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${r},${g},${b},${dOp * 0.35})`;
                ctx.lineWidth = 0.2 + sp * 0.5;
                ctx.moveTo(dots[i].x, dots[i].y);
                ctx.lineTo(dots[j].x, dots[j].y);
                ctx.stroke();
              }
            }
          }
        }

        // ── Draw particles ──
        for (const dot of dots) {
          const twinkle = (Math.sin(t * dot.speed + dot.phase) * 0.5 + 0.5);
          // During scatter: twinkle opacity. During graph: full opacity.
          const alpha = sp < 0.5
            ? twinkle * (0.5 + sp)
            : 0.7 + twinkle * 0.3;

          if (alpha < 0.03) continue;

          const nodeRadius = dot.radius + sp * 0.6;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();

          // Glow on bright scatter dots
          if (sp < 0.5 && alpha > 0.6) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, nodeRadius + 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.15})`;
            ctx.fill();
          }

          // Inner ring on graph dots
          if (sp > 0.6) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, nodeRadius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = '#06080f';
            ctx.fill();
          }
        }

        animationId = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        if (animationId) cancelAnimationFrame(animationId);
      };
    };

    img.src = imageSrc;

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateCanvasSize();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [imageSrc, dotCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
