import React, { useState } from 'react';
import { ClaimsContent } from './types';
import '../../styles/landing.css';

interface ClaimsProps {
  content: ClaimsContent;
}

export default function Claims({ content }: ClaimsProps) {
  const [hoveredThread, setHoveredThread] = useState<number | null>(null);
  // items[0..2] = horizontal threads, items[3..5] = vertical threads
  const horizontal = content.items.slice(0, 3);
  const vertical = content.items.slice(3, 6);

  // Thread coordinates — compact matrix with clear label space
  const horizontalY = [140, 220, 300]; // y positions for 3 horizontal threads
  const verticalX = [130, 275, 420];   // x positions for 3 vertical threads (wider spread for labels)
  const threadWidth = 14;
  const threadWidthHover = 16;
  const gapSize = 18;

  // Render thread segments with gaps for weave pattern
  const renderThreadSegments = (
    isVertical: boolean,
    index: number,
    isHovered: boolean,
    goesOver: (intersectionIndex: number) => boolean
  ): JSX.Element[] => {
    const width = isHovered ? threadWidthHover : threadWidth;
    const gradientId = isVertical
      ? (isHovered ? 'verticalThreadHover' : 'verticalThread')
      : (isHovered ? 'horizontalThreadHover' : 'horizontalThread');
    const segments: JSX.Element[] = [];

    if (isVertical) {
      const x = verticalX[index];
      let prevY = 40;

      horizontalY.forEach((y, hi) => {
        const over = goesOver(hi);
        if (over) {
          // This thread goes OVER at this intersection — continuous segment with shadow
          segments.push(
            <rect
              key={`v-over-${index}-${hi}`}
              x={x - width / 2}
              y={prevY}
              width={width}
              height={y + gapSize - prevY}
              rx={3}
              fill={`url(#${gradientId})`}
              filter="url(#threadShadow)"
              style={{ transition: 'all 0.3s ease' }}
            />
          );
          prevY = y + gapSize;
        } else {
          // This thread goes UNDER at this intersection — gap in segment
          segments.push(
            <rect
              key={`v-under-${index}-${hi}`}
              x={x - width / 2}
              y={prevY}
              width={width}
              height={y - gapSize - prevY}
              rx={3}
              fill={`url(#${gradientId})`}
              style={{ transition: 'all 0.3s ease' }}
            />
          );
          prevY = y + gapSize;
        }
      });

      // Final segment to bottom
      segments.push(
        <rect
          key={`v-end-${index}`}
          x={x - width / 2}
          y={prevY}
          width={width}
          height={370 - prevY}
          rx={3}
          fill={`url(#${gradientId})`}
          style={{ transition: 'all 0.3s ease' }}
        />
      );
    } else {
      // Horizontal thread
      const y = horizontalY[index];
      let prevX = 40;

      verticalX.forEach((x, vi) => {
        const over = goesOver(vi);
        if (over) {
          // This thread goes OVER at this intersection — continuous segment with shadow
          segments.push(
            <rect
              key={`h-over-${index}-${vi}`}
              x={prevX}
              y={y - width / 2}
              width={x + gapSize - prevX}
              height={width}
              rx={3}
              fill={`url(#${gradientId})`}
              filter="url(#threadShadow)"
              style={{ transition: 'all 0.3s ease' }}
            />
          );
          prevX = x + gapSize;
        } else {
          // This thread goes UNDER at this intersection — gap in segment
          segments.push(
            <rect
              key={`h-under-${index}-${vi}`}
              x={prevX}
              y={y - width / 2}
              width={x - gapSize - prevX}
              height={width}
              rx={3}
              fill={`url(#${gradientId})`}
              style={{ transition: 'all 0.3s ease' }}
            />
          );
          prevX = x + gapSize;
        }
      });

      // Final segment to right
      segments.push(
        <rect
          key={`h-end-${index}`}
          x={prevX}
          y={y - width / 2}
          width={460 - prevX}
          height={width}
          rx={3}
          fill={`url(#${gradientId})`}
          style={{ transition: 'all 0.3s ease' }}
        />
      );
    }

    return segments;
  };

  return (
    <section className="content-centered" id="claims">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '560px', margin: '0 auto' }}>{content.subtitle}</p>
        </div>

        {/* Woven Fabric Visual */}
        <div className="weave-container">
          {/* Canvas frame label */}
          <div className="weave-frame-label">{content.canvasLabel}</div>

          <svg
            className="weave-svg"
            viewBox="0 0 700 420"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* SVG Definitions */}
            <defs>
              {/* Horizontal thread gradient (barrel shading top-to-bottom) */}
              <linearGradient id="horizontalThread" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(244, 187, 48, 0.2)" />
                <stop offset="50%" stopColor="rgba(244, 187, 48, 0.5)" />
                <stop offset="100%" stopColor="rgba(244, 187, 48, 0.2)" />
              </linearGradient>

              <linearGradient id="horizontalThreadHover" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(244, 187, 48, 0.5)" />
                <stop offset="50%" stopColor="rgba(244, 187, 48, 0.95)" />
                <stop offset="100%" stopColor="rgba(244, 187, 48, 0.5)" />
              </linearGradient>

              {/* Vertical thread gradient (barrel shading left-to-right) */}
              <linearGradient id="verticalThread" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(244, 187, 48, 0.2)" />
                <stop offset="50%" stopColor="rgba(244, 187, 48, 0.5)" />
                <stop offset="100%" stopColor="rgba(244, 187, 48, 0.2)" />
              </linearGradient>

              <linearGradient id="verticalThreadHover" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(244, 187, 48, 0.5)" />
                <stop offset="50%" stopColor="rgba(244, 187, 48, 0.95)" />
                <stop offset="100%" stopColor="rgba(244, 187, 48, 0.5)" />
              </linearGradient>

              {/* Drop shadow for threads passing over */}
              <filter id="threadShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0, 0, 0, 0.4)" />
              </filter>
            </defs>

            {/* LAYER 1: ALL THREADS (with gaps creating weave pattern) */}
            {/* Vertical threads */}
            {vertical.map((_, vi) => {
              const isHovered = hoveredThread === (vi + 3);
              const goesOver = (hi: number) => (vi + hi) % 2 === 0;
              return (
                <g key={`v-thread-${vi}`}>
                  {renderThreadSegments(true, vi, isHovered, goesOver)}
                </g>
              );
            })}

            {/* Horizontal threads */}
            {horizontal.map((_, hi) => {
              const isHovered = hoveredThread === hi;
              const goesOver = (vi: number) => (vi + hi) % 2 !== 0;
              return (
                <g key={`h-thread-${hi}`}>
                  {renderThreadSegments(false, hi, isHovered, goesOver)}
                </g>
              );
            })}

            {/* LAYER 2: INTERSECTION GLOWS */}
            {horizontalY.map((y, hi) =>
              verticalX.map((x, vi) => {
                const isRelated = hoveredThread === hi || hoveredThread === (vi + 3);
                return (
                  <circle
                    key={`glow-${hi}-${vi}`}
                    cx={x}
                    cy={y}
                    r={isRelated ? 8 : 6}
                    fill={isRelated ? 'rgba(244, 187, 48, 0.9)' : 'rgba(244, 187, 48, 0.3)'}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                );
              })
            )}

            {/* LAYER 3: LABELS */}
            {/* Horizontal thread labels (right side, clear space) */}
            {horizontal.map((item, hi) => {
              const isHovered = hoveredThread === hi;
              const y = horizontalY[hi];
              return (
                <text
                  key={`h-label-${hi}`}
                  x={480}
                  y={y + 5}
                  textAnchor="start"
                  direction="ltr"
                  fill={isHovered ? '#F4BB30' : 'var(--component-text-secondary)'}
                  fontSize="12"
                  fontWeight={isHovered ? '600' : '500'}
                  fontFamily="var(--component-font-family)"
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {item.punchline}
                </text>
              );
            })}

            {/* Vertical thread labels (top, above threads) */}
            {vertical.map((item, vi) => {
              const isHovered = hoveredThread === (vi + 3);
              const x = verticalX[vi];
              return (
                <text
                  key={`v-label-${vi}`}
                  x={x}
                  y={25}
                  textAnchor="middle"
                  direction="ltr"
                  fill={isHovered ? '#F4BB30' : 'var(--component-text-secondary)'}
                  fontSize="10"
                  fontWeight={isHovered ? '600' : '500'}
                  fontFamily="var(--component-font-family)"
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {item.punchline}
                </text>
              );
            })}

            {/* LAYER 4: INVISIBLE HOVER AREAS */}
            {/* Vertical thread hover areas */}
            {vertical.map((_, vi) => {
              const x = verticalX[vi];
              return (
                <rect
                  key={`v-hover-${vi}`}
                  x={x - 25}
                  y={40}
                  width={50}
                  height={330}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredThread(vi + 3)}
                  onMouseLeave={() => setHoveredThread(null)}
                />
              );
            })}

            {/* Horizontal thread hover areas */}
            {horizontal.map((_, hi) => {
              const y = horizontalY[hi];
              return (
                <rect
                  key={`h-hover-${hi}`}
                  x={40}
                  y={y - 20}
                  width={660}
                  height={40}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredThread(hi)}
                  onMouseLeave={() => setHoveredThread(null)}
                />
              );
            })}
          </svg>

          {/* Tooltip on hover */}
          {hoveredThread !== null && (
            <div className="weave-tooltip">
              <strong>
                {hoveredThread < 3
                  ? horizontal[hoveredThread].punchline
                  : vertical[hoveredThread - 3].punchline}
              </strong>
              <p>
                {hoveredThread < 3
                  ? horizontal[hoveredThread].desc
                  : vertical[hoveredThread - 3].desc}
              </p>
            </div>
          )}

          {/* Frame description */}
          <div className="weave-frame-desc">{content.canvasDesc}</div>
        </div>

        {/* Mobile fallback: vertical card list */}
        <div className="weave-mobile-fallback">
          <div className="weave-mobile-canvas">
            <strong>{content.canvasLabel}</strong>
            <p>{content.canvasDesc}</p>
          </div>
          {content.items.map((item, i) => (
            <div key={i} className="weave-mobile-card">
              <strong>{item.punchline}</strong>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inline CSS for weave visualization */}
      <style>{`
        .weave-container {
          position: relative;
          max-width: 800px;
          margin: 3rem auto 1rem;
          padding: 2.5rem 2rem;
          border: 2px dashed rgba(244, 187, 48, 0.2);
          border-radius: 16px;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(10px);
        }

        .weave-frame-label {
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

        .weave-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .weave-tooltip {
          position: absolute;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95));
          border: 1px solid rgba(244, 187, 48, 0.4);
          border-radius: 12px;
          padding: 16px 20px;
          max-width: 320px;
          text-align: center;
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(244, 187, 48, 0.1);
          animation: tooltipFadeIn 0.2s ease;
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .weave-tooltip strong {
          color: var(--component-text-accent);
          font-size: 15px;
          font-weight: 600;
          display: block;
          margin-bottom: 6px;
        }

        .weave-tooltip p {
          color: var(--component-text-secondary);
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .weave-frame-desc {
          text-align: center;
          color: var(--component-text-muted);
          font-size: 14px;
          margin-top: 12px;
          font-style: italic;
          opacity: 0.85;
        }

        /* Mobile fallback */
        .weave-mobile-fallback {
          display: none;
        }

        @media (max-width: 768px) {
          .weave-container {
            display: none;
          }
          .weave-mobile-fallback {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 1rem;
          }
          .weave-mobile-canvas {
            padding: 14px 16px;
            border: 2px solid var(--component-text-accent);
            border-radius: 8px;
            text-align: center;
          }
          .weave-mobile-canvas strong {
            color: var(--component-text-accent);
            font-size: 15px;
          }
          .weave-mobile-canvas p {
            color: var(--component-text-secondary);
            font-size: 13px;
            margin: 4px 0 0;
          }
          .weave-mobile-card {
            padding: 12px 16px;
            border: 1px solid rgba(244, 187, 48, 0.2);
            border-radius: 8px;
            background: rgba(31, 41, 55, 0.4);
          }
          .weave-mobile-card strong {
            color: var(--component-text-accent);
            font-size: 14px;
          }
          .weave-mobile-card p {
            color: var(--component-text-secondary);
            font-size: 13px;
            margin: 3px 0 0;
            line-height: 1.4;
          }
        }
      `}</style>
    </section>
  );
}
