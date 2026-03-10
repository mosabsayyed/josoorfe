import React, { useState, useEffect } from 'react';
import { HeroContent } from './types';
import Sparkle from './Sparkle';

interface HeroProps {
  content: HeroContent;
  language: string;
}

/** Hook: picks a random box index (0–5) every ~5s */
function useRandomShimmer(total: number) {
  const [activeIdx, setActiveIdx] = useState(-1);
  useEffect(() => {
    const tick = () => {
      const next = Math.floor(Math.random() * total);
      setActiveIdx(next);
      // Reset after the shimmer animation completes (1.2s)
      setTimeout(() => setActiveIdx(-1), 1200);
    };
    const id = setInterval(tick, 5000);
    // Fire once on mount after a short delay
    const init = setTimeout(tick, 1500);
    return () => { clearInterval(id); clearTimeout(init); };
  }, [total]);
  return activeIdx;
}

/** Single hero stat box with flip-on-hover: label → figure */
function HeroBox({ item, boxSize, isMobile, shimmer }: { item: { figure: string; label: string }; boxSize: string; isMobile: boolean; shimmer: boolean }) {
  const [hovered, setHovered] = useState(false);

  // Parse multi-word figures like "8 وثبات" / "8-Hops"
  const figureMain = item.figure.replace(/وثبات|-Hops/g, '').trim();
  const figureSuffix = item.figure.includes('وثبات') ? 'وثبات' : item.figure.includes('-Hops') ? 'Hops' : '';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: boxSize,
        height: boxSize,
        flexShrink: 0,
        border: `1px solid ${shimmer ? 'rgba(244, 187, 48, 0.8)' : 'rgba(244, 187, 48, 0.25)'}`,
        borderRadius: '12px',
        background: '#1F2937',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: shimmer ? '0 0 14px rgba(244, 187, 48, 0.35), inset 0 0 8px rgba(244, 187, 48, 0.1)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        padding: '8px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* Label text — default visible, fades out on hover */}
      <span style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: isMobile ? '11px' : 'clamp(13px, 1.5vw, 16px)',
        fontWeight: 600,
        lineHeight: 1.3,
        color: 'rgba(244, 187, 48, 0.85)',
        padding: '8px',
        whiteSpace: 'pre-line',
        opacity: hovered ? 0 : 1,
        transform: hovered ? 'scale(0.85)' : 'scale(1)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}>
        {item.label}
      </span>

      {/* Figure — hidden by default, scales up on hover */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'scale(1)' : 'scale(1.3)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}>
        <span style={{
          fontSize: isMobile ? '24px' : 'clamp(28px, 4vw, 42px)',
          fontWeight: 800,
          color: '#F4BB30',
          lineHeight: 1,
        }}>
          {figureMain}
        </span>
        {figureSuffix && (
          <span style={{
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 400,
            color: '#F4BB30',
            marginTop: '2px',
          }}>
            {figureSuffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Hero({ content, language }: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Random shimmer: picks one of the 6 boxes every ~5s
  const totalBoxes = (content.intelligence?.length || 0) + (content.trust?.length || 0);
  const shimmerIdx = useRandomShimmer(totalBoxes);

  // Split badge into two parts on newline for the bottom strip
  const badgeParts = (content.badge || '').split('\n').filter(Boolean);

  return (
    <section className="hero" id="hero" style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: isMobile ? '72px' : 'clamp(100px, 12vh, 160px)',
      paddingBottom: isMobile ? '40px' : '72px',
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

      {/* ── Main centered layout ── */}
      <div className="container" style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: isMobile ? '0 1rem' : '0 2rem',
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: isMobile ? '2rem' : 'clamp(36px, 4vw, 52px)',
        }}>

          {/* ── ROW 1: Title ── */}
          <div style={{ marginTop: '50px' }}>
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
              fontSize: isMobile ? 'clamp(22px, 6vw, 32px)' : 'clamp(26px, 5vw, 60px)',
              fontWeight: 800,
              color: 'var(--text-primary, #f8f8f8)',
              lineHeight: '1.1',
              letterSpacing: '-0.03em',
              marginBottom: '0.5rem',
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

          {/* ── Middle tagline ── */}
          <div style={{ height: isMobile ? '60px' : '200px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '0.02em',
              margin: 0,
            }}>
              {content.middleTagline || 'Building the bridges from Strategy to Execution, one bridge at a time.'}
            </p>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1.25rem' : 'clamp(24px, 3vw, 48px)',
            alignItems: 'stretch',
            justifyContent: 'center',
          }}>
            {[
              { items: content.intelligence ?? [], startIdx: 0, title: content.intelligenceTitle, desc: content.intelligenceDesc },
              { items: content.trust ?? [], startIdx: content.intelligence?.length || 0, title: content.trustTitle, desc: content.trustDesc },
            ].map((group, gi) => {
              const boxSize = isMobile ? 'clamp(76px, 22vw, 96px)' : 'clamp(96px, 10vw, 130px)';
              return (
                <div key={gi} style={{
                  border: '1px solid rgba(244, 187, 48, 0.2)',
                  borderRadius: '16px',
                  background: 'rgba(244, 187, 48, 0.03)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: isMobile ? '10px 12px' : '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  {group.title && (
                    <p className="hero-box-title" style={{ color: 'rgba(244, 187, 48, 0.9)' }}>
                      {group.title}
                    </p>
                  )}
                  {group.desc && (
                    <p className="hero-box-desc">
                      {group.desc}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'row', gap: isMobile ? '6px' : '8px', alignItems: 'center', justifyContent: 'center' }}>
                    {group.items.map((item, i) => (
                      <HeroBox key={i} item={item} boxSize={boxSize} isMobile={isMobile} shimmer={shimmerIdx === group.startIdx + i} />
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
