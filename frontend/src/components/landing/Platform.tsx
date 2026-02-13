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
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'var(--component-panel-bg)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '1px',
            marginBottom: '20px'
          }}>
            {content.tag}
          </div>
          <h2>{content.title}</h2>
          <p className="subtitle">{content.subtitle}</p>
        </div>

        <ConcaveCarousel autoRotateInterval={6000} height="460px">
          {content.modes.map((mode, i) => (
            <div key={i} className="cc-card" style={{ width: '560px', maxWidth: '90vw' }}>
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
