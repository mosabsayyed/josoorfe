import React, { useEffect, useRef } from 'react';

interface SparkleProps {
  imageSrc: string;
  dotCount?: number;
}

export default function Sparkle({ imageSrc, dotCount = 600 }: SparkleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    imgRef.current = img;

    let currentW = 0;
    let currentH = 0;

    const initAnimation = (W: number, H: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !img.complete || img.naturalWidth === 0) return;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      canvas.width = W;
      canvas.height = H;

      const isRTL = document.documentElement.dir === 'rtl';
      const scale = Math.min(W / img.width, H / img.height) * 0.52;
      const iw = img.width * scale;
      const ih = img.height * scale;
      const ox = isRTL ? (W - iw) * 0.99 : (W - iw) * 0.01;
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
        homeX: number;
        homeY: number;
        vx: number;
        vy: number;
        speed: number;
        phase: number;
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

      const SCATTER_DUR = 3000;
      const MORPH_IN_DUR = 2000;
      const GRAPH_DUR = 3000;
      const MORPH_OUT_DUR = 2000;
      const CYCLE = SCATTER_DUR + MORPH_IN_DUR + GRAPH_DUR + MORPH_OUT_DUR;

      const maxConnections = isMobile ? 2 : 3;
      const connectionDistance = isMobile ? 60 : 90;
      const startTime = Date.now();

      const draw = () => {
        const t = Date.now() - startTime;
        const cycleT = t % CYCLE;

        let morphProgress: number;
        if (cycleT < SCATTER_DUR) {
          morphProgress = 0;
        } else if (cycleT < SCATTER_DUR + MORPH_IN_DUR) {
          const p = (cycleT - SCATTER_DUR) / MORPH_IN_DUR;
          morphProgress = p * p * (3 - 2 * p);
        } else if (cycleT < SCATTER_DUR + MORPH_IN_DUR + GRAPH_DUR) {
          morphProgress = 1;
        } else {
          const p = (cycleT - (SCATTER_DUR + MORPH_IN_DUR + GRAPH_DUR)) / MORPH_OUT_DUR;
          const smooth = p * p * (3 - 2 * p);
          morphProgress = 1 - smooth;
        }

        const sp = morphProgress;

        ctx.clearRect(0, 0, W, H);

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

        const scatter = 1 - sp;
        const speedFactor = scatter * scatter * scatter;
        
        for (const dot of dots) {
          dot.x += dot.vx * speedFactor;
          dot.y += dot.vy * speedFactor;

          const homePull = sp * sp * 0.1;
          if (homePull > 0.001) {
            dot.x += (dot.homeX - dot.x) * homePull;
            dot.y += (dot.homeY - dot.y) * homePull;
          }

          const pad = 40;
          if (dot.x < ox + pad || dot.x > ox + iw - pad) dot.vx *= -1;
          if (dot.y < oy + pad || dot.y > oy + ih - pad) dot.vy *= -1;
          dot.x = Math.max(ox + pad, Math.min(ox + iw - pad, dot.x));
          dot.y = Math.max(oy + pad, Math.min(oy + ih - pad, dot.y));
        }

        const r = Math.floor(255 + (244 - 255) * sp);
        const g = Math.floor(255 + (187 - 255) * sp);
        const b = Math.floor(255 + (48 - 255) * sp);

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

        for (const dot of dots) {
          const twinkle = Math.sin(t * dot.speed + dot.phase) * 0.5 + 0.5;
          const alpha = sp < 0.5
            ? twinkle * (0.5 + sp)
            : 0.7 + twinkle * 0.3;

          if (alpha < 0.03) continue;

          const nodeRadius = dot.radius + sp * 0.6;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();

          if (sp < 0.5 && alpha > 0.6) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, nodeRadius + 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.15})`;
            ctx.fill();
          }

          if (sp > 0.6) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, nodeRadius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 8, 15, 0.8)';
            ctx.fill();
          }
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    img.onload = () => {
      // Re-init with latest recorded dimensions
      if (currentW > 0 && currentH > 0) {
        initAnimation(currentW, currentH);
      }
    };
    img.src = imageSrc;

    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        
        currentW = width;
        currentH = height;
        
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          initAnimation(width, height);
        }, 150); // Debounce to prevent heavy recalculation on fast resize
      }
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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
