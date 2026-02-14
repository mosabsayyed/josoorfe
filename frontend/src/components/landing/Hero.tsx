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
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '4rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Sparkle background with hero image */}
      <Sparkle imageSrc="/att/ksa_mpbackgd.png" dotCount={1000} />

      {/* Overlay - split into two layers so glass box can blur the real background */}
      {/* Bottom overlay: edges only, center stays transparent for glass blur */}
      <div className="hero-overlay" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(17, 24, 39, 0.6) 60%, var(--component-bg-primary, #111827) 90%), linear-gradient(180deg, transparent 50%, var(--component-bg-primary, #111827) 100%)',
        pointerEvents: 'none'
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
            fontFamily: 'var(--font-heading, "IBM Plex Sans")',
            fontSize: 'clamp(38px, 5vw, 60px)',
            fontWeight: 800,
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

          {/* Brand box - logo first, text below */}
          <div className="hero-brand" style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1.2rem 2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
          }}>
            <div className="hb-logo" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src="/icons/josoor.png"
                alt="Josoor"
                style={{
                  height: '80px',
                  width: 'auto',
                  filter: 'brightness(1.1)'
                }}
              />
            </div>
            <div className="hb-name" style={{
              fontFamily: 'var(--font-heading, "IBM Plex Sans")',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright, #FFD04A)'
            }}>
              {content.badge}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
