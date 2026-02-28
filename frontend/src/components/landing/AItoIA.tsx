import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BetaForm from './BetaForm';

const AI_ICONS = [
  '/att/icons/icon-inputs-not-ready.png',
  '/att/icons/icon-probabilistic-models.png',
  '/att/icons/icon-reckless-velocity.png',
];
const IA_ICONS = [
  '/att/icons/icon-inputs-ready.png',
  '/att/icons/icon-ai-in-loop.png',
  '/att/icons/icon-accelerated-certainty.png',
];

interface Node {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  radius: number;
}

const NUM_NODES_DESKTOP = 140;
const NUM_NODES_MOBILE = 60; // Reduced for mobile performance
const BG = '#111827';

export default function AItoIA({ betaContent, language, footerRights }: { betaContent: any; language: string; footerRights: string }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const challengeRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const innovationRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const scrollRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isMobileRef = useRef(false);

  useEffect(() => {
    // Detect mobile viewport
    isMobileRef.current = window.innerWidth <= 768;
    const canvas = canvasRef.current;
    const timeline = timelineRef.current;
    const viewer = viewerRef.current;
    const challengeEl = challengeRef.current;
    const innovationEl = innovationRef.current;
    const formEl = formRef.current;
    if (!canvas || !timeline || !viewer || !challengeEl || !innovationEl || !formEl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particle nodes (fewer on mobile for performance)
    const nodeCount = isMobileRef.current ? NUM_NODES_MOBILE : NUM_NODES_DESKTOP;
    const velocityMultiplier = isMobileRef.current ? 3 : 5; // Slower on mobile
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseVx: (Math.random() - 0.5) * velocityMultiplier,
        baseVy: (Math.random() - 0.5) * velocityMultiplier,
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

      // Crossfade entire content blocks — overlap so both are partially visible mid-scroll
      // We have 3 phases now: 0-0.33 challenge, 0.33-0.66 innovation, 0.66-1.0 form
      // Phase 1 (Challenge)
      const challengeOpacity = sp <= 0.22 ? 1 : sp >= 0.32 ? 0 : 1 - (sp - 0.22) * 10;
      // Phase 2 (Innovation)
      const innovationOpacity = sp <= 0.22 ? 0 : sp >= 0.66 ? 0 : sp >= 0.32 && sp <= 0.56 ? 1 : sp < 0.32 ? (sp - 0.22) * 10 : 1 - (sp - 0.56) * 10;
      // Phase 3 (Form + Footer)
      const formOpacity = sp <= 0.56 ? 0 : sp >= 0.66 ? 1 : (sp - 0.56) * 10;

      challengeEl.style.opacity = String(challengeOpacity);
      innovationEl.style.opacity = String(innovationOpacity);
      formEl.style.opacity = String(formOpacity);
      
      challengeEl.style.pointerEvents = challengeOpacity > 0.5 ? 'auto' : 'none';
      innovationEl.style.pointerEvents = innovationOpacity > 0.5 ? 'auto' : 'none';
      formEl.style.pointerEvents = formOpacity > 0.5 ? 'auto' : 'none';

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

      // Draw edges (simpler on mobile for performance)
      const maxConnections = isMobileRef.current ? 3 : 4;
      const connectionDistance = isMobileRef.current ? 120 : 160;

      if (sp > 0.1) {
        for (let i = 0; i < nodes.length; i++) {
          let conn = 0;
          for (let j = i + 1; j < nodes.length; j++) {
            if (conn >= maxConnections) break;
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
              conn++;
              const dOp = 1 - dist / connectionDistance;
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

  const aiItems = t('aitoia.aiItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>;
  const iaItems = t('aitoia.iaItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>;

  // Helper to highlight Watch/Decide/Deliver in gold
  const highlightWorkflow = (text: string) => {
    const words = ['Watch', 'Decide', 'Deliver', 'تراقبها', 'تقرّرها', 'تنفّذها'];
    let result = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'g');
      result = result.replace(regex, `<span style="color: #F4BB30; font-weight: 600;">$1</span>`);
    });
    return result;
  };

  return (
    <div className="aitoia-timeline" id="aitoia" ref={timelineRef}>
      <div className="aitoia-viewer" ref={viewerRef}>
        <canvas ref={canvasRef} className="aitoia-canvas" />

        <div className="aitoia-glass">
          {/* Overlapping content blocks that crossfade */}
          <div style={{ display: 'grid', width: '100%', overflow: 'hidden' }}>
            {/* Challenge content — fades out as user scrolls */}
            <div ref={challengeRef} style={{ gridArea: '1 / 1', width: '100%' }}>
              <div className="aitoia-header">
                <span className="aitoia-tag">{t('aitoia.tag')}</span>
                <h2>{t('aitoia.title')}</h2>
                <p className="subtitle" style={{ maxWidth: '90vw' }}>{t('aitoia.challengeSubtitle')}</p>
              </div>
              <div className="challenge-columns">
                {aiItems.map((item, i) => (
                  <div key={i} className="challenge-col">
                    <img src={AI_ICONS[i]} alt={item.strong} width={64} height={64} style={{ marginBottom: '12px' }} />
                    <h3>{item.strong}</h3>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 3: Form + Footer */}
            <div ref={formRef} style={{ gridArea: '1 / 1', opacity: 0, width: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <BetaForm content={betaContent} language={language} />
              </div>
              <footer style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '14px', marginTop: 'auto' }}>
                <p style={{ margin: 0 }}>{footerRights}</p>
              </footer>
            </div>

            {/* Innovation content — fades in as user scrolls */}
            <div ref={innovationRef} style={{ gridArea: '1 / 1', opacity: 0, width: '100%' }}>
              <div className="aitoia-header">
                <span className="aitoia-tag">{t('aitoia.innovationTag')}</span>
                <h2>{t('aitoia.innovationTitle')}</h2>
                <p className="subtitle" style={{ maxWidth: '90vw' }}>{t('aitoia.innovationSubtitle')}</p>
              </div>
              <div className="aitoia-block aitoia-ia" style={{ opacity: 1, pointerEvents: 'auto' }}>
                <ul>
                  {iaItems.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={IA_ICONS[i]} alt={item.strong} width={96} height={96} style={{ flexShrink: 0 }} className="aitoia-bullet-icon" />
                      <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
                        <strong>{item.strong}</strong>
                        <span dangerouslySetInnerHTML={{ __html: highlightWorkflow(item.desc) }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
