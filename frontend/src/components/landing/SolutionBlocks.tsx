import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Each block has a different visual treatment to break monotony:
 *   - "stat"  → big gold number + label on the accent side
 *   - "list"  → bullet list on the accent side
 *   - "quote" → pull-quote style on the accent side
 */
type BlockAccent = 'stat' | 'list' | 'quote';

interface EvidenceLink {
  labelKey: string;
  captionKey: string;
  image: string;
}

interface BlockDef {
  id: string;
  accent: BlockAccent;
  borderAlpha: number;
  footnoteKey?: string;
  evidence?: EvidenceLink[];
}

const BLOCK_DEFS: BlockDef[] = [
  {
    id: 'block1',
    accent: 'list',
    borderAlpha: 0.3,
    evidence: [
      { labelKey: 'solution.block1Ev1Label', captionKey: 'solution.block1Ev1Caption', image: '/att/landing-screenshots/3_carousel/2.png' },
      { labelKey: 'solution.block1Ev2Label', captionKey: 'solution.block1Ev2Caption', image: '/att/landing-screenshots/3_carousel/3.png' },
      { labelKey: 'solution.block1Ev3Label', captionKey: 'solution.block1Ev3Caption', image: '/att/landing-screenshots/3_carousel/G.png' },
    ],
  },
  {
    id: 'block2',
    accent: 'quote',
    borderAlpha: 0.2,
    evidence: [
      { labelKey: 'solution.block2Ev1Label', captionKey: 'solution.block2Ev1Caption', image: '/att/landing-screenshots/3_carousel/observeability.png' },
    ],
  },
  { id: 'block3', accent: 'list',  borderAlpha: 0.15, footnoteKey: 'solution.block3Footnote' },
  { id: 'block4', accent: 'stat',  borderAlpha: 0.25 },
  { id: 'block5', accent: 'list',  borderAlpha: 0.35 },
];

/* ── Lightbox ── */

function Lightbox({
  image,
  caption,
  onClose,
}: {
  image: string;
  caption: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1000px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          cursor: 'default',
        }}
      >
        <img
          src={image}
          alt={caption}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: '12px',
            border: '1px solid rgba(244, 187, 48, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        />
        {caption && (
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '15px',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {caption}
          </p>
        )}
        <button
          onClick={onClose}
          style={{
            alignSelf: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            padding: '8px 24px',
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '4px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ── Evidence links row ── */

function EvidenceLinks({
  evidence,
  t,
  onOpen,
}: {
  evidence: EvidenceLink[];
  t: (key: string) => string;
  onOpen: (image: string, caption: string) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px',
    }}>
      {evidence.map((ev, i) => (
        <button
          key={i}
          onClick={() => onOpen(ev.image, t(ev.captionKey))}
          style={{
            background: 'rgba(244, 187, 48, 0.06)',
            border: '1px solid rgba(244, 187, 48, 0.2)',
            borderRadius: '8px',
            padding: '6px 14px',
            color: '#F4BB30',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 187, 48, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(244, 187, 48, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(244, 187, 48, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(244, 187, 48, 0.2)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="#F4BB30" strokeWidth="1.2" />
            <path d="M4 9l2-2.5L8 9l2-3" stroke="#F4BB30" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(ev.labelKey)}
        </button>
      ))}
    </div>
  );
}

/* ── Accent panel renderers ── */

function StatAccent({ value, label, isMobile }: { value: string; label: string; isMobile: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem',
      background: 'rgba(244, 187, 48, 0.04)',
      border: '1px solid rgba(244, 187, 48, 0.12)',
      borderRadius: '14px',
      minHeight: isMobile ? 'auto' : '140px',
    }}>
      <span style={{
        fontSize: isMobile ? '36px' : '48px',
        fontWeight: 800,
        color: '#F4BB30',
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: isMobile ? '13px' : '14px',
        fontWeight: 600,
        color: 'rgba(244, 187, 48, 0.7)',
        textAlign: 'center',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
    </div>
  );
}

function ListAccent({ items, isMobile }: { items: Array<{ bold: string; text: string }>; isMobile: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '10px' : '14px',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <span style={{
            flexShrink: 0,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(244, 187, 48, 0.12)',
            border: '1px solid rgba(244, 187, 48, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#F4BB30',
            marginTop: '2px',
          }}>
            {i + 1}
          </span>
          <div>
            <strong style={{
              color: 'var(--component-text-primary, #F9FAFB)',
              fontWeight: 600,
              fontSize: isMobile ? '14px' : '15px',
            }}>
              {item.bold}
            </strong>{' '}
            <span style={{
              color: 'var(--component-text-secondary, #D1D5DB)',
              fontSize: isMobile ? '14px' : '15px',
              lineHeight: 1.6,
            }}>
              {item.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuoteAccent({ text, isMobile }: { text: string; isMobile: boolean }) {
  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '1rem 1.25rem' : '1.5rem 2rem',
      background: 'rgba(244, 187, 48, 0.03)',
      borderInlineStart: '3px solid rgba(244, 187, 48, 0.4)',
      borderRadius: '0 12px 12px 0',
    }}>
      <p style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: 500,
        fontStyle: 'italic',
        color: 'var(--component-text-primary, #F9FAFB)',
        lineHeight: 1.7,
        margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}

/* ── Block card ── */

function BlockCard({
  def,
  isMobile,
  t,
  isVisible,
  onOpenLightbox,
}: {
  def: BlockDef;
  isMobile: boolean;
  t: (key: string, options?: object) => string;
  isVisible: boolean;
  onOpenLightbox: (image: string, caption: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const prefix = `solution.${def.id}`;

  const listItems = def.accent === 'list'
    ? (t(`${prefix}List`, { returnObjects: true }) as unknown as Array<{ bold: string; text: string }>)
    : null;

  const quoteText = def.accent === 'quote' ? t(`${prefix}Quote`) : '';
  const footnote = def.footnoteKey ? t(def.footnoteKey) : '';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '1.5rem 1.25rem' : '2.5rem 3rem',
        background: 'var(--component-panel-bg)',
        border: `1px solid ${hovered ? 'rgba(244, 187, 48, 0.18)' : 'rgba(255, 255, 255, 0.06)'}`,
        borderTop: `3px solid rgba(244, 187, 48, ${hovered ? Math.min(def.borderAlpha + 0.2, 0.6) : def.borderAlpha})`,
        borderRadius: '4px 4px 16px 16px',
        transition: 'all 0.4s ease, opacity 0.7s ease, transform 0.7s ease',
        boxShadow: hovered
          ? '0 12px 40px rgba(0, 0, 0, 0.3)'
          : '0 2px 12px rgba(0, 0, 0, 0.1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {/* Row: question + accent */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1.25rem' : '2.5rem',
        alignItems: 'stretch',
      }}>
        {/* Main: number + question + answer */}
        <div style={{
          flex: isMobile ? 'none' : '1 1 55%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(244, 187, 48, 0.75)',
          }}>
            {t(`${prefix}Num`)}
          </span>

          <h3 style={{
            fontSize: isMobile ? '22px' : '26px',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.25,
            margin: 0,
          }}>
            {t(`${prefix}Question`)}
          </h3>

          <p style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 400,
            color: 'var(--component-text-secondary, #D1D5DB)',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {t(`${prefix}Answer`)}
          </p>

          {/* Evidence screenshot links */}
          {def.evidence && def.evidence.length > 0 && (
            <EvidenceLinks evidence={def.evidence} t={t} onOpen={onOpenLightbox} />
          )}
        </div>

        {/* Accent panel */}
        <div style={{
          flex: isMobile ? 'none' : '1 1 45%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {def.accent === 'stat' && (
            <StatAccent
              value={t(`${prefix}StatValue`)}
              label={t(`${prefix}StatLabel`)}
              isMobile={isMobile}
            />
          )}
          {def.accent === 'list' && listItems && Array.isArray(listItems) && (
            <ListAccent items={listItems} isMobile={isMobile} />
          )}
          {def.accent === 'quote' && (
            <QuoteAccent text={quoteText} isMobile={isMobile} />
          )}
        </div>
      </div>

      {/* Footnote */}
      {footnote && (
        <p style={{
          fontSize: '13px',
          color: 'var(--component-text-muted, #9CA3AF)',
          marginTop: '12px',
          marginBottom: 0,
          opacity: 0.7,
          textAlign: 'start',
        }}>
          {footnote}
        </p>
      )}
    </div>
  );
}

/* ── Main section ── */

export default function SolutionBlocks() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCards, setVisibleCards] = useState<boolean[]>(BLOCK_DEFS.map(() => false));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lightbox, setLightbox] = useState<{ image: string; caption: string } | null>(null);

  const openLightbox = useCallback((image: string, caption: string) => {
    setLightbox({ image, caption });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
      { threshold: 0.1 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="content-centered" id="platform">
        <div className="section-content-box">
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
            <div className="section-tag">{t('solution.tag', 'Challenges & Opportunities')}</div>
            <h2>{t('solution.title', 'Five Questions. Clear Answers.')}</h2>
            <p className="subtitle" style={{ maxWidth: '640px', marginBottom: '0' }}>
              {t('solution.subtitle', 'Before adopting any AI system, every leader asks the same questions. Here are ours — with nothing hidden.')}
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.5rem',
          }}>
            {BLOCK_DEFS.map((def, i) => (
              <div
                key={def.id}
                ref={(el) => { cardRefs.current[i] = el; }}
              >
                <BlockCard
                  def={def}
                  isMobile={isMobile}
                  t={t}
                  isVisible={visibleCards[i]}
                  onOpenLightbox={openLightbox}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox overlay */}
      {lightbox && (
        <Lightbox
          image={lightbox.image}
          caption={lightbox.caption}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
