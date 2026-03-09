import React from 'react';
import { useTranslation } from 'react-i18next';

export default function SaudiMapMoats() {
  const { t } = useTranslation();

  const blocks = [
    {
      titleKey: 'saudiMap.block1Title',
      descKey: 'saudiMap.block1Desc',
      statKey: 'saudiMap.block1Stat',
      fallbackTitle: 'Arabic-Native',
      fallbackDesc: 'Built for Arabic-first government. RTL by design, not by patch.',
      fallbackStat: '100% Arabic',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 8h20v16H6z" stroke="#F4BB30" strokeWidth="2" fill="none" />
          <path d="M10 14h4M10 18h8" stroke="#F4BB30" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="22" cy="14" r="2" stroke="#F4BB30" strokeWidth="1.5" fill="none" />
        </svg>
      ),
    },
    {
      titleKey: 'saudiMap.block2Title',
      descKey: 'saudiMap.block2Desc',
      statKey: 'saudiMap.block2Stat',
      fallbackTitle: 'Sovereign',
      fallbackDesc: 'Your data stays in KSA. On-premise or local cloud. Zero foreign dependency.',
      fallbackStat: 'On-Soil',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 4L4 12v12l12 4 12-4V12L16 4z" stroke="#F4BB30" strokeWidth="2" fill="none" />
          <path d="M16 16v8M4 12l12 4 12-4" stroke="#F4BB30" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      titleKey: 'saudiMap.block3Title',
      descKey: 'saudiMap.block3Desc',
      statKey: 'saudiMap.block3Stat',
      fallbackTitle: 'Vision Database',
      fallbackDesc: "KSA's first public-sector ontology — a living model of Vision 2030.",
      fallbackStat: '285+ Nodes',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="10" r="3" stroke="#F4BB30" strokeWidth="1.5" fill="none" />
          <circle cx="8" cy="22" r="3" stroke="#F4BB30" strokeWidth="1.5" fill="none" />
          <circle cx="24" cy="22" r="3" stroke="#F4BB30" strokeWidth="1.5" fill="none" />
          <path d="M14 12l-4 8M18 12l4 8M11 22h10" stroke="#F4BB30" strokeWidth="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <section id="saudi-map" className="content-centered">
      <div className="section-content-box">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="section-tag">
            {t('saudiMap.tag', 'Why Josoor')}
          </div>
          <h2 style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 700, margin: '12px 0 16px' }}>
            {t('saudiMap.title', 'Built Different. Built Here.')}
          </h2>
          <p
            className="subtitle"
            style={{ maxWidth: '560px', margin: '0 auto', color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem' }}
          >
            {t('saudiMap.subtitle', 'Three unchallengeable advantages no competitor can claim.')}
          </p>
        </div>

        {/* Map */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <img
            src="/att/landing-screenshots/ksa_mpbackgd.png"
            alt="KSA Map"
            style={{ maxWidth: '100%', width: '640px', height: 'auto', borderRadius: '12px' }}
          />
        </div>

        {/* 3 Moat Blocks */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
        >
          {blocks.map((block, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(17, 24, 39, 0.6)',
                border: '1px solid rgba(244, 187, 48, 0.15)',
                borderTop: '3px solid #F4BB30',
                borderRadius: '12px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Icon */}
              <div style={{ marginBottom: '4px' }}>{block.icon}</div>

              {/* Title */}
              <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {t(block.titleKey, block.fallbackTitle)}
              </h3>

              {/* Description */}
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                {t(block.descKey, block.fallbackDesc)}
              </p>

              {/* Stat */}
              <div
                style={{
                  color: '#F4BB30',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  marginTop: 'auto',
                  paddingTop: '12px',
                  fontFamily: "'IBM Plex Sans', Inter, sans-serif",
                }}
              >
                {t(block.statKey, block.fallbackStat)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive: stack blocks on mobile */}
      <style>{`
        @media (max-width: 768px) {
          #saudi-map .section-content-box > div:last-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
