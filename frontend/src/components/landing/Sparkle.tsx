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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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

      // Create hidden canvas for pixel data
      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = W;
      hiddenCanvas.height = H;
      const hiddenCtx = hiddenCanvas.getContext('2d');
      if (!hiddenCtx) return;

      hiddenCtx.drawImage(img, ox, oy, iw, ih);
      const pixelData = hiddenCtx.getImageData(0, 0, W, H).data;

      // Check if pixel is dark (part of the image)
      const isDark = (px: number, py: number): boolean => {
        const i = (Math.floor(py) * W + Math.floor(px)) * 4;
        return (
          pixelData[i + 3] > 100 && // has alpha
          pixelData[i] < 80 &&       // low red
          pixelData[i + 1] < 80 &&   // low green
          pixelData[i + 2] < 90      // low blue
        );
      };

      // Generate sparkle dots at dark pixel locations
      interface Dot {
        x: number;
        y: number;
        speed: number;
        phase: number;
        radius: number;
      }

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
            speed: 0.001 + Math.random() * 0.008,
            phase: Math.random() * Math.PI * 2,
            radius: 0.5 + Math.random() * 1.2,
          });
        }
        attempts++;
      }

      // Animation loop
      const startTime = Date.now();
      let animationId: number;

      const draw = () => {
        const t = Date.now() - startTime;

        // Clear canvas with dark background
        ctx.fillStyle = '#06080f';
        ctx.fillRect(0, 0, W, H);

        // Draw faint image
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.drawImage(img, ox, oy, iw, ih);
        ctx.restore();

        // Draw sparkle dots
        for (const dot of dots) {
          const alpha = (Math.sin(t * dot.speed + dot.phase) * 0.5 + 0.5) * 0.7;
          if (alpha < 0.02) continue;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }

        animationId = requestAnimationFrame(draw);
      };

      draw();

      // Cleanup
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    };

    img.src = imageSrc;

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
