import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClaimsContent } from './types';
import '../../styles/landing.css';

interface ClaimsProps {
  content: ClaimsContent;
}

// Images ordered 1→5 (top to bottom)
const IMAGE_FILES = [
  '/att/icons/1_strategy_alignment.png',
  '/att/icons/4_knowledge_graph.png',
  '/att/icons/2_agent_orchestration.png',
  '/att/icons/3_cognitive_reasoning.png',
  '/att/icons/5_sovereign_infra.png',
];

export default function Claims({ content }: ClaimsProps) {
  const { t } = useTranslation();
  const labels = content.imageLabels || [];
  const descs = (t('claims.imageDescs', { returnObjects: true }) as string[]) || [];
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <section className="content-centered" id="claims">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '560px', margin: '0 auto' }}>{content.subtitle}</p>
        </div>

        {/* Two-box layout: images + hover detail */}
        <div className="claims-row">
          <div className="claims-stack">
            <div className="claims-stack-label">{content.canvasLabel2}</div>
            {IMAGE_FILES.map((src, i) => (
              <div
                key={i}
                className={`claims-bar ${activeIndex === i ? 'claims-bar-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <img src={src} alt={labels[i] || ''} className="claims-bar-img" />
                <span className={`claims-bar-label${i === 1 ? ' claims-bar-label-dark' : ''}`}>{labels[i] || ''}</span>
              </div>
            ))}
            <div className="claims-stack-desc">{content.canvasDesc}</div>
          </div>
          <div className="claims-stack claims-stack-detail">
            <div className="claims-stack-label">{content.canvasLabel}</div>
            <div className="claims-detail-content">
              <div className="claims-layer-number">0{activeIndex + 1}</div>
              <h3 className="claims-detail-title">{labels[activeIndex]}</h3>
              <div className="claims-detail-desc">
                {(descs[activeIndex] || '').split('|').map((part: string, pi: number) => {
                  const colonIdx = part.indexOf(':');
                  if (pi > 0 && colonIdx > 0 && colonIdx < 20) {
                    const label = part.substring(0, colonIdx);
                    const rest = part.substring(colonIdx + 1);
                    return (
                      <p key={pi} style={{ marginTop: pi === 1 ? '14px' : '10px' }}>
                        <span className="claims-stage-label">{label}:</span>{rest}
                      </p>
                    );
                  }
                  return <p key={pi}>{part}</p>;
                })}
              </div>
              <div className="claims-layer-dots">
                {labels.map((_: string, i: number) => (
                  <span key={i} className={`claims-layer-dot ${activeIndex === i ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
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

        .claims-stack-detail {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 420px;
        }

        .claims-detail-content {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          flex: 1;
          padding: 2.5rem 3rem;
          text-align: left;
          transition: opacity 0.3s ease;
          border-left: 3px solid rgba(244, 187, 48, 0.4);
          margin: 1rem 0;
        }

        [dir="rtl"] .claims-detail-content {
          text-align: right;
          align-items: flex-start;
          border-left: none;
          border-right: 3px solid rgba(244, 187, 48, 0.4);
        }

        .claims-detail-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--component-text-accent);
          margin-bottom: 20px;
          letter-spacing: -0.3px;
        }

        .claims-detail-desc {
          font-size: 19px;
          line-height: 2;
          color: var(--component-text-secondary);
          max-width: 100%;
          margin: 0;
        }

        [dir="rtl"] .claims-detail-desc {
          font-size: 21px;
          line-height: 2.2;
        }

        .claims-detail-desc p {
          margin-bottom: 10px;
        }

        .claims-layer-number {
          font-size: 64px;
          font-weight: 900;
          color: rgba(244, 187, 48, 0.12);
          line-height: 1;
          margin-bottom: -8px;
          letter-spacing: -2px;
        }

        .claims-stage-label {
          color: var(--component-text-accent);
          font-weight: 700;
        }

        .claims-layer-dots {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 24px;
        }

        .claims-layer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(244, 187, 48, 0.2);
          transition: all 0.3s ease;
        }

        .claims-layer-dot.active {
          background: rgba(244, 187, 48, 0.8);
          width: 24px;
          border-radius: 4px;
        }

        .claims-bar {
          position: relative;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-radius: 8px;
        }

        .claims-bar:hover,
        .claims-bar-active {
          transform: scale(1.02);
          box-shadow: 0 0 16px rgba(244, 187, 48, 0.25);
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

        @media (max-width: 768px) {
          .claims-row {
            flex-direction: column;
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
