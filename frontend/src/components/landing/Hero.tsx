import React from 'react';
import { HeroContent } from './types';
import Sparkle from './Sparkle';

interface HeroProps {
  content: HeroContent;
  language: string;
}

export default function Hero({ content, language }: HeroProps) {
  return (
    <section className="hero" id="hero" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '6rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Sparkle background with hero image */}
      <Sparkle imageSrc="/att/hero-bg.jpg" dotCount={600} />

      {/* Overlay - exact v10 gradients */}
      <div className="hero-overlay" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, var(--bg-deep, #0B0F1A) 75%), linear-gradient(180deg, transparent 40%, var(--bg-deep, #0B0F1A) 100%)'
      }}></div>

      {/* Container - exact v10 structure */}
      <div className="container" style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        <div className="hero-center" style={{
          textAlign: 'center',
          maxWidth: '760px',
          margin: '0 auto'
        }}>
          {/* H1 with gold gradient span + subtitle - EXACT v10 structure */}
          <h1 style={{
            fontFamily: 'var(--font-heading, "Inter")',
            fontSize: 'clamp(38px, 5vw, 61px)',
            fontWeight: '800',
            color: 'var(--text-primary, #f8f8f8)',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem'
          }}>
            <span className="hw" style={{
              background: 'linear-gradient(135deg, #F4BB30, #FFD04A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {content.title}
            </span>
            <br />
            {content.subtitle}
          </h1>

          {/* Brand box - exact v10 structure */}
          <div className="hero-brand" style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '1.2rem 3rem',
            border: '2px solid var(--gold-primary, #F4BB30)',
            borderRadius: 'var(--radius-xl, 16px)',
            background: 'linear-gradient(135deg, rgba(244,187,48,0.06), rgba(244,187,48,0.01))',
            boxShadow: '0 0 60px rgba(244,187,48,0.06)'
          }}>
            <div className="hb-name" style={{
              fontFamily: 'var(--font-heading, "Inter")',
              fontSize: '30px',
              fontWeight: '800',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright, #FFD04A)'
            }}>
              {content.badge}
            </div>
            <div className="hb-tag" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--gold-primary, #F4BB30)',
              letterSpacing: '0.03em'
            }}>
              (replace with josoor logo)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
