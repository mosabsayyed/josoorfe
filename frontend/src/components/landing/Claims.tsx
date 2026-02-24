import React from 'react';
import { ClaimsContent } from './types';
import '../../styles/landing.css';

interface ClaimsProps {
  content: ClaimsContent;
}

// Images ordered 1→5 (top to bottom)
const IMAGE_FILES = [
  '/att/icons/1_strategy_alignment.png',
  '/att/icons/2_agent_orchestration.png',
  '/att/icons/3_cognitive_reasoning.png',
  '/att/icons/4_knowledge_graph.png',
  '/att/icons/5_sovereign_infra.png',
];

export default function Claims({ content }: ClaimsProps) {
  const labels = content.imageLabels || [];

  return (
    <section className="content-centered" id="claims">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '560px', margin: '0 auto' }}>{content.subtitle}</p>
        </div>

        {/* Two-box layout: images + empty mirror */}
        <div className="claims-row">
          <div className="claims-stack">
            <div className="claims-stack-label">{content.canvasLabel2}</div>
            {IMAGE_FILES.map((src, i) => (
              <div key={i} className="claims-bar">
                <img src={src} alt={labels[i] || ''} className="claims-bar-img" />
                <span className={`claims-bar-label${i === 3 ? ' claims-bar-label-dark' : ''}`}>{labels[i] || ''}</span>
              </div>
            ))}
            <div className="claims-stack-desc">{content.canvasDesc}</div>
          </div>
          <div className="claims-stack claims-stack-empty">
            <div className="claims-stack-label">{content.canvasLabel}</div>
          </div>
        </div>

        {/* Text claims below */}
        <div className="claims-items">
          {content.items.map((item, i) => (
            <div key={i} className="claims-item">
              <strong>{item.punchline}</strong>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .claims-row {
          display: flex;
          gap: 20px;
          margin-top: 1.75rem;
          margin-bottom: 1rem;
          width: 100%;
        }

        .claims-stack {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 1.75rem 1.4rem;
          border: 2px dashed rgba(244, 187, 48, 0.2);
          border-radius: 16px;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(10px);
        }

        .claims-stack-empty {
          padding: 1.75rem 1.4rem;
        }

        .claims-stack-label {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--component-bg-primary);
          padding: 0 20px;
          font-size: 15px;
          font-weight: 700;
          color: var(--component-text-accent);
          letter-spacing: 0.8px;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .claims-bar {
          position: relative;
          display: flex;
          align-items: center;
        }

        .claims-bar-img {
          width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
        }

        .claims-bar-label {
          position: absolute;
          left: 0;
          width: 85%;
          text-align: center;
          color: #fff;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        [dir="rtl"] .claims-bar-label {
          left: auto;
          right: 15%;
          width: 85%;
        }

        .claims-bar-label-dark {
          color: #5c3a1e;
          text-shadow: none;
        }

        .claims-stack-desc {
          text-align: center;
          color: var(--component-text-muted);
          font-size: 14px;
          margin-top: 4px;
          font-style: italic;
          opacity: 0.85;
        }

        .claims-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 700px;
          margin: 0 auto;
        }

        .claims-item {
          padding: 14px 16px;
          border: 1px solid rgba(244, 187, 48, 0.15);
          border-radius: 10px;
          background: rgba(31, 41, 55, 0.4);
        }

        .claims-item strong {
          color: var(--component-text-accent);
          font-size: 14px;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }

        .claims-item p {
          color: var(--component-text-secondary);
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .claims-items {
            grid-template-columns: 1fr;
          }
          .claims-bar-label {
            font-size: 12px;
            left: 12px;
          }
          [dir="rtl"] .claims-bar-label {
            left: auto;
            right: 12px;
          }
        }
      `}</style>
    </section>
  );
}
