import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PlatformContent } from './types';
import ConcaveCarousel from './ConcaveCarousel';
import '../../styles/landing.css';

interface PlatformProps {
  content: PlatformContent;
}

const MODE_SCREENSHOTS: string[][] = [
  ['/att/landing-screenshots/watch-1.png', '/att/landing-screenshots/watch-2.png', '/att/landing-screenshots/watch-3.png'],
  ['/att/landing-screenshots/decide-1.png', '/att/landing-screenshots/decide-2.png', '/att/landing-screenshots/decide-3.png'],
  ['/att/landing-screenshots/deliver-1.png', '/att/landing-screenshots/deliver-2.png', '/att/landing-screenshots/deliver-3.png'],
];

function ScreenshotCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [images.length]);

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

export default function Platform({ content }: PlatformProps) {
  return (
    <section className="content-centered" id="platform">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '560px' }}>{content.subtitle}</p>
        </div>

        {/* Twin Engines strip */}
        {content.engines?.length > 0 && (
          <div className="twin-engines-strip">
            <span className="te-label te-build">{content.engines[0]?.title}</span>
            <span className="te-center">{content.twinEnginesLabel}</span>
            <span className="te-label te-operate">{content.engines[1]?.title}</span>
          </div>
        )}

        <ConcaveCarousel autoRotateInterval={6000} height="460px">
          {content.modes.map((mode, i) => (
            <div key={i} className="cc-card" style={{ maxWidth: '90vw' }}>
              <div className="mc-inner">
                <div className="mc-text">
                  <h3>{mode.title}</h3>
                  <p>{mode.desc}</p>
                </div>
                <div className="mc-mock">
                  <ScreenshotCarousel images={MODE_SCREENSHOTS[i]} />
                </div>
              </div>
            </div>
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
