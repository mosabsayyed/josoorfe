import React from 'react';
import { NoNoiseContent } from './types';

interface NoNoiseProps {
  content: NoNoiseContent;
}

export default function NoNoise({ content }: NoNoiseProps) {
  return (
    <section className="content-centered" id="nonoise">
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'inherit',
          fontSize: 'clamp(28px, 6vw, 48px)',
          fontWeight: 800,
          marginBottom: '16px'
        }}>
          {content.title}
        </h2>

        <p style={{
          fontSize: '16px',
          lineHeight: '1.65',
          margin: '0 auto 40px',
          maxWidth: '700px',
          color: 'var(--component-text-secondary)'
        }}>
          {content.subtitle}
        </p>
      </div>
    </section>
  );
}
