import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VisionConvergence from './VisionConvergence';
import Sparkle from './Sparkle';

export default function VisionMemory() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showConvergence, setShowConvergence] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const highlights = t('visionMemory.highlights', { returnObjects: true }) as Array<{ bold: string; text: string }>;

  return (
    <section className="content-centered" id="vision-memory" ref={sectionRef} style={{
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="section-content-box">
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '2rem' : '3rem',
          alignItems: 'center',
          padding: isMobile ? '2rem 1.25rem' : '3rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          {/* Sparkle map layer — above card bg, below text */}
          {!isMobile && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: '16px', overflow: 'hidden', pointerEvents: 'none' }}>
            <Sparkle imageSrc="/att/ksa_mpbackgd.png" dotCount={1000} />
          </div>
          )}

          {/* Left: stat + tag */}
          <div style={{
            flex: isMobile ? 'none' : '0 0 280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}>
            <img
              src="/att/vision2030-logo.png"
              alt="Vision 2030"
              style={{
                width: isMobile ? '80px' : '100px',
                height: 'auto',
                opacity: 0.9,
                marginBottom: '4px',
              }}
            />
            <div className="section-tag" style={{ margin: 0, color: '#fff' }}>
              {t('visionMemory.tag')}
            </div>
            <span style={{
              fontSize: isMobile ? '56px' : '72px',
              fontWeight: 800,
              color: '#F4BB30',
              lineHeight: 1,
            }}>
              {t('visionMemory.statValue')}
            </span>
            <span style={{
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: '0.03em',
              maxWidth: '220px',
            }}>
              {t('visionMemory.statLabel')}
            </span>
          </div>

          {/* Right: title + description + highlights */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            zIndex: 2,
          }}>
            <h2 style={{
              fontSize: isMobile ? '24px' : '30px',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.25,
              margin: 0,
            }}>
              {t('visionMemory.title')}
            </h2>

            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: 'var(--component-text-secondary, #D1D5DB)',
              lineHeight: 1.7,
              margin: 0,
            }}>
              {t('visionMemory.description')}
            </p>

            {/* Highlight chips */}
            {Array.isArray(highlights) && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '4px',
              }}>
                {highlights.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{
                      flexShrink: 0,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#F4BB30',
                      marginTop: '8px',
                    }} />
                    <span style={{
                      fontSize: isMobile ? '14px' : '15px',
                      color: 'var(--component-text-secondary, #D1D5DB)',
                      lineHeight: 1.6,
                    }}>
                      <strong style={{ color: '#F4BB30', fontWeight: 600 }}>
                        {item.bold}
                      </strong>{' '}
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <VisionConvergence isOpen={showConvergence} onClose={() => setShowConvergence(false)} />
    </section>
  );
}
