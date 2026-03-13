import React from 'react';
import { HeroContent } from './types';
import DesktopExperience from './DesktopExperience';
import './Hero.css';

interface HeroProps {
  content: HeroContent;
  language: string;
}

export default function Hero({ content, language }: HeroProps) {
  const isRTL = language === 'ar';
  const badgeParts = (content.badge || '').split('\n').filter(Boolean);

  return (
    <section className="hero hero-section" id="hero">
      {/* Subtle radial fade at edges */}
      <div className="hero-overlay" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, var(--component-bg-primary, #111827) 90%)',
        pointerEvents: 'none'
      }} />

      {/* Desktop fills remaining space with title overlaid */}
      <div style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Desktop Experience — height-driven, width from aspect ratio */}
        <div className="hero-desktop-container">
          {/* Title overlaid INSIDE desktop container — aligns with desktop edge */}
          <div 
            className="hero-title-container"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <h1 className="hero-title">
              <span className="hw" style={{
                background: 'linear-gradient(135deg, #F4BB30, #FFD04A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {content.title}
              </span>
              <span style={{ color: 'var(--text-primary, #f8f8f8)' }}>
                {' '}{content.subtitle}
              </span>
            </h1>
            <p className="hero-sectors">
              {content.sectors}
            </p>
          </div>

          <DesktopExperience language={language} />
        </div>
      </div>

      {/* Bottom strip: badge parts with separator */}
      {badgeParts.length > 0 && (
        <div className="hero-badge-strip">
          {badgeParts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className="hero-badge-separator" />
              )}
              <span className="hero-badge-text">
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
