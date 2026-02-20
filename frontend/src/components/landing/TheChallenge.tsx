import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Dice5, Zap } from 'lucide-react';

interface Node {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  radius: number;
}

const NUM_NODES = 100;
const BG = '#111827';

export default function TheChallenge() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes: Node[] = [];
    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseVx: (Math.random() - 0.5) * 4,
        baseVy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 2 + 1.5,
      });
    }

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate scroll-driven speed: 1 = fully visible (fast), 0 = scrolled away (still)
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / vh));
      const speedFactor = Math.max(0, 1 - scrollProgress * 1.25);

      // Color: grey → gold as scroll progresses
      const r = Math.floor(200 + (244 - 200) * scrollProgress);
      const g = Math.floor(200 + (187 - 200) * scrollProgress);
      const b = Math.floor(200 + (48 - 200) * scrollProgress);

      for (const n of nodes) {
        n.x += n.baseVx * speedFactor;
        n.y += n.baseVy * speedFactor;
        if (n.x < 0 || n.x > canvas.width) n.baseVx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.baseVy *= -1;
      }

      // Sparse grey connections
      for (let i = 0; i < nodes.length; i++) {
        let conn = 0;
        for (let j = i + 1; j < nodes.length; j++) {
          if (conn >= 2) break;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            conn++;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / 120) * (0.3 + scrollProgress * 0.2)})`;
            ctx.lineWidth = 0.5 + scrollProgress * 1.5;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Grey nodes with glow
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const aiItems = t('aitoia.aiItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>;
  const icons = [AlertTriangle, Dice5, Zap];

  return (
    <div
      id="challenge"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />

      <div className="aitoia-glass" style={{ opacity: 1 }}>
        <div className="aitoia-header">
          <span className="aitoia-tag">{t('aitoia.tag')}</span>
          <h2>{t('aitoia.title')}</h2>
          <p className="subtitle" style={{ maxWidth: '560px' }}>{t('aitoia.challengeSubtitle')}</p>
        </div>

        <div className="aitoia-block aitoia-ai" style={{ opacity: 1, pointerEvents: 'auto' }}>
          <ul>
            {aiItems.map((item, i) => {
              const Icon = icons[i];
              return (
                <li key={i}>
                  <Icon size={28} style={{ display: 'inline-block', marginInlineEnd: '8px', verticalAlign: 'middle', color: 'var(--component-text-accent)' }} />
                  <strong>{item.strong}</strong>
                  {item.desc}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
