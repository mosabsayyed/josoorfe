import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabaseClient';

// Landing page section components
import Hero from '../components/landing/Hero';
import NoNoise from '../components/landing/NoNoise';
import Claims from '../components/landing/Claims';
import Promise from '../components/landing/Promise';
import Platform from '../components/landing/Platform';
import Architecture from '../components/landing/Architecture';
import BetaForm from '../components/landing/BetaForm';

export default function LandingPage() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const richFullName = `${formData.name} | Org: ${formData.organization} | Role: ${formData.role}`;

      const { data, error} = await supabase
        .from('users_pending')
        .insert([
          {
            email: formData.email,
            password: 'pending-approval-' + Date.now(),
            full_name: richFullName,
            role: 'user',
            is_active: false
          }
        ]);

      if (error) throw error;

      alert(t('beta.alertSuccess'));
      setFormData({ name: '', email: '', organization: '', role: '' });

    } catch (err: any) {
      console.error('Registration error:', err);
      alert(t('beta.errorSubmit'));
    }
  };

  const content = {
    hero: {
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      badge: t('hero.badge'),
    },
    noNoise: {
      title: t('noNoise.title'),
      subtitle: t('noNoise.subtitle'),
      swagger: t('noNoise.swagger'),
      closing: t('noNoise.closing'),
    },
    claims: {
      tag: t('claims.tag'),
      title: t('claims.title'),
      subtitle: t('claims.subtitle'),
      items: (t('claims.items', { returnObjects: true }) as string[]),
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
    },
    architecture: {
      tag: t('architecture.tag'),
      title: t('architecture.title'),
      intro: t('architecture.intro'),
      layers: [],
      engines: (t('architecture.engines', { returnObjects: true }) as Array<{ title: string; desc: string }>),
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700&display=swap');

      :root {
        --component-bg-primary: #111827;
        --component-panel-bg: rgba(31, 41, 55, 0.6); /* Glass effect increased */
        --component-panel-border: rgba(255, 255, 255, 0.1);
        --component-text-primary: #F9FAFB;
        --component-text-secondary: #D1D5DB;
        --component-text-muted: #9CA3AF;
        --component-text-accent: var(--component-text-accent);
        --component-text-on-accent: #111827;

        /* Font family variables - matching main site */
        --component-font-family: 'Inter', sans-serif;
        --component-font-heading: 'Inter', sans-serif;
        --component-font-family-ar: 'Tajawal', sans-serif;
        --component-font-heading-ar: 'Cairo', sans-serif;
      }

      html, body {
        overflow-y: auto !important; /* FORCE SCROLLING */
        height: auto !important;
        min-height: 100dvh;
      }

      .landing-page {
        background: var(--component-bg-primary);
        color: var(--component-text-primary);
        font-family: var(--component-font-family);
        overflow-x: hidden;
        overflow-y: auto;
        line-height: 1.5;
        min-height: 100dvh;
        position: relative;
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

      section {
        padding: 2rem 2rem;
        position: relative;
        background: transparent;
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

      .landing-page h2 {
        font: 700 42px/1.2 "Inter", sans-serif; /* Larger H2 */
        color: var(--component-text-primary);
        margin-bottom: 20px;
      }

      .subtitle {
        font: 400 18px/28px "Inter", sans-serif;
        color: var(--component-text-secondary);
        margin-bottom: 32px;
        max-width: 700px;
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
        h2 { font-size: 32px; line-height: 40px; }
        .hero-title { font-size: 40px; }
      }

      @media (max-width: 768px) {
        section {
          padding: 1.5rem 1rem !important;
        }

        section.content-centered {
          max-width: 100%;
        }

        .section-content-box {
          padding: 8px;
          border-radius: 12px;
        }

        .landing-page h1 {
          font-size: 32px;
          line-height: 1.2;
        }

        .landing-page h2 {
          font-size: 28px;
          line-height: 1.2;
        }

        .subtitle {
          font-size: 15px;
          line-height: 1.5;
        }

        .invite-form {
          padding: 20px 16px;
        }

        #background-image {
          display: none;
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
        <NoNoise content={content.noNoise} />
        <Claims content={content.claims} />
        <Promise content={content.promise} />
        <Platform content={content.platform} />
        <Architecture content={content.architecture} language={language} />
        <BetaForm content={content.beta} language={language} />

        {/* FOOTER */}
        <footer style={{
          padding: '24px 16px',
          textAlign: 'center',
          color: 'var(--component-text-muted)',
          fontSize: '14px',
          marginTop: '0'
        }}>
          <p style={{ margin: 0 }}>{t('footer.rights')}</p>
        </footer>
      </div>
    </div>
  );
}
