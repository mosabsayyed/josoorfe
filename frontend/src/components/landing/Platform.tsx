import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ConcaveCarousel from './ConcaveCarousel';
import '../../styles/landing.css';

/* ── Screenshot assignments per wheel ── */
const WHEEL_SCREENSHOTS: string[][] = [
  /* The OS */
  [
    '/att/landing-screenshots/3_carousel/1.png',
    '/att/landing-screenshots/3_carousel/2.png',
    '/att/landing-screenshots/3_carousel/3.png',
    '/att/landing-screenshots/3_carousel/F.png',
  ],
  /* Integrated Decision Intelligence */
  [
    '/att/landing-screenshots/3_carousel/5.png',
    '/att/landing-screenshots/3_carousel/7.png',
    '/att/landing-screenshots/3_carousel/8.png',
    '/att/landing-screenshots/3_carousel/G.png',
  ],
  /* Beyond Expectations */
  [
    '/att/landing-screenshots/3_carousel/ar1.png',
    '/att/landing-screenshots/3_carousel/ar2.png',
    '/att/landing-screenshots/3_carousel/ar3.png',
    '/att/landing-screenshots/3_carousel/ar4.png',
  ],
];

/* ── Inner screenshot carousel (crossfade, auto-rotate per wheel) ── */
function ScreenshotCarousel({ images, activePos }: { images: string[]; activePos?: number | string }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Only auto-rotate the front card
    if (activePos === 0 || activePos === undefined || activePos === '0') {
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

/* ── Card wrapper for carousel ── */
function WheelCard({ wheel, i, 'data-pos': dataPos, ...props }: any) {
  return (
    <div className="cc-card" style={{ maxWidth: '90vw' }} data-pos={dataPos} {...props}>
      <div className="mc-inner">
        <div className="mc-text">
          <h3 style={{ textAlign: 'center' }}>{wheel.title}</h3>
          {wheel.subtitle && <p>{wheel.subtitle}</p>}
        </div>
        <div className="mc-mock">
          <ScreenshotCarousel images={WHEEL_SCREENSHOTS[i]} activePos={dataPos} />
        </div>
      </div>
    </div>
  );
}

export default function Platform() {
  const { t } = useTranslation();

  const wheels = [
    {
      title: t('platformCarousel.osTag', 'The OS'),
      subtitle: t('platformCarousel.osSubtitle', 'Boot into a unified command center — ontology, sectors, and intelligence at your fingertips.'),
    },
    {
      title: t('platformCarousel.cycleTag', 'Integrated Decision Making'),
      subtitle: t('platformCarousel.cycleSubtitle', 'Three modes. One continuous loop. From situational awareness to executed intervention.'),
    },
    {
      title: t('platformCarousel.diffTag', 'Beyond Expectations'),
      subtitle: t('platformCarousel.diffSubtitle', 'AI-generated intelligence — sector reports, risk advisories, and capacity analysis.'),
    },
  ];

  return (
    <section className="content-centered" id="platform">
      <div className="section-content-box" style={{ paddingBottom: 0 }}>
        {/* Section header — NoNoise style */}
        <div style={{ textAlign: 'center', marginBottom: '0px' }}>
          <div className="section-tag">{t('platform.tag', 'The Platform')}</div>
          <h2>{t('nonoise.title', 'No Noise.. One Continuous Signal')}</h2>
          <p className="subtitle" style={{ maxWidth: '640px', marginBottom: '8px' }}>
            {t('nonoise.subtitle', 'One Reference Loop. The key to integrating enterprise governance with agent workflows')}
          </p>
        </div>

        {/* 3D ConcaveCarousel with 3 wheel cards */}
        <ConcaveCarousel autoRotateInterval={6000} height="460px">
          {wheels.map((wheel, i) => (
            <WheelCard key={i} wheel={wheel} i={i} />
          ))}
        </ConcaveCarousel>
      </div>
    </section>
  );
}
