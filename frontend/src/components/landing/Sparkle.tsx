import React, { useEffect, useRef } from 'react';

interface SparkleProps {
  imageSrc: string;
  dotCount?: number;
  scaleFactor?: number;
}

export default function Sparkle({ imageSrc, dotCount = 600, scaleFactor = 0.52 }: SparkleProps) {
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
      const rawScale = Math.min(W / img.width, H / img.height) * scaleFactor;
      const scale = Math.min(rawScale, 0.28);
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

      interface Dot {
        x: number;
        y: number;
        vx: number;
        vy: number;
        speed: number;
        phase: number;
        radius: number;
      }

      const isMobile = W <= 768;
      const vel = isMobile ? 0.3 : 0.5;
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
            vx: (Math.random() - 0.5) * vel,
            vy: (Math.random() - 0.5) * vel,
            speed: 0.002 + Math.random() * 0.008,
            phase: Math.random() * Math.PI * 2,
            radius: 0.4 + Math.random() * 0.8,
          });
        }
        attempts++;
      }

      const startTime = Date.now();

      const draw = () => {
        const t = Date.now() - startTime;
        ctx.clearRect(0, 0, W, H);

        // Draw map image
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.drawImage(img, ox, oy, iw, ih);
        ctx.restore();

        // Move and draw sparkle dots
        const pad = 30;
        for (const dot of dots) {
          dot.x += dot.vx;
          dot.y += dot.vy;

          if (dot.x < ox + pad || dot.x > ox + iw - pad) dot.vx *= -1;
          if (dot.y < oy + pad || dot.y > oy + ih - pad) dot.vy *= -1;
          dot.x = Math.max(ox + pad, Math.min(ox + iw - pad, dot.x));
          dot.y = Math.max(oy + pad, Math.min(oy + ih - pad, dot.y));

          const twinkle = Math.sin(t * dot.speed + dot.phase) * 0.5 + 0.5;
          const alpha = twinkle * 0.7 + 0.1;
          if (alpha < 0.05) continue;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();

          // Soft glow on bright dots
          if (alpha > 0.5) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius + 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(244,187,48,${alpha * 0.12})`;
            ctx.fill();
          }
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    img.onload = () => {
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
        resizeTimer = setTimeout(() => initAnimation(width, height), 150);
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
  }, [imageSrc, dotCount, scaleFactor]);

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
