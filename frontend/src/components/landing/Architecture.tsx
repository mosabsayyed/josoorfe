import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArchitectureContent } from './types';
import './pyramid.css';

interface ArchitectureProps {
  content: ArchitectureContent;
  language: string;
}

export default function Architecture({ content, language }: ArchitectureProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useTranslation();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <section className="content-centered" id="arch">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="section-tag" style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'var(--component-panel-bg)',
            borderRadius: '20px'
          }}>
            {content.tag}
          </div>
          <h2 style={{ marginBottom: '12px' }}>
            {content.title}
          </h2>
          <p className="subtitle" style={{ maxWidth: '800px' }}
            dangerouslySetInnerHTML={{ __html: content.intro }} />
        </div>

        {/* 3D Flippable Pyramid - this IS the four layers visualization */}
        <div style={{ marginBottom: '12px' }}>
          <div className={`pyr-flip ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="pyr-inner">
              {/* FRONT FACE - 4-layer pyramid */}
              <div className="pyr-face pyr-front">
                <div className="pyr-front-lbl">
                  {t('architecture.pyramidFrontLabel')}
                </div>
                <div className="py-layers">
                  <div className="py-l py-1">
                    <div className="py-n">{t('architecture.pyramid.strategy')}</div>
                    <div className="py-d">{t('architecture.pyramid.strategyDesc')}</div>
                  </div>
                  <div className="py-l py-2">
                    <div className="py-n">{t('architecture.pyramid.sectorOps')}</div>
                    <div className="py-d">{t('architecture.pyramid.sectorOpsDesc')}</div>
                    <div className="py-nodes">
                      {(t('architecture.pyramid.sectorNodes', { returnObjects: true }) as string[]).map((node, i) => (
                        <span key={i} className="py-node">{node}</span>
                      ))}
                    </div>
                  </div>
                  <div className="py-l py-3">
                    <div className="py-n">{t('architecture.pyramid.enterpriseOps')}</div>
                    <div className="py-d">{t('architecture.pyramid.enterpriseOpsDesc')}</div>
                  </div>
                  <div className="py-l py-4">
                    <div className="py-n">{t('architecture.pyramid.projects')}</div>
                    <div className="py-d">{t('architecture.pyramid.projectsDesc')}</div>
                  </div>
                </div>
                <div className="py-flow">
                  <span>{t('architecture.pyramid.statusFlow')}</span>
                  <span>{t('architecture.pyramid.directionFlow')}</span>
                </div>
              </div>

              {/* BACK FACE - Ontology mapping */}
              <div className="pyr-face pyr-back">
                <div className="back-h">{t('architecture.back.header')}</div>

                {/* Row 1: Strategy */}
                <div className="ont-row-label">{t('architecture.back.strategyLayer')}</div>
                <div className="ont-row">
                  <div className="ont-left">
                    {(t('architecture.back.strategyLeft', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-s">{item}</span>
                    ))}
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    {(t('architecture.back.strategyRight', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-s">{item}</span>
                    ))}
                  </div>
                </div>

                {/* Row 2: Sector */}
                <div className="ont-row-label">{t('architecture.back.sectorLayer')}</div>
                <div className="ont-row">
                  <div className="ont-left">
                    {(t('architecture.back.sectorLeft', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-sc">{item}</span>
                    ))}
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    {(t('architecture.back.sectorRight', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-sc">{item}</span>
                    ))}
                  </div>
                </div>

                {/* Bridge: Capabilities */}
                <div style={{ textAlign: 'center', padding: '0.25rem 0' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    color: 'var(--component-text-accent)',
                    letterSpacing: '0.1em',
                    background: 'rgba(244,187,48,0.08)',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(244,187,48,0.2)'
                  }}>
                    {t('architecture.back.capabilitiesBridge')}
                  </span>
                </div>

                {/* Row 3: Enterprise */}
                <div className="ont-row-label">{t('architecture.back.enterpriseLayer')}</div>
                <div className="ont-row">
                  <div className="ont-left">
                    {(t('architecture.back.enterpriseLeft', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-e">{item}</span>
                    ))}
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    {(t('architecture.back.enterpriseRight', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-e">{item}</span>
                    ))}
                  </div>
                </div>

                {/* Row 4: Projects */}
                <div className="ont-row-label">{t('architecture.back.projectsLayer')}</div>
                <div className="ont-row">
                  <div className="ont-left">
                    {(t('architecture.back.projectsLeft', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-p">{item}</span>
                    ))}
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    {(t('architecture.back.projectsRight', { returnObjects: true }) as string[]).map((item, i) => (
                      <span key={i} className="on on-p">{item}</span>
                    ))}
                  </div>
                </div>

                {/* Signal detectors overlay */}
                <div className="sig-overlay">
                  <div className="sig sig-speed">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div className="sig-n">{t('architecture.back.sigSpeed')}</div>
                    <div className="sig-v">{t('architecture.back.sigSpeedDesc')}</div>
                  </div>
                  <div className="sig sig-risk">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div className="sig-n">{t('architecture.back.sigRisk')}</div>
                    <div className="sig-v">{t('architecture.back.sigRiskDesc')}</div>
                  </div>
                  <div className="sig sig-dir">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="16 12 12 8 8 12"/>
                      <line x1="12" y1="16" x2="12" y2="8"/>
                    </svg>
                    <div className="sig-n">{t('architecture.back.sigTrend')}</div>
                    <div className="sig-v">{t('architecture.back.sigTrendDesc')}</div>
                  </div>
                  <div className="sig sig-health">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <div className="sig-n">{t('architecture.back.sigHealth')}</div>
                    <div className="sig-v">{t('architecture.back.sigHealthDesc')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flip hint */}
          <div className="flip-hint">
            {isFlipped
              ? t('architecture.pyramidFlipHintBack')
              : t('architecture.pyramidFlipHintFront')}
          </div>
        </div>

        {/* Engines */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>
            {t('architecture.twinEngines')}
          </h3>
          <div className="eng-row">
            {content.engines.map((engine, i) => (
              <div key={i} className={`eng-c ${i === 0 ? 'build' : 'operate'}`}>
                <h4>{engine.title}</h4>
                <p dangerouslySetInnerHTML={{ __html: engine.desc }} />
              </div>
            ))}
          </div>
        </div>

        {/* KSA Compatibility Badges */}
        <div className="ksa">
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: '1rem', fontSize: '14px', fontWeight: '600' }}>
            {t('architecture.vision2030Compatible')}
          </div>
          <div className="ksa-i">
            <div className="ksa-n">{t('architecture.ksa.adaa')}</div>
            <div className="ksa-d">{t('architecture.ksa.adaaDesc')}</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">{t('architecture.ksa.expro')}</div>
            <div className="ksa-d">{t('architecture.ksa.exproDesc')}</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">{t('architecture.ksa.dga')}</div>
            <div className="ksa-d">{t('architecture.ksa.dgaDesc')}</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">{t('architecture.ksa.etimad')}</div>
            <div className="ksa-d">{t('architecture.ksa.etimadDesc')}</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">{t('architecture.ksa.cog')}</div>
            <div className="ksa-d">{t('architecture.ksa.cogDesc')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
