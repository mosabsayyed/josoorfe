import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StrategyHouseContent } from './types';

interface StrategyHouseProps {
  content: StrategyHouseContent;
}

// Element indices updated to match onscreen reading order (01 to 08)
const PEDIMENT_INDICES = [0, 1, 2]; // top to bottom slices of the triangle
const PILLAR_INDICES = [3, 4, 5, 6];
const FOUNDATION_INDEX = 7;

export default function StrategyHouse({ content }: StrategyHouseProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number>(PEDIMENT_INDICES[0]);

  const elements = content.elements || [];
  const descs = (t('strategyHouse.elementDescs', { returnObjects: true }) as string[]) || [];
  const pyramidLabels = (t('strategyHouse.pyramidLabels', { returnObjects: true }) as string[]) || [];

  return (
    <section className="content-centered" id="strategy-house">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '560px', margin: '0 auto' }}>{content.subtitle}</p>
        </div>

        <div className="sh-row">
          {/* LEFT: Temple visual */}
          <div className="sh-temple">
            <div className="sh-temple-title">{t('strategyHouse.pedimentSuffix')}</div>
            {/* Pediment (triangle split into 3 horizontal slices) */}
            <div className="sh-pediment-wrap">
              <div className="sh-pediment">
                {PEDIMENT_INDICES.map((idx, sliceIdx) => (
                  <div
                    key={idx}
                    className={`sh-ped-slice sh-ped-${sliceIdx} ${activeIndex === idx ? 'sh-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <span className="sh-ped-slice-label">{pyramidLabels[sliceIdx] || elements[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entablature (horizontal beam) */}
            <div className="sh-entablature">
              <div className="sh-entablature-top" />
              <div className="sh-entablature-bottom" />
            </div>

            {/* 4 Pillars */}
            <div className="sh-pillars">
              {PILLAR_INDICES.map((idx) => (
                <div
                  key={idx}
                  className={`sh-pillar ${activeIndex === idx ? 'sh-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                >
                  <div className="sh-capital" />
                  <div className="sh-pillar-shaft">
                    <div className="sh-flute" />
                    <div className="sh-flute" />
                    <div className="sh-flute" />
                  </div>
                  <div className="sh-pillar-base" />
                  <div className="sh-pillar-label">{elements[idx]}</div>
                </div>
              ))}
            </div>

            {/* Stylobate / Foundation */}
            <div
              className={`sh-foundation ${activeIndex === FOUNDATION_INDEX ? 'sh-active' : ''}`}
              onMouseEnter={() => setActiveIndex(FOUNDATION_INDEX)}
              onClick={() => setActiveIndex(FOUNDATION_INDEX)}
            >
              <div className="sh-step sh-step-1" />
              <div className="sh-step sh-step-2">
                <span className="sh-foundation-label">{elements[FOUNDATION_INDEX]}</span>
              </div>
              <div className="sh-step sh-step-3" />
            </div>
          </div>

          {/* RIGHT: Description panel */}
          <div className="sh-detail">
            <div className="sh-detail-content">
              <div className="sh-layer-number">0{activeIndex + 1}</div>
              <h3 className="sh-detail-title">{elements[activeIndex]}</h3>
              <div className="sh-detail-desc">
                {(descs[activeIndex] || '').split('|').map((part: string, pi: number) => {
                  const colonIdx = part.indexOf(':');
                  if (pi > 0 && colonIdx > 0 && colonIdx < 20) {
                    const label = part.substring(0, colonIdx);
                    const rest = part.substring(colonIdx + 1);
                    return (
                      <p key={pi} style={{ marginTop: pi === 1 ? '14px' : '10px' }}>
                        <span className="sh-stage-label">{label}:</span>{rest}
                      </p>
                    );
                  }
                  return <p key={pi}>{part}</p>;
                })}
              </div>
              <div className="sh-dots">
                {elements.map((_: string, i: number) => (
                  <span
                    key={i}
                    className={`sh-dot ${activeIndex === i ? 'active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => setActiveIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility strip */}
        <div className="sh-compat">
          <span className="sh-compat-label">{t('strategyHouse.alignedNationalStandards')}</span>
          <div className="sh-compat-logos">
            <img src="/att/logos/adaa.png" alt="Adaa" />
            <img src="/att/logos/expro.svg" alt="EXPRO" />
            <img src="/att/logos/dga.svg" alt="DGA" />
          </div>
        </div>
      </div>

      <style>{`
        .sh-row {
          display: flex;
          gap: 20px;
          margin-top: 0.75rem;
          margin-bottom: 1rem;
          width: 100%;
          align-items: stretch;
          height: 480px;
        }

        /* ── Temple container ── */
        .sh-temple {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1.5rem 1rem;
          border: 2px dashed rgba(244, 187, 48, 0.15);
          border-radius: 16px;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(10px);
          gap: 0;
          justify-content: center;
          position: relative;
        }

        /* ── Pediment (triangle with 3 horizontal slices) ── */
        .sh-pediment-wrap {
          width: 80%;
          position: relative;
        }

        .sh-pediment {
          width: 100%;
          aspect-ratio: 2.8 / 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          background: linear-gradient(180deg, rgba(244, 187, 48, 0.04) 0%, rgba(244, 187, 48, 0.12) 100%);
        }

        .sh-temple-title {
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

        .sh-ped-slice {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s ease;
          border-bottom: 1px solid rgba(244, 187, 48, 0.08);
        }

        .sh-ped-slice:last-child {
          border-bottom: none;
        }

        /* Top slice — Sector (largest) */
        .sh-ped-0 {
          height: 46%;
          padding-top: 8px;
        }

        /* Middle slice — Enterprise */
        .sh-ped-1 {
          height: 30%;
        }

        /* Bottom slice — Portfolios */
        .sh-ped-2 {
          height: 24%;
        }

        .sh-ped-slice.sh-active {
          background: rgba(244, 187, 48, 0.18);
        }

        .sh-ped-slice-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.5px;
          white-space: nowrap;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .sh-ped-slice.sh-active .sh-ped-slice-label {
          color: rgba(255, 255, 255, 1);
        }

        /* ── Entablature (beam between pediment and pillars) ── */
        .sh-entablature {
          width: 84%;
          display: flex;
          flex-direction: column;
        }

        .sh-entablature-top {
          height: 6px;
          background: linear-gradient(90deg, rgba(244, 187, 48, 0.05), rgba(244, 187, 48, 0.2), rgba(244, 187, 48, 0.05));
          border-radius: 0;
        }

        .sh-entablature-bottom {
          height: 3px;
          background: rgba(244, 187, 48, 0.08);
          margin-top: 2px;
        }

        /* ── Pillars ── */
        .sh-pillars {
          display: flex;
          gap: 16px;
          width: 80%;
          justify-content: center;
          padding: 0 8px;
        }

        .sh-pillar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: filter 0.3s ease;
        }

        /* Capital (top of column) */
        .sh-capital {
          width: 90%;
          height: 10px;
          background: linear-gradient(180deg, rgba(244, 187, 48, 0.2) 0%, rgba(244, 187, 48, 0.08) 100%);
          border-radius: 2px 2px 0 0;
          border: 1px solid rgba(244, 187, 48, 0.12);
          border-bottom: none;
          transition: all 0.3s ease;
        }

        .sh-pillar.sh-active .sh-capital {
          background: linear-gradient(180deg, rgba(244, 187, 48, 0.4) 0%, rgba(244, 187, 48, 0.15) 100%);
          border-color: rgba(244, 187, 48, 0.35);
        }

        /* Shaft with fluting */
        .sh-pillar-shaft {
          width: 70%;
          height: 160px;
          background: linear-gradient(180deg, rgba(244, 187, 48, 0.1) 0%, rgba(244, 187, 48, 0.04) 100%);
          border-left: 1px solid rgba(244, 187, 48, 0.1);
          border-right: 1px solid rgba(244, 187, 48, 0.1);
          display: flex;
          justify-content: space-evenly;
          align-items: stretch;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .sh-pillar.sh-active .sh-pillar-shaft {
          background: linear-gradient(180deg, rgba(244, 187, 48, 0.22) 0%, rgba(244, 187, 48, 0.08) 100%);
          border-color: rgba(244, 187, 48, 0.3);
          box-shadow: 0 0 16px rgba(244, 187, 48, 0.15);
        }

        .sh-flute {
          width: 1px;
          height: 100%;
          background: rgba(244, 187, 48, 0.06);
          transition: background 0.3s ease;
        }

        .sh-pillar.sh-active .sh-flute {
          background: rgba(244, 187, 48, 0.15);
        }

        /* Base of column */
        .sh-pillar-base {
          width: 85%;
          height: 8px;
          background: rgba(244, 187, 48, 0.1);
          border-radius: 0 0 2px 2px;
          border: 1px solid rgba(244, 187, 48, 0.1);
          border-top: none;
          transition: all 0.3s ease;
        }

        .sh-pillar.sh-active .sh-pillar-base {
          background: rgba(244, 187, 48, 0.2);
          border-color: rgba(244, 187, 48, 0.3);
        }

        .sh-pillar-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          padding: 10px 2px 0;
          line-height: 1.3;
          transition: color 0.3s ease;
          max-width: 100%;
        }

        .sh-pillar.sh-active .sh-pillar-label {
          color: rgba(255, 255, 255, 1);
        }

        /* ── Foundation (stepped base) ── */
        .sh-foundation {
          width: 92%;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          margin-top: 4px;
          transition: filter 0.3s ease;
        }

        .sh-step {
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .sh-step-1 {
          width: 90%;
          height: 6px;
          background: rgba(244, 187, 48, 0.08);
          border: 1px solid rgba(244, 187, 48, 0.08);
          border-bottom: none;
        }

        .sh-step-2 {
          width: 96%;
          padding: 10px 0;
          background: rgba(244, 187, 48, 0.06);
          border: 1px solid rgba(244, 187, 48, 0.1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sh-step-3 {
          width: 100%;
          height: 8px;
          background: rgba(244, 187, 48, 0.04);
          border: 1px solid rgba(244, 187, 48, 0.06);
          border-top: none;
          border-radius: 0 0 4px 4px;
        }

        .sh-foundation.sh-active .sh-step-1 {
          background: rgba(244, 187, 48, 0.18);
          border-color: rgba(244, 187, 48, 0.3);
        }

        .sh-foundation.sh-active .sh-step-2 {
          background: rgba(244, 187, 48, 0.14);
          border-color: rgba(244, 187, 48, 0.35);
          box-shadow: 0 0 20px rgba(244, 187, 48, 0.15);
        }

        .sh-foundation.sh-active .sh-step-3 {
          background: rgba(244, 187, 48, 0.1);
          border-color: rgba(244, 187, 48, 0.25);
        }

        .sh-foundation-label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          transition: color 0.3s ease;
        }

        .sh-foundation.sh-active .sh-foundation-label {
          color: rgba(255, 255, 255, 1);
        }

        /* ── Detail panel (right side) ── */
        .sh-detail {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 1.25rem 1.4rem;
          border: 2px dashed rgba(244, 187, 48, 0.15);
          border-radius: 16px;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(10px);
        }

        .sh-detail-content {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          padding: 1.5rem 2rem;
          text-align: left;
          transition: opacity 0.3s ease;
          border-left: 3px solid rgba(244, 187, 48, 0.4);
          overflow-y: auto;
        }

        [dir="rtl"] .sh-detail-content {
          text-align: right;
          border-left: none;
          border-right: 3px solid rgba(244, 187, 48, 0.4);
        }

        .sh-layer-number {
          font-size: 48px;
          font-weight: 900;
          color: rgba(244, 187, 48, 0.12);
          line-height: 1;
          margin-bottom: -4px;
          letter-spacing: -2px;
        }

        .sh-detail-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--component-text-accent);
          margin-bottom: 12px;
          letter-spacing: -0.3px;
        }

        .sh-detail-desc {
          font-size: 16px;
          line-height: 1.7;
          color: var(--component-text-secondary);
          max-width: 100%;
          margin: 0;
        }

        [dir="rtl"] .sh-detail-desc {
          font-size: 18px;
          line-height: 1.9;
        }

        .sh-detail-desc p {
          margin-bottom: 10px;
        }

        .sh-stage-label {
          color: var(--component-text-accent);
          font-weight: 700;
        }

        .sh-dots {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 24px;
        }

        .sh-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(244, 187, 48, 0.2);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .sh-dot.active {
          background: rgba(244, 187, 48, 0.8);
          width: 24px;
          border-radius: 4px;
        }

        /* ── Compatibility strip ── */
        .sh-compat {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 10px 20px;
          margin-top: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
        }

        .sh-compat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--component-text-muted);
          white-space: nowrap;
        }

        .sh-compat-logos {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(245, 245, 248, 0.95);
          padding: 8px 20px;
          border-radius: 8px;
        }

        .sh-compat-logos img {
          height: 26px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }

        .sh-compat-logos img:hover {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .sh-row {
            flex-direction: column;
            height: auto;
            gap: 10px;
          }

          .sh-temple {
            flex: none;
            min-height: auto;
            padding: 1rem 0.75rem 0.5rem;
          }

          .sh-pediment-wrap {
            width: 90%;
          }

          .sh-entablature {
            width: 92%;
          }

          .sh-pillars {
            width: 90%;
            gap: 6px;
          }

          .sh-pillar-shaft {
            height: 50px;
          }

          .sh-pillar-label {
            font-size: 10px;
            padding: 4px 2px 0;
          }

          .sh-detail {
            flex: none;
            padding: 0.5rem;
            max-height: 240px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .sh-detail-content {
            padding: 0.5rem 0.6rem;
            border-left-width: 2px;
          }

          [dir="rtl"] .sh-detail-content {
            border-right-width: 2px;
          }

          .sh-layer-number {
            font-size: 24px;
            margin-bottom: -2px;
          }

          .sh-detail-title {
            font-size: 14px;
            margin-bottom: 4px;
          }

          .sh-detail-desc {
            font-size: 12px;
            line-height: 1.45;
          }

          .sh-detail-desc p {
            margin-bottom: 4px;
          }

          .sh-dots {
            padding-top: 8px;
            gap: 6px;
          }

          .sh-dot {
            width: 6px;
            height: 6px;
          }

          .sh-dot.active {
            width: 18px;
          }

          .sh-compat {
            flex-direction: column;
            gap: 6px;
            padding: 8px 10px;
            margin-top: 6px;
          }

          .sh-compat-label {
            font-size: 11px;
          }

          .sh-compat-logos {
            gap: 10px;
            padding: 4px 10px;
          }

          .sh-compat-logos img {
            height: 18px;
          }
        }
      `}</style>
    </section>
  );
}
