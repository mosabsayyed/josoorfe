import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Node {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  radius: number;
}

const NUM_NODES = 140;
const BG = '#111827'; // matches --component-bg-primary

export default function AItoIA() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const iaRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const scrollRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const timeline = timelineRef.current;
    const viewer = viewerRef.current;
    const aiEl = aiRef.current;
    const iaEl = iaRef.current;
    if (!canvas || !timeline || !viewer || !aiEl || !iaEl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particle nodes
    const nodes: Node[] = [];
    for (let i = 0; i < NUM_NODES; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseVx: (Math.random() - 0.5) * 2.5,
        baseVy: (Math.random() - 0.5) * 2.5,
        radius: Math.random() * 2 + 2,
      });
    }
    nodesRef.current = nodes;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;

      // ── JS-controlled pinning (replaces CSS position:sticky) ──
      // This bypasses all CSS scroll-container issues in the SPA
      if (rect.top <= 0 && rect.bottom > vh) {
        // PINNED: timeline is scrolling through viewport
        viewer.style.position = 'fixed';
        viewer.style.top = '0px';
        viewer.style.bottom = 'auto';
      } else if (rect.bottom <= vh) {
        // PAST: scrolled beyond timeline — park viewer at bottom
        viewer.style.position = 'absolute';
        viewer.style.top = 'auto';
        viewer.style.bottom = '0px';
      } else {
        // BEFORE: haven't reached timeline yet — sit at top
        viewer.style.position = 'absolute';
        viewer.style.top = '0px';
        viewer.style.bottom = 'auto';
      }

      // ── Scroll progress (0 → 1) ──
      const raw = -rect.top / (rect.height - vh);
      targetRef.current = Math.min(Math.max(raw, 0), 1);
      scrollRef.current += (targetRef.current - scrollRef.current) * 0.1;
      const sp = scrollRef.current;

      // Crossfade text blocks
      aiEl.style.opacity = String(Math.max(1 - sp * 2.5, 0));
      iaEl.style.opacity = String(Math.max((sp - 0.6) * 2.5, 0));

      // Clear
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const speedFactor = Math.max(0, 1 - sp * 1.25);

      // Move nodes
      for (const n of nodes) {
        n.x += n.baseVx * speedFactor;
        n.y += n.baseVy * speedFactor;
        if (n.x < 0 || n.x > canvas.width) n.baseVx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.baseVy *= -1;
      }

      // Color: grey (200,200,200) → site accent gold #F4BB30 (244,187,48)
      const r = Math.floor(200 + (244 - 200) * sp);
      const g = Math.floor(200 + (187 - 200) * sp);
      const b = Math.floor(200 + (48 - 200) * sp);

      // Draw edges
      if (sp > 0.1) {
        for (let i = 0; i < nodes.length; i++) {
          let conn = 0;
          for (let j = i + 1; j < nodes.length; j++) {
            if (conn >= 4) break;
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
              conn++;
              const dOp = 1 - dist / 160;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(${r},${g},${b},${dOp * sp})`;
              ctx.lineWidth = 0.5 + sp * 1.5;
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + sp, 0, Math.PI * 2);

        if (sp < 0.5) {
          ctx.shadowBlur = 10 * (1 - sp * 2);
          ctx.shadowColor = `rgb(${r},${g},${b})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fill();
          ctx.fillStyle = BG;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="aitoia-timeline" id="aitoia" ref={timelineRef}>
      <div className="aitoia-viewer" ref={viewerRef}>
        <canvas ref={canvasRef} className="aitoia-canvas" />

        <div className="aitoia-glass">
          {/* Section header — always visible at top */}
          <div className="aitoia-header">
            <span className="aitoia-tag">{t('aitoia.tag')}</span>
            <h2>{t('aitoia.title')}</h2>
            <p className="subtitle" style={{ maxWidth: '560px' }}>{t('aitoia.subtitle')}</p>
          </div>

          {/* Blocks overlay each other below the header */}
          <div className="aitoia-blocks">
            <div className="aitoia-block aitoia-ai" ref={aiRef}>
              <h3>{t('aitoia.aiTitle')} {t('aitoia.aiSubtitle')}</h3>
              <ul>
                {(t('aitoia.aiItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>).map((item, i) => (
                  <li key={i}>
                    <span className="aitoia-icon">{item.icon}</span>
                    <strong>{item.strong}</strong>
                    {item.desc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="aitoia-block aitoia-ia" ref={iaRef}>
              <h3>{t('aitoia.iaTitle')} {t('aitoia.iaSubtitle')}</h3>
              <ul>
                {(t('aitoia.iaItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>).map((item, i) => (
                  <li key={i}>
                    <span className="aitoia-icon">{item.icon}</span>
                    <strong>{item.strong}</strong>
                    {item.desc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
