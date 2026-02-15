import React, { useState } from 'react';
import '../../styles/landing.css';

interface LandingNavProps {
  language: string;
}

export default function LandingNav({ language }: LandingNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const t = {
    logo: 'Josoor',
    links: language === 'en'
      ? ['Signal', 'Why Us', 'Promise', 'Platform', 'Architecture']
      : ['إشارة', 'لماذا نحن', 'الوعد', 'المنصة', 'البنية'],
    cta: language === 'en' ? 'Apply for Beta' : 'تقدم للنسخة التجريبية'
  };

  const sections = ['aitoia', 'claims', 'promise', 'platform', 'arch'];

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0.85rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(17, 24, 39, 0.6)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      <div style={{
        fontWeight: 800,
        fontSize: '14px',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'var(--gold-primary, #F4BB30)'
      }}>
        {t.logo}
      </div>

      <ul className={`landing-nav-links${mobileOpen ? ' mobile-open' : ''}`} style={{
        display: 'flex',
        gap: '2rem',
        listStyle: 'none',
        margin: 0,
        padding: 0
      }}>
        {mobileOpen && (
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
        {t.links.map((label, i) => (
          <li key={i}>
            <a
              onClick={() => scrollToSection(sections[i])}
              style={{
                fontSize: '14px',
                color: 'var(--text-muted, #808894)',
                textDecoration: 'none',
                letterSpacing: '0.03em',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gold-primary, #F4BB30)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #808894)'}
            >
              {label}
            </a>
          </li>
        ))}
        {mobileOpen && (
          <li>
            <a
              onClick={() => scrollToSection('beta')}
              style={{
                fontSize: '20px',
                color: 'var(--gold-primary, #F4BB30)',
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {t.cta}
            </a>
          </li>
        )}
      </ul>

      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      <a
        className="landing-nav-cta"
        onClick={() => scrollToSection('beta')}
        style={{
          fontSize: '12px',
          padding: '0.45rem 1.3rem',
          border: '1px solid var(--gold-muted, rgba(196, 149, 32, 1))',
          borderRadius: '999px',
          color: 'var(--gold-primary, #F4BB30)',
          textDecoration: 'none',
          transition: 'all 0.2s',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          fontWeight: 600,
          background: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(244, 187, 48, 0.06)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(244,187,48,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {t.cta}
      </a>
    </nav>
  );
}
