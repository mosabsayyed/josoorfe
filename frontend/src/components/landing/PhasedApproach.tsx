import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const GOLD = '#F4BB30';
const TEAL = '#145c80';
const BG = '#0B0F1A';
const MUTED = 'rgba(255,255,255,0.55)';

const phases = [
  { num: 1, labelKey: 'phase1Label', descKey: 'phase1Desc', label: 'Assess',    desc: 'Assess Data Landscape, tailor Ontology, define UC-001' },
  { num: 2, labelKey: 'phase2Label', descKey: 'phase2Desc', label: 'Ingest',    desc: 'Ingest Data, build Prompts, publish to closed group' },
  { num: 3, labelKey: 'phase3Label', descKey: 'phase3Desc', label: 'Launch',    desc: 'Launch to broader audience, collect feedback' },
  { num: 4, labelKey: 'closureLabel', descKey: 'closureDesc', label: 'Recommend', desc: 'Recommendations on Roadmap — High Impact Use Cases' },
];

export default function PhasedApproach() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sectionStyle: React.CSSProperties = {
    background: BG,
    padding: '100px 24px',
    fontFamily: "'Inter', 'IBM Plex Sans', sans-serif",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
    textAlign: 'center',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: GOLD,
    border: `1px solid ${GOLD}44`,
    borderRadius: 20,
    padding: '5px 18px',
    marginBottom: 18,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? 28 : 40,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 14px',
    lineHeight: 1.2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: isMobile ? 15 : 18,
    color: MUTED,
    margin: '0 0 60px',
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.6,
  };

  /* ---- timeline layout ---- */
  const timelineWrap: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    gap: isMobile ? 40 : 0,
    padding: isMobile ? '0 12px' : '0',
  };

  /* horizontal gold line (desktop) */
  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 22,
    left: '12%',
    right: '12%',
    height: 2,
    background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}, ${GOLD}, ${GOLD}00)`,
    zIndex: 0,
  };

  /* vertical gold line (mobile) */
  const verticalLineStyle: React.CSSProperties = {
    position: 'absolute',
    left: 21,
    top: 22,
    bottom: 22,
    width: 2,
    background: `linear-gradient(180deg, ${GOLD}00, ${GOLD}, ${GOLD}, ${GOLD}00)`,
    zIndex: 0,
  };

  const nodeWrap: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    alignItems: isMobile ? 'flex-start' : 'center',
    position: 'relative',
    zIndex: 1,
    gap: isMobile ? 16 : 0,
  };

  const circleStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    minWidth: 44,
    borderRadius: '50%',
    background: `radial-gradient(circle at 35% 35%, ${GOLD}, #c89520)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 17,
    fontWeight: 700,
    color: BG,
    boxShadow: `0 0 20px ${GOLD}44`,
  };

  const phaseLabelStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    marginTop: isMobile ? 0 : 14,
  };

  const phaseDescStyle: React.CSSProperties = {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
    lineHeight: 1.5,
    maxWidth: isMobile ? 280 : 200,
    textAlign: isMobile ? 'left' : 'center',
  };

  const emphasisStyle: React.CSSProperties = {
    marginTop: 64,
    fontSize: isMobile ? 18 : 22,
    fontWeight: 600,
    color: GOLD,
    textAlign: 'center',
  };

  const underlineStyle: React.CSSProperties = {
    display: 'block',
    width: 120,
    height: 2,
    background: `${GOLD}66`,
    margin: '10px auto 0',
    borderRadius: 2,
  };

  return (
    <section id="phased-approach" className="content-centered" style={sectionStyle}>
      <div style={innerStyle}>
        {/* tag */}
        <span style={tagStyle}>
          {t('phasedApproach.tag', 'The Journey')}
        </span>

        {/* title */}
        <h2 style={titleStyle}>
          {t('phasedApproach.title', 'From Assessment to Impact in 90 Days')}
        </h2>

        {/* subtitle */}
        <p style={subtitleStyle}>
          {t('phasedApproach.subtitle', 'A proven, tailorable engagement model. No 18-month integration.')}
        </p>

        {/* timeline */}
        <div style={timelineWrap}>
          {!isMobile && <div style={lineStyle} />}
          {isMobile && <div style={verticalLineStyle} />}

          {phases.map((p) => (
            <div key={p.num} style={nodeWrap}>
              {isMobile ? (
                <>
                  <div style={circleStyle}>{p.num}</div>
                  <div>
                    <div style={phaseLabelStyle}>
                      {t(`phasedApproach.${p.labelKey}`, p.label)}
                    </div>
                    <div style={phaseDescStyle}>
                      {t(`phasedApproach.${p.descKey}`, p.desc)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={circleStyle}>{p.num}</div>
                  <div style={phaseLabelStyle}>
                    {t(`phasedApproach.${p.labelKey}`, p.label)}
                  </div>
                  <div style={phaseDescStyle}>
                    {t(`phasedApproach.${p.descKey}`, p.desc)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* emphasis */}
        <div style={emphasisStyle}>
          {t('phasedApproach.emphasis', 'Starts in weeks, not months.')}
          <span style={underlineStyle} />
        </div>
      </div>
    </section>
  );
}
