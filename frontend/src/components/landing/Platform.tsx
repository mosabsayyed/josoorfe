import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SolutionCard {
  tagKey: string;
  tagFallback: string;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
  image: string;
  stat?: { valueKey: string; valueFallback: string; labelKey: string; labelFallback: string };
}

const CARDS: SolutionCard[] = [
  {
    tagKey: 'solution.card1Tag',
    tagFallback: 'The Foundation',
    titleKey: 'solution.card1Title',
    titleFallback: 'A Living Map of Your Entire Sector',
    descKey: 'solution.card1Desc',
    descFallback: 'Every strategic goal, institutional capability, risk, and project — connected in one knowledge graph built on Vision 2030 structure. Not a static document. A living model that shows what\'s actually happening.',
    image: '/att/landing-screenshots/3_carousel/3.png',
    stat: { valueKey: 'solution.card1StatValue', valueFallback: '285+', labelKey: 'solution.card1StatLabel', labelFallback: 'Connected Nodes' },
  },
  {
    tagKey: 'solution.card2Tag',
    tagFallback: 'The Intelligence',
    titleKey: 'solution.card2Title',
    titleFallback: 'AI That Reads Your Data, Not the Internet',
    descKey: 'solution.card2Desc',
    descFallback: 'Reasoning agents that understand your sector structure and generate actionable intelligence — sector status reports, risk advisories, capacity analysis. In Arabic. From your actual data.',
    image: '/att/landing-screenshots/3_carousel/G.png',
    stat: { valueKey: 'solution.card2StatValue', valueFallback: '100%', labelKey: 'solution.card2StatLabel', labelFallback: 'Arabic-First' },
  },
  {
    tagKey: 'solution.card3Tag',
    tagFallback: 'The Cycle',
    titleKey: 'solution.card3Title',
    titleFallback: 'From Insight to Action in One Place',
    descKey: 'solution.card3Desc',
    descFallback: 'Observe your sector\'s health. Decide on interventions with AI-powered options. Execute with project plans and Gantt timelines. No switching between systems. One continuous loop.',
    image: '/att/landing-screenshots/3_carousel/7.png',
    stat: { valueKey: 'solution.card3StatValue', valueFallback: '3', labelKey: 'solution.card3StatLabel', labelFallback: 'Modes, One Loop' },
  },
];

function CardBlock({
  card,
  reverse,
  isMobile,
  t,
  isVisible,
}: {
  card: SolutionCard;
  reverse: boolean;
  isMobile: boolean;
  t: (key: string, fallback: string) => string;
  isVisible: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : reverse ? 'row-reverse' : 'row',
        gap: isMobile ? '1.25rem' : '2.5rem',
        alignItems: 'center',
        padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem',
        background: 'var(--component-panel-bg)',
        border: `1px solid ${hovered ? 'rgba(244, 187, 48, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
        borderRadius: '20px',
        transition: 'all 0.4s ease, opacity 0.6s ease, transform 0.6s ease',
        boxShadow: hovered ? '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(244, 187, 48, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      }}
    >
      {/* Text side */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 38%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {/* Tag */}
        <span style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gold-muted, rgba(196, 149, 32, 0.8))',
        }}>
          {t(card.tagKey, card.tagFallback)}
        </span>

        {/* Title */}
        <h3 style={{
          fontSize: isMobile ? '20px' : '26px',
          fontWeight: 700,
          color: 'var(--text-primary, #fff)',
          lineHeight: 1.25,
          margin: 0,
        }}>
          {t(card.titleKey, card.titleFallback)}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: isMobile ? '14px' : '15px',
          color: 'var(--text-muted, rgba(255, 255, 255, 0.55))',
          lineHeight: 1.65,
          margin: 0,
        }}>
          {t(card.descKey, card.descFallback)}
        </p>

        {/* Stat */}
        {card.stat && (
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            marginTop: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <span style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: 800,
              color: 'var(--gold-primary, #F4BB30)',
              lineHeight: 1,
            }}>
              {t(card.stat.valueKey, card.stat.valueFallback)}
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted, rgba(255, 255, 255, 0.5))',
              letterSpacing: '0.02em',
            }}>
              {t(card.stat.labelKey, card.stat.labelFallback)}
            </span>
          </div>
        )}
      </div>

      {/* Screenshot side */}
      <div style={{
        flex: isMobile ? 'none' : 1,
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      }}>
        <img
          src={card.image}
          alt={card.titleFallback}
          loading="lazy"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transition: 'transform 0.5s ease',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
          }}
        />
      </div>
    </div>
  );
}

export default function Platform() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCards, setVisibleCards] = useState<boolean[]>(CARDS.map(() => false));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Intersection observer for scroll-reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx !== -1 && entry.isIntersecting) {
            setVisibleCards((prev) => {
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="content-centered" id="platform">
      <div className="section-content-box">
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
          <div className="section-tag">{t('platform.tag', 'The Platform')}</div>
          <h2>{t('solution.title', 'One System. Everything Connected.')}</h2>
          <p className="subtitle" style={{ maxWidth: '600px', marginBottom: '0' }}>
            {t('solution.subtitle', 'No more disconnected dashboards, outdated reports, or flying blind between quarters.')}
          </p>
        </div>

        {/* Stacked solution cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1.25rem' : '2rem',
        }}>
          {CARDS.map((card, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
            >
              <CardBlock
                card={card}
                reverse={i % 2 === 1}
                isMobile={isMobile}
                t={t}
                isVisible={visibleCards[i]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
