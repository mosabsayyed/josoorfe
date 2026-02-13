import React, { useState } from 'react';
import { ArchitectureContent } from './types';
import './pyramid.css';

interface ArchitectureProps {
  content: ArchitectureContent;
  language: string;
}

export default function Architecture({ content, language }: ArchitectureProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <section className="content-centered">
      <div className="section-content-box">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'var(--component-panel-bg)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '1px',
            marginBottom: '20px'
          }}>
            {content.tag}
          </div>
          <h2>{content.title}</h2>
          <p className="subtitle" style={{ maxWidth: '800px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: content.intro }} />
        </div>

        {/* Layers */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '30px', textAlign: 'center' }}>
            {language === 'en' ? 'Four Layers' : 'أربع طبقات'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {content.layers.map((layer, i) => (
              <div key={i} style={{
                padding: '25px',
                background: 'var(--component-panel-bg)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--component-text-accent)',
                  marginBottom: '10px'
                }}>
                  L{i + 1}: {layer.name}
                </div>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Flippable Pyramid */}
        <div style={{ marginBottom: '60px' }}>
          <div className={`pyr-flip ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="pyr-inner">
              {/* FRONT FACE - 4-layer pyramid */}
              <div className="pyr-face pyr-front">
                <div className="pyr-front-lbl">
                  {language === 'en'
                    ? 'Your organization\'s data — click to see what Josoor builds behind it'
                    : 'بيانات مؤسستك — انقر لترى ما يبنيه جسور خلفها'}
                </div>
                <div className="py-layers">
                  <div className="py-l py-1">
                    <div className="py-n">Strategy</div>
                    <div className="py-d">Objectives, KPIs</div>
                  </div>
                  <div className="py-l py-2">
                    <div className="py-n">Sector Operations</div>
                    <div className="py-d">Your value chain</div>
                    <div className="py-nodes">
                      <span className="py-node">Policy Tools</span>
                      <span className="py-node">Performance</span>
                      <span className="py-node">Admin Records</span>
                      <span className="py-node">Data TXNs</span>
                      <span className="py-node">Businesses</span>
                      <span className="py-node">Citizens</span>
                    </div>
                  </div>
                  <div className="py-l py-3">
                    <div className="py-n">Enterprise Operations</div>
                    <div className="py-d">Org, Process, Systems, Vendors</div>
                  </div>
                  <div className="py-l py-4">
                    <div className="py-n">Projects Portfolio</div>
                    <div className="py-d">Closing capability gaps</div>
                  </div>
                </div>
                <div className="py-flow">
                  <span>↑ Status</span>
                  <span>Direction ↓</span>
                </div>
              </div>

              {/* BACK FACE - Ontology mapping */}
              <div className="pyr-face pyr-back">
                <div className="back-h">Josoor's Enterprise Ontology — mapped to your layers</div>

                {/* Row 1: Strategy */}
                <div className="ont-row-label">Strategy Layer</div>
                <div className="ont-row">
                  <div className="ont-left">
                    <span className="on on-s">Objectives</span>
                    <span className="on on-s">KPIs</span>
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    <span className="on on-s">Adaa Targets</span>
                    <span className="on on-s">V2030 Goals</span>
                  </div>
                </div>

                {/* Row 2: Sector */}
                <div className="ont-row-label">Sector Layer</div>
                <div className="ont-row">
                  <div className="ont-left">
                    <span className="on on-sc">Policy Tools</span>
                    <span className="on on-sc">Performance</span>
                    <span className="on on-sc">Admin Records</span>
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    <span className="on on-sc">Data TXNs</span>
                    <span className="on on-sc">Businesses</span>
                    <span className="on on-sc">Citizens</span>
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
                    ↑ CAPABILITIES ↓ the bridge
                  </span>
                </div>

                {/* Row 3: Enterprise */}
                <div className="ont-row-label">Enterprise Layer</div>
                <div className="ont-row">
                  <div className="ont-left">
                    <span className="on on-e">Org Units</span>
                    <span className="on on-e">Processes</span>
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    <span className="on on-e">IT Systems</span>
                    <span className="on on-e">Vendors</span>
                  </div>
                </div>

                {/* Row 4: Projects */}
                <div className="ont-row-label">Projects Layer</div>
                <div className="ont-row">
                  <div className="ont-left">
                    <span className="on on-p">Projects</span>
                    <span className="on on-p">Milestones</span>
                  </div>
                  <div className="ont-mid">
                    <div className="ont-mid-line">↔</div>
                  </div>
                  <div className="ont-right">
                    <span className="on on-p">Risks</span>
                    <span className="on on-p">Dependencies</span>
                  </div>
                </div>

                {/* Signal detectors overlay */}
                <div className="sig-overlay">
                  <div className="sig sig-speed">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div className="sig-n">Speed</div>
                    <div className="sig-v">Delivery Velocity</div>
                  </div>
                  <div className="sig sig-risk">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div className="sig-n">Risk</div>
                    <div className="sig-v">Proactive Foresight</div>
                  </div>
                  <div className="sig sig-dir">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="16 12 12 8 8 12"/>
                      <line x1="12" y1="16" x2="12" y2="8"/>
                    </svg>
                    <div className="sig-n">Trend</div>
                    <div className="sig-v">Early Warning</div>
                  </div>
                  <div className="sig sig-health">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <div className="sig-n">Health</div>
                    <div className="sig-v">Culture Pulse</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flip hint */}
          <div className="flip-hint">
            {isFlipped
              ? (language === 'en' ? 'Click to see your data layers' : 'انقر لرؤية طبقات بياناتك')
              : (language === 'en' ? 'Click the pyramid to see Josoor\'s ontology behind it' : 'انقر على الهرم لرؤية بنية جسور خلفه')}
          </div>
        </div>

        {/* Engines */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '30px', textAlign: 'center' }}>
            {language === 'en' ? 'Twin Engines' : 'محركات التوأم'}
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
            Vision 2030 Compatible
          </div>
          <div className="ksa-i">
            <div className="ksa-n">Adaa</div>
            <div className="ksa-d">Quarterly KPIs</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">EXPRO</div>
            <div className="ksa-d">Project Standards</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">DGA</div>
            <div className="ksa-d">Digital Maturity</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">Etimad</div>
            <div className="ksa-d">Budget Tracking</div>
          </div>
          <div className="ksa-i">
            <div className="ksa-n">CoG</div>
            <div className="ksa-d">KPI cascade</div>
          </div>
        </div>
      </div>
    </section>
  );
}
