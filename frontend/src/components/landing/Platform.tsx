import React from 'react';
import { PlatformContent } from './types';
import ConcaveCarousel from './ConcaveCarousel';
import MockupChrome from './MockupChrome';
import WatchMockup from './WatchMockup';
import DecideMockup from './DecideMockup';
import DeliverMockup from './DeliverMockup';
import '../../styles/landing.css';

interface PlatformProps {
  content: PlatformContent;
}

export default function Platform({ content }: PlatformProps) {
  const mockupComponents = [
    <WatchMockup />,
    <DecideMockup />,
    <DeliverMockup />
  ];

  return (
    <section className="content-centered">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '14px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--gold-muted, rgba(196, 149, 32, 1))',
            marginBottom: '12px'
          }}>
            {content.tag}
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800, marginBottom: '10px', fontFamily: 'var(--font-heading, "IBM Plex Sans")' }}>{content.title}</h2>
          <p className="subtitle" style={{ fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.65' }}>{content.subtitle}</p>
        </div>

        <ConcaveCarousel autoRotateInterval={6000} height="460px">
          {content.modes.map((mode, i) => (
            <div key={i} className="cc-card" style={{ maxWidth: '90vw' }}>
              <div className="mc-inner">
                <div className="mc-text">
                  <h3>{mode.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: mode.desc }} />
                </div>
                <MockupChrome label={`${mode.title} Dashboard`}>
                  {mockupComponents[i]}
                </MockupChrome>
              </div>
            </div>
          ))}
        </ConcaveCarousel>
      </div>
    </section>
  );
}
