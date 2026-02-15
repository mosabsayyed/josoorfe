import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PromiseContent } from './types';

interface PromiseProps {
  content: PromiseContent;
}

export default function Promise({ content }: PromiseProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const totalCards = content.personas.length;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate position for each card (-2, -1, 0, 1, 2, or 'hidden')
  const calculatePosition = (cardIndex: number): number | 'hidden' => {
    let pos = cardIndex - currentIndex;

    // Wrap around
    if (pos > Math.floor(totalCards / 2)) pos -= totalCards;
    if (pos < -Math.floor(totalCards / 2)) pos += totalCards;

    // Hide cards beyond -2 and 2
    if (pos < -2 || pos > 2) return 'hidden';

    return pos;
  };

  // Get CSS transform and styles based on position
  const getCardStyles = (pos: number | 'hidden') => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width: isMobile ? '300px' : '380px',
      maxWidth: '85vw',
      borderRadius: 'var(--radius-xl, 12px)',
      border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
      background: 'var(--component-panel-bg)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      cursor: 'pointer',
    };

    // Mobile responsive transforms
    if (isMobile) {
      switch (pos) {
        case -2:
        case 2:
          return {
            ...baseStyles,
            opacity: 0,
            transform: 'translateX(0) scale(0)',
            zIndex: 0,
            pointerEvents: 'none' as const,
          };
        case -1:
          return {
            ...baseStyles,
            transform: 'translateX(-160px) rotateY(20deg) scale(0.75)',
            opacity: 0.4,
            zIndex: 2,
            filter: 'brightness(0.7)',
          };
        case 0:
          return {
            ...baseStyles,
            transform: 'translateX(0) rotateY(0deg) scale(1)',
            opacity: 1,
            zIndex: 4,
          };
        case 1:
          return {
            ...baseStyles,
            transform: 'translateX(160px) rotateY(-20deg) scale(0.75)',
            opacity: 0.4,
            zIndex: 2,
            filter: 'brightness(0.7)',
          };
        case 'hidden':
          return {
            ...baseStyles,
            transform: 'translateX(0) scale(0)',
            opacity: 0,
            zIndex: 0,
            pointerEvents: 'none' as const,
          };
        default:
          return baseStyles;
      }
    }

    // Desktop transforms
    switch (pos) {
      case -2:
        return {
          ...baseStyles,
          transform: 'translateX(-520px) rotateY(35deg) scale(0.7)',
          opacity: 0.3,
          zIndex: 1,
          pointerEvents: 'none' as const,
        };
      case -1:
        return {
          ...baseStyles,
          transform: 'translateX(-280px) rotateY(25deg) scale(0.82)',
          opacity: 0.6,
          zIndex: 2,
          filter: 'brightness(0.7)',
        };
      case 0:
        return {
          ...baseStyles,
          transform: 'translateX(0) rotateY(0deg) scale(1)',
          opacity: 1,
          zIndex: 4,
        };
      case 1:
        return {
          ...baseStyles,
          transform: 'translateX(280px) rotateY(-25deg) scale(0.82)',
          opacity: 0.6,
          zIndex: 2,
          filter: 'brightness(0.7)',
        };
      case 2:
        return {
          ...baseStyles,
          transform: 'translateX(520px) rotateY(-35deg) scale(0.7)',
          opacity: 0.3,
          zIndex: 1,
          pointerEvents: 'none' as const,
        };
      case 'hidden':
        return {
          ...baseStyles,
          transform: 'translateX(0) scale(0)',
          opacity: 0,
          zIndex: 0,
          pointerEvents: 'none' as const,
        };
      default:
        return baseStyles;
    }
  };

  // Auto-rotation
  useEffect(() => {
    if (!isPaused) {
      autoRotateRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalCards);
      }, 4500);
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [isPaused, totalCards]);

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const handleCardClick = (pos: number | 'hidden') => {
    if (pos === -1 || pos === -2) {
      goToPrev();
    } else if (pos === 1 || pos === 2) {
      goToNext();
    }
  };

  return (
    <section className="content-centered" id="promise">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="section-tag">{content.tag}</div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '560px' }}>{content.subtitle}</p>
        </div>

        {/* 3D Concave Carousel - matching v10 spacing */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              height: isMobile ? '420px' : '580px',
              perspective: '900px',
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {content.personas.map((persona, i) => {
              const pos = calculatePosition(i);
              return (
                <div
                  key={i}
                  style={getCardStyles(pos)}
                  onClick={() => handleCardClick(pos)}
                >
                  {/* Persona Photo */}
                  <img
                    src={`/att/personas/${
                      i === 0 ? 'scenario_vice_minister_v3.png' :
                      i === 1 ? 'scenario_stakeholder_v2.png' :
                      i === 2 ? 'scenario_strategy_manager_v2.png' :
                      'scenario_pmo_director_v4.png'
                    }`}
                    alt={persona.role}
                    style={{
                      width: '100%',
                      height: isMobile ? '180px' : '260px',
                      objectFit: 'cover',
                      objectPosition: 'center 20%',
                      filter: pos === 0 ? 'brightness(0.95) saturate(1)' : 'brightness(0.85) saturate(0.9)',
                      transition: 'filter 0.4s',
                    }}
                  />

                  {/* Card Body */}
                  <div style={{ padding: '1.1rem 1.3rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '14px',
                        color: 'var(--gold-muted, #D4AF37)',
                        letterSpacing: '0.06em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {persona.role}
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--error, #ff4444)',
                      }}
                    >
                      {t('promise.before')}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-muted, rgba(255, 255, 255, 0.6))',
                        lineHeight: '1.45',
                        margin: '0.15rem 0 0.4rem',
                      }}
                    >
                      {persona.before}
                    </div>

                    <div
                      style={{
                        height: '1px',
                        background: 'var(--border-default, rgba(255, 255, 255, 0.1))',
                        margin: '0.3rem 0',
                      }}
                    />

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--success, #44ff44)',
                      }}
                    >
                      {t('promise.withJosoor')}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-primary, #ffffff)',
                        fontWeight: 500,
                        lineHeight: '1.45',
                        marginTop: '0.15rem',
                      }}
                    >
                      {persona.after}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.8rem',
              marginTop: '0.5rem',
            }}
          >
            <button
              onClick={goToPrev}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
                background: 'var(--component-panel-bg)',
                color: 'var(--text-muted, rgba(255, 255, 255, 0.6))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-muted, #D4AF37)';
                e.currentTarget.style.color = 'var(--gold-primary, #FFD700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default, rgba(255, 255, 255, 0.1))';
                e.currentTarget.style.color = 'var(--text-muted, rgba(255, 255, 255, 0.6))';
              }}
            >
              ‹
            </button>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {content.personas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: i === currentIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: i === currentIndex ? 'var(--gold-primary, #FFD700)' : 'var(--border-default, rgba(255, 255, 255, 0.2))',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
                background: 'var(--component-panel-bg)',
                color: 'var(--text-muted, rgba(255, 255, 255, 0.6))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-muted, #D4AF37)';
                e.currentTarget.style.color = 'var(--gold-primary, #FFD700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default, rgba(255, 255, 255, 0.1))';
                e.currentTarget.style.color = 'var(--text-muted, rgba(255, 255, 255, 0.6))';
              }}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
