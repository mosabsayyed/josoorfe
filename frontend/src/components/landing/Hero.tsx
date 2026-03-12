import React, { useState, useEffect } from 'react';
import { HeroContent } from './types';
import DesktopExperience from './DesktopExperience';

interface HeroProps {
  content: HeroContent;
  language: string;
}

export default function Hero({ content, language }: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const badgeParts = (content.badge || '').split('\n').filter(Boolean);

  return (
    <section className="hero" id="hero" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: isMobile ? '60px' : '70px',
      paddingBottom: 0,
    }}>
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
        <div style={{
          position: 'relative',
          height: isMobile ? 'calc(100dvh - 120px)' : 'calc(100dvh - 130px)',
          aspectRatio: '1685 / 913',
          maxWidth: '100%',
          margin: '0 auto',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Title overlaid INSIDE desktop container — aligns with desktop edge */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '16px' : '24px',
            ...(isRTL
              ? { right: isMobile ? '1rem' : '2rem', textAlign: 'right' as const }
              : { left: isMobile ? '1rem' : '2rem', textAlign: 'left' as const }
            ),
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            <h1 style={{
              fontFamily: 'inherit',
              fontSize: isMobile ? 'clamp(16px, 4.5vw, 22px)' : 'clamp(20px, 2.8vw, 36px)',
              fontWeight: 800,
              lineHeight: '1.15',
              letterSpacing: '-0.03em',
              marginBottom: '0.3rem',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
            }}>
              <span className="hw" style={{
                background: 'linear-gradient(135deg, #F4BB30, #FFD04A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {content.title}
              </span>{' '}
              <span style={{ color: 'var(--text-primary, #f8f8f8)' }}>
                {content.subtitle}
              </span>
            </h1>
            <p style={{
              fontSize: isMobile ? 'clamp(11px, 2.5vw, 14px)' : 'clamp(13px, 1.8vw, 18px)',
              fontWeight: 600,
              color: 'rgba(249, 250, 251, 0.85)',
              margin: 0,
              textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
            }}>
              {content.sectors}
            </p>
          </div>

          <DesktopExperience language={language} />
        </div>
      </div>

      {/* Bottom strip: badge parts with separator */}
      {badgeParts.length > 0 && (
        <div style={{
          zIndex: 3,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '4px 0' : '0',
          padding: isMobile ? '10px 12px' : '14px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          {badgeParts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span style={{
                  width: '1px',
                  height: '18px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  margin: isMobile ? '0 10px' : '0 20px',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }} />
              )}
              <span style={{
                fontSize: isMobile ? '11px' : 'clamp(12px, 1.5vw, 14px)',
                fontWeight: 600,
                color: 'rgba(244, 187, 48, 0.8)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: isMobile ? 'normal' : 'nowrap',
                textAlign: 'center',
              }}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
