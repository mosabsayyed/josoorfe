import React from 'react';
import { NoNoiseContent } from './types';
import NoiseParticles from './NoiseParticles';

interface NoNoiseProps {
  content: NoNoiseContent;
}

export default function NoNoise({ content }: NoNoiseProps) {
  return (
    <section className="content-centered" id="nonoise">
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        {/* Title - matching v10 style */}
        <h2 style={{
          fontFamily: 'var(--font-heading, "Inter")',
          fontSize: 'clamp(28px, 6vw, 48px)',
          fontWeight: 800,
          marginBottom: '16px'
        }}>
          {content.title}
        </h2>

        {/* Subtitle - proper spacing */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.65',
          margin: '0 auto 40px',
          maxWidth: '700px',
          color: 'var(--component-text-secondary)'
        }}>
          {content.subtitle}
        </p>

        {/* Particle animation — scattered particles collide and stream into convergence dot */}
        <NoiseParticles width={600} height={200} />

        {/* Swagger text - v10 style */}
        <p style={{
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 800,
          lineHeight: '1.3',
          marginTop: '48px',
          fontFamily: 'var(--font-heading, "Inter")',
          color: 'var(--component-text-primary)'
        }}>
          {content.swagger}
        </p>

        {/* Closing text */}
        <p style={{
          marginTop: '32px',
          fontSize: '16px',
          lineHeight: '1.65',
          color: 'var(--component-text-secondary)'
        }}>
          {content.closing}
        </p>
      </div>
    </section>
  );
}
