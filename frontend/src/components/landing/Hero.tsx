import React, { useState, useEffect } from 'react';
import { HeroContent } from './types';
import Sparkle from './Sparkle';

interface HeroProps {
  content: HeroContent;
  language: string;
}

export default function Hero({ content, language }: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Split badge into two parts on newline for the bottom strip
  const badgeParts = (content.badge || '').split('\n').filter(Boolean);

  return (
    <section className="hero" id="hero" style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: isMobile ? '80px' : '4rem',
      paddingBottom: isMobile ? '100px' : '72px', // room for the bottom strip
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Sparkle background */}
      <Sparkle imageSrc="/att/ksa_mpbackgd.png" dotCount={1000} />

      {/* Radial + bottom fade overlay */}
      <div className="hero-overlay" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(17, 24, 39, 0.6) 60%, var(--component-bg-primary, #111827) 90%), linear-gradient(180deg, transparent 50%, var(--component-bg-primary, #111827) 100%)',
        pointerEvents: 'none'
      }} />

      {/* ── Main center stack ── */}
      <div className="container" style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: isMobile ? '3rem' : 'clamp(88px, 10vw, 120px)',
        }}>

          {/* 1+2 — Logo + title grouped tightly */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/icons/josoor.png"
              alt="Josoor"
              style={{
                height: 'clamp(52px, 7vw, 80px)',
                width: 'auto',
                filter: 'brightness(1.1)',
                flexShrink: 0,
              }}
            />

            {/* Title + subtitle + sectors */}
            <div>
              <h2 style={{
                fontFamily: 'inherit',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '0.4rem',
              }}>
                <span className="hw" style={{
                  background: 'linear-gradient(135deg, #F4BB30, #FFD04A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {content.title}
                </span>
              </h2>
              <h1 style={{
                fontFamily: 'inherit',
                fontSize: 'clamp(26px, 5vw, 60px)',
                fontWeight: 800,
                color: 'var(--text-primary, #f8f8f8)',
                lineHeight: '1.1',
                letterSpacing: '-0.03em',
                marginBottom: '0.75rem',
              }}>
                {content.subtitle}
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                fontWeight: 600,
                color: 'rgba(249, 250, 251, 0.85)',
                margin: 0,
              }}>
                {content.sectors}
              </p>
            </div>
          </div>

          {/* 3 — Two container boxes, each with 3 square boxes in a row */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '2rem' : 'clamp(88px, 10vw, 120px)',
            alignItems: 'stretch',
            justifyContent: 'center',
          }}>
            {[
              { items: content.intelligence ?? [], title: content.intelligenceTitle, desc: content.intelligenceDesc, containerBorder: 'rgba(244, 187, 48, 0.25)', containerBg: 'rgba(244, 187, 48, 0.04)', boxBorder: 'rgba(255, 255, 255, 0.4)', boxBg: 'rgba(255, 255, 255, 0.15)', color: '#F4BB30', titleColor: 'rgba(244, 187, 48, 0.9)' },
              { items: content.trust ?? [], title: content.trustTitle, desc: content.trustDesc, containerBorder: 'rgba(244, 187, 48, 0.25)', containerBg: 'rgba(244, 187, 48, 0.04)', boxBorder: 'rgba(255, 255, 255, 0.4)', boxBg: 'rgba(255, 255, 255, 0.15)', color: '#F4BB30', titleColor: 'rgba(244, 187, 48, 0.9)' },
            ].map((group, gi) => {
              const boxSize = isMobile ? '90px' : 'clamp(88px, 10vw, 120px)';
              return (
                <div key={gi} style={{
                  border: `1px solid ${group.containerBorder}`,
                  borderRadius: '18px',
                  background: group.containerBg,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: isMobile ? '12px' : '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '8px' : '12px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {group.title && (
                    <p className="hero-box-title" style={{ color: group.titleColor }}>
                      {group.title}
                    </p>
                  )}
                  {group.desc && (
                    <p className="hero-box-desc">
                      {group.desc}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'row', gap: isMobile ? '6px' : '10px', alignItems: 'center', justifyContent: 'center' }}>
                  {group.items.map((item, i) => (
                    <div key={i} style={{
                      width: boxSize,
                      height: boxSize,
                      flexShrink: 0,
                      border: `1px solid rgba(244, 187, 48, 0.25)`,
                      borderRadius: '12px',
                      background: '#1F2937',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px',
                    }}>
                      <div className="hero-box-figure" style={{
                        color: '#F4BB30',
                      }}>
                        {(item.figure.includes('وثبات') || item.figure.includes('-Hops')) ? (
                          <>
                            {item.figure.replace('وثبات', '').replace('-Hops', '').trim()}{item.figure.includes('-Hops') ? '-' : ' '}
                            <span style={{ fontWeight: 400, fontSize: '14px' }}>
                              {item.figure.includes('-Hops') ? 'Hops' : 'وثبات'}
                            </span>
                          </>
                        ) : (
                          item.figure
                        )}
                      </div>
                      <span className="hero-box-label" style={{ color: '#F4BB30' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Bottom strip: badge parts with separator ── */}
      {badgeParts.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0',
          padding: '14px 24px',
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
                  margin: '0 20px',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }} />
              )}
              <span style={{
                fontSize: 'clamp(12px, 1.5vw, 14px)',
                fontWeight: 600,
                color: 'rgba(244, 187, 48, 0.8)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
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
