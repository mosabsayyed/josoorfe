import React from 'react';
import { NoNoiseContent } from './types';
import './noise-animation.css';

interface NoNoiseProps {
  content: NoNoiseContent;
}

export default function NoNoise({ content }: NoNoiseProps) {
  return (
    <section className="content-centered">
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        {/* Title - matching v10 style */}
        <h2 style={{
          fontFamily: 'var(--font-heading, "IBM Plex Sans")',
          fontSize: '48px',
          fontWeight: 800,
          marginBottom: '16px'
        }}>
          {content.title}
        </h2>

        {/* Subtitle - proper spacing */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.65',
          margin: '0 auto 40px',
          maxWidth: '700px',
          color: 'var(--component-text-secondary)'
        }}>
          {content.subtitle}
        </p>

        {/* Signal convergence animation - from v10 */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          height: '200px',
          margin: '0 auto'
        }}>
          <svg width="100%" height="100%" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet">
            {/* Left label - enforcing 14px minimum */}
            <text x="18" y="20" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              fill: 'var(--component-text-muted)',
              textAnchor: 'start'
            }}>
              scattered inputs
            </text>

            {/* Noisy input lines - 7 curved paths */}
            <path
              className="sig-line"
              d="M 30,30 C 80,10 100,55 140,45 C 180,35 200,60 240,50 C 280,40 310,55 360,70 C 400,80 430,85 470,90 L 520,90"
              fill="none"
              stroke="var(--error)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              className="sig-line"
              d="M 30,55 C 70,75 110,30 150,65 C 190,100 220,40 260,70 C 300,100 330,75 370,80 C 410,85 440,88 470,90 L 520,90"
              fill="none"
              stroke="var(--component-text-accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              className="sig-line"
              d="M 30,80 C 60,60 100,110 150,85 C 200,60 230,105 270,90 C 310,75 350,95 390,88 C 420,84 450,90 470,90 L 520,90"
              fill="none"
              stroke="var(--info)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              className="sig-line"
              d="M 30,105 C 75,130 120,70 160,110 C 200,150 240,80 280,100 C 320,120 350,90 390,92 C 430,94 450,91 470,90 L 520,90"
              fill="none"
              stroke="#9b7af7"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              className="sig-line"
              d="M 30,130 C 80,110 110,145 160,125 C 210,105 240,140 280,115 C 320,90 360,100 400,93 C 440,87 460,90 470,90 L 520,90"
              fill="none"
              stroke="var(--success)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              className="sig-line"
              d="M 30,148 C 70,155 120,120 170,140 C 220,160 250,110 290,120 C 330,130 370,100 410,95 C 440,92 460,91 470,90 L 520,90"
              fill="none"
              stroke="#1a7aa8"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              className="sig-line"
              d="M 30,165 C 80,140 130,170 180,150 C 230,130 260,155 300,130 C 340,105 380,108 420,96 C 450,90 460,90 470,90 L 520,90"
              fill="none"
              stroke="var(--component-text-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />

            {/* Clean output line */}
            <path
              d="M 470,90 L 580,90"
              fill="none"
              stroke="var(--component-text-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(244,187,48,0.4))' }}
            />

            {/* Convergence point with pulsing animation */}
            <circle
              className="sig-dot-animated"
              cx="470"
              cy="90"
              r="5"
              fill="var(--component-text-accent)"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(244,187,48,0.6))'
              }}
            />

            {/* Right label - enforcing 14px minimum */}
            <text x="580" y="86" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              fill: 'var(--component-text-accent)',
              textAnchor: 'start',
              fontWeight: 600
            }}>
              one signal
            </text>
          </svg>
        </div>

        {/* Swagger text - v10 style */}
        <p style={{
          fontSize: '28px',
          fontWeight: 800,
          lineHeight: '1.3',
          marginTop: '48px',
          fontFamily: 'var(--font-heading, "IBM Plex Sans")',
          color: 'var(--component-text-primary)'
        }}>
          {content.swagger}
        </p>

        {/* Closing text */}
        <p style={{
          marginTop: '32px',
          fontSize: '16px',
          lineHeight: '1.65',
          color: 'var(--component-text-secondary)'
        }}>
          {content.closing}
        </p>
      </div>
    </section>
  );
}
