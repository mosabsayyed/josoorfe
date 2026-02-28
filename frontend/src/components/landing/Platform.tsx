import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PlatformContent } from './types';
import ConcaveCarousel from './ConcaveCarousel';
import '../../styles/landing.css';

interface PlatformProps {
  content: PlatformContent;
}

function ModeTitle({ title }: { title: string }) {
  const parts = title.split('—');
  if (parts.length > 1) {
    return (
      <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', textAlign: 'center' }}>
        <span style={{ color: '#F4BB30' }}>{parts[0].trim()}</span>
        <span style={{ color: '#fff', fontWeight: '400', fontSize: '0.85em' }}>— {parts[1].trim()}</span>
      </h3>
    );
  }
  return <h3 style={{ textAlign: 'center' }}>{title}</h3>;
}

const MODE_SCREENSHOTS: string[][] = [
  ['/att/landing-screenshots/watch-1.png', '/att/landing-screenshots/watch-2.png', '/att/landing-screenshots/watch-3.png'],
  ['/att/landing-screenshots/decide-1.png', '/att/landing-screenshots/decide-2.png', '/att/landing-screenshots/decide-3.png'],
  ['/att/landing-screenshots/deliver-1.png', '/att/landing-screenshots/deliver-2.png', '/att/landing-screenshots/deliver-3.png'],
];

function ScreenshotCarousel({ images, activePos }: { images: string[], activePos?: number | string | undefined }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Only auto-rotate if this card is in the front (data-pos === 0)
    // If activePos is not provided, fallback to true for backward compatibility
    if (activePos === 0 || activePos === undefined || activePos === "0") {
      timerRef.current = setInterval(() => {
        setCurrent(prev => (prev + 1) % images.length);
      }, 3000);
    }
    return () => clearInterval(timerRef.current);
  }, [images.length, activePos]);

  return (
    <div className="sc-wrap">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`sc-img ${i === current ? 'sc-active' : ''}`}
        />
      ))}
      <div className="sc-dots">
        {images.map((_, i) => (
          <div
            key={i}
            className={`sc-dot ${i === current ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
          />
        ))}
      </div>
    </div>
  );
}

// Define a wrapper component so 'data-pos' gets correctly extracted and passed to ScreenshotCarousel
function ModeCard({ mode, i, 'data-pos': dataPos, ...props }: any) {
  return (
    <div className="cc-card" style={{ maxWidth: '90vw' }} data-pos={dataPos} {...props}>
      <div className="mc-inner">
        <div className="mc-text">
          <ModeTitle title={mode.title} />
          {mode.desc && <p>{mode.desc}</p>}
        </div>
        <div className="mc-mock">
          <ScreenshotCarousel images={MODE_SCREENSHOTS[i]} activePos={dataPos} />
        </div>
      </div>
    </div>
  );
}

export default function Platform({ content }: PlatformProps) {
  return (
    <section className="content-centered" id="platform">
      <div className="section-content-box" style={{ paddingBottom: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '0px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '640px', marginBottom: '8px' }}>{content.subtitle}</p>
        </div>

        <ConcaveCarousel autoRotateInterval={6000} height="460px">
          {content.modes.map((mode, i) => (
            <ModeCard key={i} mode={mode} i={i} />
          ))}
        </ConcaveCarousel>
      </div>

      <style>{`
        .twin-engines-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 12px;
        }
        .te-label {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }
        .te-build { color: #5B9BD5; }
        .te-operate { color: #1A7AA8; }
        .te-center {
          font-size: 11px;
          font-weight: 700;
          color: var(--component-text-muted);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 0 16px;
          opacity: 0.6;
        }
      `}</style>
    </section>
  );
}
