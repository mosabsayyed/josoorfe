import React from 'react';
import { ClaimsContent } from './types';
import '../../styles/landing.css';

interface ClaimsProps {
  content: ClaimsContent;
}

export default function Claims({ content }: ClaimsProps) {
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

        {/* Vertical list layout from v10 HTML */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {content.items.map((claim, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              padding: '16px 20px',
              background: 'var(--component-panel-bg)',
              border: '1px solid var(--component-border)',
              borderRadius: '8px',
              transition: 'border-color 0.3s, background 0.3s'
            }}
            className="claim-item-hover">
              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--component-text-accent)',
                minWidth: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(244, 187, 48, 0.25)',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {i + 1}
              </div>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.55',
                color: 'var(--component-text-secondary)',
                margin: 0
              }} dangerouslySetInnerHTML={{ __html: claim }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
