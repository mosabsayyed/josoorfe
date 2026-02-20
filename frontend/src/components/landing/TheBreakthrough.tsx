import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Link, Building2 } from 'lucide-react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const NUM_NODES = 100;
const BG = '#111827';

export default function TheBreakthrough() {
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
        vx: 0,
        vy: 0,
        radius: Math.random() * 2 + 2,
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

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }

      // Dense gold connections
      for (let i = 0; i < nodes.length; i++) {
        let conn = 0;
        for (let j = i + 1; j < nodes.length; j++) {
          if (conn >= 4) break;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            conn++;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(244,187,48,${(1 - dist / 180) * 0.5})`;
            ctx.lineWidth = 1.2;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Gold nodes with ring effect
      for (const n of nodes) {
        ctx.fillStyle = 'rgb(244,187,48)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = BG;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const iaItems = t('aitoia.iaItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>;
  const icons = [CheckCircle2, Link, Building2];

  return (
    <div
      id="breakthrough"
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
          <span className="aitoia-tag">{t('aitoia.innovationTag')}</span>
          <h2>{t('aitoia.innovationTitle')}</h2>
          <p className="subtitle" style={{ maxWidth: '560px' }}>{t('aitoia.innovationSubtitle')}</p>
        </div>

        <div className="aitoia-block aitoia-ia" style={{ opacity: 1, pointerEvents: 'auto' }}>
          <ul>
            {iaItems.map((item, i) => {
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
