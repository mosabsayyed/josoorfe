import React from 'react';
import { HeroContent } from './types';

interface HeroProps {
  content: HeroContent;
}

export default function Hero({ content }: HeroProps) {
  return (
    <section className="hero-section" style={{ paddingTop: '120px' }}>
      <video
        className="hero-background-video"
        autoPlay
        muted
        loop
        playsInline
        poster="/att/landing-screenshots/Vector.svg"
      >
        {/* Video source to be added */}
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-badge" style={{
          display: 'inline-block',
          padding: '8px 16px',
          marginBottom: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500',
          letterSpacing: '0.5px'
        }}>
          {content.badge}
        </div>
        <h1 className="hero-title">{content.title}</h1>
        <p className="hero-subtitle">{content.subtitle}</p>
      </div>
      <div className="scroll-indicator">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 13L12 18L17 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 6L12 11L17 6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
}
