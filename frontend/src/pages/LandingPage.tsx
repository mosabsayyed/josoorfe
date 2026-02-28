import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';

// Landing page section components
import Hero from '../components/landing/Hero';
import AItoIA from '../components/landing/AItoIA';
import Promise from '../components/landing/Promise';
import Platform from '../components/landing/Platform';
import StrategyHouse from '../components/landing/StrategyHouse';
import BetaForm from '../components/landing/BetaForm';
import useSnapScroll from '../hooks/useSnapScroll';

const SNAP_SECTIONS = ['hero', 'platform', 'promise', 'strategy-house', 'aitoia'];

export default function LandingPage() {
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation();
  useSnapScroll({ sections: SNAP_SECTIONS });

  const content = {
    hero: {
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      subtitleEn: t('hero.subtitleEn'),
      sectors: t('hero.sectors'),
      badge: t('hero.badge'),
      intelligence: (t('hero.intelligence', { returnObjects: true }) as { figure: string; label: string }[]) || [],
      intelligenceTitle: t('hero.intelligenceTitle'),
      intelligenceDesc: t('hero.intelligenceDesc'),
      trust: (t('hero.trust', { returnObjects: true }) as { figure: string; label: string }[]) || [],
      trustTitle: t('hero.trustTitle'),
      trustDesc: t('hero.trustDesc'),
      figures: (t('hero.figures', { returnObjects: true }) as string[]) || [],
    },
    promise: {
      tag: t('promise.tag'),
      title: t('promise.title'),
      subtitle: t('promise.subtitle'),
      personas: (t('promise.personas', { returnObjects: true }) as Array<{ role: string; before: string; after: string }>),
    },
    platform: {
      tag: t('platform.tag'),
      title: t('platform.title'),
      subtitle: t('platform.subtitle'),
      modes: (t('platform.modes', { returnObjects: true }) as Array<{ title: string; desc: string }>),
      twinEnginesLabel: t('architecture.twinEngines'),
      engines: (t('architecture.engines', { returnObjects: true }) as Array<{ title: string; desc: string }>),
    },
    strategyHouse: {
      tag: t('strategyHouse.tag'),
      title: t('strategyHouse.title'),
      subtitle: t('strategyHouse.subtitle'),
      elements: (t('strategyHouse.elements', { returnObjects: true }) as string[]),
      elementDescs: (t('strategyHouse.elementDescs', { returnObjects: true }) as string[]),
    },
    beta: {
      tag: t('beta.tag'),
      title: t('beta.title'),
      subtitle: t('beta.subtitle'),
      note: t('beta.note'),
      form: {
        name: t('beta.form.name'),
        email: t('beta.form.email'),
        org: t('beta.form.org'),
        role: t('beta.form.role'),
        roleOptions: (t('beta.form.roleOptions', { returnObjects: true }) as string[]),
        submit: t('beta.form.submit'),
      },
    },
  };

  // Inject CSS for the landing page
  useEffect(() => {
    const css = `
      /*
       * ============================================================
       *  FONT-SIZE RULE — EVEN INTEGERS ONLY
       * ============================================================
       *  All font-size values in this project MUST be even integers.
       *  Allowed : 12px, 14px, 16px, 18px, 20px, 22px, 24px …
       *  Forbidden: 13px, 15px, 17px, 19px or any decimal (14.5px)
       *
       *  Section header pattern (unified across all landing sections):
       *    Tag      — .section-tag  → 20px  (bold, gold, monospace, uppercase)
       *    Title h2 — .landing-page h2 → 42px  (weight 800)
       *    Subtitle — .subtitle → 18px  (line-height 1.65)
       *
       *  Components MUST use these CSS classes. No inline font overrides.
       * ============================================================
       */

      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&display=swap');

      :root {
        --component-bg-primary: #111827;
        --component-panel-bg: rgba(31, 41, 55, 0.6); /* Glass effect increased */
        --component-panel-border: rgba(255, 255, 255, 0.1);
        --component-text-primary: #F9FAFB;
        --component-text-secondary: #D1D5DB;
        --component-text-muted: #9CA3AF;
        --component-text-accent: #F4BB30;
        --component-text-on-accent: #111827;

        /* Font family variables - matching main site */
        --component-font-family: 'Inter', sans-serif;
        --component-font-heading: 'Inter', sans-serif;
        --component-font-family-ar: 'Cairo', sans-serif;
        --component-font-heading-ar: 'Cairo', sans-serif;
      }

      .landing-page {
        background: var(--component-bg-primary);
        color: var(--component-text-primary);
        font-family: var(--component-font-family);
        line-height: 1.5;
        min-height: 100dvh;
        position: relative;
        overflow-x: hidden;
      }

      /* Arabic font support - matching main site exactly */
      .landing-page[dir="rtl"],
      .landing-page[dir="rtl"] * {
        font-family: var(--component-font-family-ar);
      }

      .landing-page[dir="rtl"] h1,
      .landing-page[dir="rtl"] h2,
      .landing-page[dir="rtl"] h3,
      .landing-page[dir="rtl"] h4,
      .landing-page[dir="rtl"] h5,
      .landing-page[dir="rtl"] h6 {
        font-family: var(--component-font-heading-ar);
      }

      /* Arabic: letter-spacing breaks ligatures (connected letters appear broken) */
      .landing-page[dir="rtl"] * {
        letter-spacing: 0 !important;
        text-transform: none !important;
      }

      .landing-page * {
        box-sizing: border-box;
      }

      /* HERO SECTION */
      .hero-box-figure {
        font-family: 'Inter', sans-serif;
        font-size: clamp(18px, 2.2vw, 28px);
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.02em;
        margin: 0;
      }
      .hero-box-label {
        font-family: 'Inter', sans-serif;
        font-size: clamp(13px, 1.1vw, 15px);
        font-weight: 600;
        text-align: center;
        line-height: 1.3;
        letter-spacing: 0.06em;
        color: rgba(249, 250, 251, 0.55);
        white-space: pre-line;
      }
      [dir="rtl"] .hero-box-figure {
        font-size: clamp(21px, 2.6vw, 32px);
      }
      [dir="rtl"] .hero-box-label {
        font-size: clamp(15px, 1.3vw, 17px);
      }
      .hero-box-title {
        font-family: 'Inter', sans-serif;
        font-size: clamp(15px, 1.4vw, 20px);
        font-weight: 700;
        line-height: 1.15;
        text-align: center;
        margin: 0;
        letter-spacing: -0.01em;
      }
      [dir="rtl"] .hero-box-title {
        font-size: clamp(17px, 1.6vw, 22px);
      }
      .hero-box-desc {
        font-size: clamp(11px, 1vw, 13px);
        font-weight: 500;
        color: rgba(249, 250, 251, 0.85);
        text-align: center;
        line-height: 1.5;
        margin: 0;
        padding: 0 4px;
      }
      .hero-section {
        position: relative;
        width: 100%;
        font-weight: 400;
        justify-content: center;
        overflow-y: auto;
        padding-bottom: 60px;
        flex-direction: row;
        margin-bottom: 0px;
      }

      .hero-background-video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
        /* Fallback gradient if video fails */
        background: radial-gradient(circle at center, #1f2937 0%, #111827 100%);
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(17, 24, 39, 0.5); /* Dimming overlay */
        z-index: 1;
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 800px;
        text-align: left;
        margin-left: 40px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 0 20px;
      }

      @media (max-width: 768px) {
        .hero-content {
          margin-left: 0;
          text-align: center;
          justify-content: center;
        }
      }

      .hero-title {
        font: 48px/67.2px "Inter", sans-serif;
        color: #FFFFFF;
        margin-bottom: 24px;
        text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        width: auto;
        align-self: start;
        text-align: left;
      }

      .hero-subtitle {
        font: 400 20px/1.5 "Inter", sans-serif;
        color: #E5E7EB;
        margin-bottom: 40px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }

      .scroll-indicator {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
        animation: bounce 2s infinite;
        opacity: 0.7;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
        40% {transform: translateX(-50%) translateY(-10px);}
        60% {transform: translateX(-50%) translateY(-5px);}
      }

      #background-image {
        position: absolute;
        top: 85vh; /* Push vector down below hero */
        left: 50%;
        transform: translateX(-50%);
        width: 1278px;
        pointer-events: none;
        z-index: 0;
        display: block;
        opacity: 0.3;
      }

      #main-content {
        position: relative;
        z-index: 1;
        padding-top: 0;
      }

      /* ── AI → IA scroll animation section ── */
      .aitoia-timeline {
        position: relative;
        height: 450vh; /* Extended for BetaForm phase */
      }

      .aitoia-viewer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        display: grid;
        place-items: center;
        z-index: 10;
      }

      .aitoia-canvas {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
      }

      .aitoia-glass {
        position: relative;
        z-index: 2;
        width: min(85vw, 900px);
        max-width: 900px;
        justify-self: center;
        align-self: center;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2);
        display: flex;
        flex-direction: column;
        padding: clamp(20px, 4vw, 50px) clamp(16px, 4vw, 60px);
      }

      .aitoia-glass * { margin: 0; padding: 0; }

      /* Grid container for overlapping AI/IA blocks */
      .aitoia-blocks {
        display: grid;
      }

      /* Section header — always visible, matches other landing sections */
      .aitoia-header {
        text-align: center;
        margin-bottom: 24px;
        position: relative;
        z-index: 3;
      }
      .aitoia-tag {
        font-family: var(--font-mono, monospace);
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--gold-muted, rgba(196, 149, 32, 1));
        display: block;
        margin-bottom: 10px;
      }
      /* h2 and p inside .aitoia-header are styled by
         .landing-page h2 and .subtitle — no duplicate rules needed */

      .aitoia-block {
        grid-area: 1 / 1;
        opacity: 0;
        transition: opacity 0.1s ease-out;
        pointer-events: none;
      }

      .aitoia-glass .aitoia-block h3 {
        font-family: var(--component-font-heading);
        font-size: 2.2rem;
        line-height: 1.15;
        font-weight: 300;
        margin-bottom: 20px;
      }

      .aitoia-glass .aitoia-block li {
        font-family: var(--component-font-family);
        font-size: 1.05rem;
        line-height: 1.6;
        font-weight: 400;
        margin-bottom: 22px;
        list-style: none;
      }

      .aitoia-glass .aitoia-block strong {
        display: block;
        margin-bottom: 6px;
        font-size: 1.15rem;
        font-family: var(--component-font-heading);
      }

      .aitoia-icon {
        display: inline-block;
        margin-inline-end: 8px;
        font-size: 1.1rem;
        vertical-align: middle;
      }

      /* AI text — chaos (muted) */
      .aitoia-glass .aitoia-ai h3 { color: var(--component-text-secondary); font-weight: 300; }
      .aitoia-glass .aitoia-ai strong { color: var(--component-text-accent); }
      .aitoia-glass .aitoia-ai li { color: var(--component-text-primary); border-left: 2px solid var(--component-text-accent); padding-left: 20px; }

      /* IA text — structure (gold accent, monospace) */
      .aitoia-glass .aitoia-ia h3 { color: var(--component-text-accent); font-family: var(--component-font-mono, monospace); text-transform: uppercase; letter-spacing: -1px; font-weight: 700; }
      .aitoia-glass .aitoia-ia strong { color: var(--component-text-accent); font-family: var(--component-font-mono, monospace); }
      .aitoia-glass .aitoia-ia li { color: var(--component-text-primary); border-left: 2px solid var(--component-text-accent); padding-left: 20px; }

      /* RTL support for aitoia */
      /* h2/p RTL fonts handled by .landing-page[dir="rtl"] * rule */
      [dir="rtl"] .aitoia-tag { letter-spacing: 0; }
      [dir="rtl"] .aitoia-glass .aitoia-block h3 { font-family: var(--component-font-heading-ar); }
      [dir="rtl"] .aitoia-glass .aitoia-block li { font-family: var(--component-font-family-ar); }
      [dir="rtl"] .aitoia-glass .aitoia-block strong { font-family: var(--component-font-heading-ar); }
      [dir="rtl"] .aitoia-glass .aitoia-ia h3 { font-family: var(--component-font-heading-ar); text-transform: none; letter-spacing: 0; }
      [dir="rtl"] .aitoia-glass .aitoia-ia strong { font-family: var(--component-font-heading-ar); }

      [dir="rtl"] .aitoia-glass .aitoia-ai li,
      [dir="rtl"] .aitoia-glass .aitoia-ia li {
        border-left: none;
        padding-left: 0;
        border-right: 2px solid var(--component-text-accent);
        padding-right: 20px;
      }
      [dir="rtl"] .aitoia-glass .aitoia-ia li {
        border-right-color: var(--component-text-accent);
      }

      /* ── Challenge 3-column layout ── */
      .challenge-columns {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 24px;
      }
      .challenge-col {
        padding: 24px;
        background: rgba(31, 41, 55, 0.4);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .challenge-col h3 {
        font-size: 22px;
        font-weight: 700;
        color: var(--component-text-accent);
        margin-bottom: 10px;
      }
      .challenge-col p {
        font-size: 18px;
        line-height: 1.6;
        color: var(--component-text-secondary);
        margin: 0;
      }

      @media (max-width: 768px) {
        .challenge-columns {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }

      @media (max-width: 768px) {
        .aitoia-glass {
          width: 92vw;
          padding: 20px 16px;
          /* Reduce glass opacity so canvas animation shows through */
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        /* Hide 96x96px icons on mobile to save space */
        .aitoia-bullet-icon {
          display: none !important;
        }

        /* h2 size handled by .landing-page h2 — no override needed */
        .aitoia-glass .aitoia-block h3 {
          font-size: 1.2rem;
        }
        .aitoia-glass .aitoia-block li {
          font-size: 0.85rem;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .aitoia-glass .aitoia-block strong {
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        .aitoia-tag {
          font-size: 14px;
        }
      }

      section {
        padding: 1rem 1rem;  /* Mobile-first: 320px phones get 288px content */
        position: relative;
        background: transparent;
      }

      @media (min-width: 480px) {
        section {
          padding: 1.5rem 1.5rem;  /* Small tablets: more breathing room */
        }
      }

      @media (min-width: 768px) {
        section {
          padding: 2rem 2rem;  /* Desktop: full padding */
        }
      }

      section.content-centered {
        max-width: 1100px;
        margin: 0 auto;
      }

      .section-content-box {
        background-color: var(--component-panel-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 12px;
        border-radius: 16px;
        border: 1px solid var(--component-panel-border);
        display: inline-block;
        width: 100%;
        transition: transform 0.3s ease;
      }

      .section-grid {
        display: grid;
        gap: 16px;
        align-items: center;
        grid-template-columns: 1fr 1fr;
      }

      .landing-page h1 {
        font: 700 56px/1.2 "Inter", sans-serif;
        color: var(--component-text-primary);
        margin-bottom: 24px;
      }

      /* ── Section tag (gold monospace label above every section title) ── */
      .section-tag {
        font-family: var(--font-mono, monospace);
        font-size: clamp(14px, 1.5vw, 16px);
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--gold-muted, rgba(196, 149, 32, 1));
        margin-bottom: 12px;
      }

      .landing-page h2 {
        font-size: clamp(28px, 4vw, 42px); /* Unified — see FONT-SIZE RULE */
        font-weight: 800;
        line-height: 1.2;
        color: var(--component-text-primary);
        margin-bottom: 10px;
      }

      .subtitle {
        font-size: clamp(16px, 2vw, 18px);
        line-height: 1.65;
        font-weight: 400;
        color: var(--component-text-secondary);
        max-width: 700px;
        margin: 0 auto;
      }

      .screenshot-container {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        /* Removed background color to ensure transparency */
        background: transparent; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
      }
      
      .screenshot-container:hover {
        transform: translateY(-5px);
      }

      .screenshot-container img {
        width: 100%;
        height: auto;
        display: block;
      }

      .microcopy-bullets, .value-bullets {
        list-style: none;
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px; 
      }

      .microcopy-bullets li, .value-bullets li {
        font: 400 16px/24px "Inter", sans-serif; /* Slightly larger text */
        color: var(--component-text-secondary);
        padding-left: 28px;
        padding-right: 0;
        position: relative;
      }
      
      /* RTL support for bullets */
      [dir="rtl"] .microcopy-bullets li, [dir="rtl"] .value-bullets li {
        padding-left: 0;
        padding-right: 28px;
      }

      .microcopy-bullets li:before {
        content: "→";
        position: absolute;
        left: 0;
        color: var(--component-text-accent);
        font-weight: 600;
        font-size: 18px;
      }
      
      [dir="rtl"] .microcopy-bullets li:before {
        left: auto;
        right: 0;
        content: "←";
      }

      .value-bullets li:before {
        content: "✓";
        position: absolute;
        left: 0;
        color: var(--component-text-accent);
        font-weight: 600;
        font-size: 18px;
      }
      
      [dir="rtl"] .value-bullets li:before {
        left: auto;
        right: 0;
      }

      .three-panel-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 40px;
      }

      .panel {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        background: transparent;
      }

      .panel img {
        width: 100%;
        height: auto;
        display: block;
      }

      .panel-caption {
        font: 600 14px/20px "Inter", sans-serif;
        color: var(--component-text-accent);
        padding: 12px 0;
        margin-top: 8px;
      }

      .panel-description {
        font: 400 13px/20px "Inter", sans-serif;
        color: var(--component-text-secondary);
        margin-top: 6px;
        line-height: 1.6;
      }

      .architecture-callouts {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
        margin-top: 40px;
      }

      .callout {
        padding: 24px;
        background: rgba(31, 41, 55, 0.5);
        border-left: 3px solid var(--component-text-accent);
        border-radius: 6px;
      }
      
      [dir="rtl"] .callout {
        border-left: none;
        border-right: 3px solid var(--component-text-accent);
      }

      .callout-label {
        font: 600 14px/20px "Inter", sans-serif;
        color: var(--component-text-accent);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .callout-text {
        font: 400 13px/20px "Inter", sans-serif;
        color: var(--component-text-secondary);
        line-height: 1.6;
      }

      /* Form Styles */
      .invite-form {
        background: rgba(31, 41, 55, 0.5);
        border: 1px solid var(--component-panel-border);
        border-radius: 12px;
        padding: 40px;
        margin-top: 40px;
        display: grid;
        gap: 20px;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        text-align: left;
      }
      
      [dir="rtl"] .form-group {
        text-align: right;
      }

      .form-group label {
        font: 600 13px/18px "Inter", sans-serif;
        color: var(--component-text-primary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .form-group input, .form-group select {
        padding: 12px 16px;
        background: rgba(17, 24, 39, 0.8);
        border: 1px solid var(--component-panel-border);
        border-radius: 6px;
        color: var(--component-text-primary);
        font: 400 14px/20px "Inter", sans-serif;
        transition: all 0.2s ease;
      }

      .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: var(--component-text-accent);
        background: rgba(31, 41, 55, 0.9);
        box-shadow: 0 0 12px rgba(244, 187, 48, 0.2);
      }

      .button-primary {
        display: inline-block;
        padding: 14px 32px;
        background: var(--component-text-accent);
        color: var(--component-text-on-accent);
        border: none;
        border-radius: 6px;
        font: 600 16px/20px "Inter", sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        width: 100%;
        text-align: center;
      }

      .button-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(244, 187, 48, 0.3);
      }

      @media (max-width: 1024px) {
        .section-grid, .three-panel-strip, .architecture-callouts {
          grid-template-columns: 1fr;
        }
        h1 { font-size: 40px; line-height: 48px; }
        .hero-title { font-size: 40px; }
      }

      /* ══════════════════════════════════════════════════════
         MOBILE RESPONSIVE DESIGN
         ══════════════════════════════════════════════════════ */

      @media (max-width: 375px) {
        /* Extra small phones */
        section {
          padding: 0.75rem 0.5rem;
        }

        .landing-page h1 {
          font-size: 24px;
        }

        .landing-page h2 {
          font-size: 26px;
        }

        .subtitle {
          font-size: 15px;
        }

        .section-tag {
          font-size: 13px;
          letter-spacing: 0.06em;
        }

        .hero-title {
          font-size: 28px !important;
        }

        .hero-subtitle {
          font-size: 14px !important;
        }

        .hero-brand {
          padding: 0.8rem 1.2rem !important;
        }

        .hero-brand img {
          height: 50px !important;
        }

        .hb-name {
          font-size: 14px !important;
          letter-spacing: 0.25em;
        }

        .aitoia-tag {
          font-size: 12px;
        }

        .aitoia-glass {
          padding: 16px 12px !important;
        }

        .aitoia-glass .aitoia-block li {
          font-size: 0.8rem !important;
        }

        .aitoia-glass .aitoia-block strong {
          font-size: 0.85rem !important;
        }
      }

      @media (max-width: 480px) {
        /* Small phones */
        .three-panel-strip {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .architecture-callouts {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }

      @media (max-width: 768px) {
        /* Tablets and large phones */
        section.content-centered {
          max-width: 100%;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 70px 1rem 1rem;
          box-sizing: border-box;
          overflow: visible;
        }

        #arch, #beta {
          min-height: auto;
          padding-top: 70px;
          overflow: visible;
        }

        .section-content-box {
          padding: 8px;
          border-radius: 12px;
        }

        /* Global word-wrap to prevent text overflow */
        .landing-page * {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .landing-page h1 {
          font-size: 28px;
          line-height: 1.2;
        }

        .landing-page h2 {
          font-size: 28px;
        }

        .subtitle {
          font-size: 16px;
          line-height: 1.5;
        }

        .section-tag {
          font-size: 14px;
          letter-spacing: 0.08em;
        }

        /* Hero section mobile adjustments */
        .hero-overlay {
          /* Lighter overlay so Sparkle background shows through */
          background: radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(17, 24, 39, 0.4) 70%, var(--component-bg-primary, #111827) 95%), linear-gradient(180deg, transparent 60%, var(--component-bg-primary, #111827) 100%) !important;
        }

        .hero-title {
          font-size: 32px;
        }

        .hero-subtitle {
          font-size: 16px;
        }

        /* Hero brand box */
        .hero-brand {
          padding: 1rem 1.5rem !important;
        }

        .hero-brand img {
          height: 60px !important;
        }

        .hb-name {
          font-size: 16px !important;
        }

        .invite-form {
          padding: 20px 16px;
        }

        #background-image {
          display: none;
        }

        .three-panel-strip,
        .architecture-callouts {
          grid-template-columns: 1fr;
        }

        /* Touch targets - minimum 44px */
        button,
        .button-primary,
        a[role="button"] {
          min-height: 44px;
          min-width: 44px;
        }

        .platform-mockup-card {
          max-height: 400px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="landing-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <Hero content={content.hero} language={language} />

      <img id="background-image" src="/att/landing-screenshots/Vector.svg" alt="" />

      <div id="main-content">
        <Platform content={content.platform} />
        <Promise content={content.promise} />
        <StrategyHouse content={content.strategyHouse} />
        
        {/* Integrating AItoIA as an entry ramp to BetaForm */}
        <AItoIA betaContent={content.beta} language={language} footerRights={t('footer.rights')} />

        {/* Architecture hidden — twin engines moved to Platform, badges to Strategy House */}


      </div>
    </div>
  );
}
