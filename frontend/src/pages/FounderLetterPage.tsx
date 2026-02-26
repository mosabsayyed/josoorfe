import React, { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';

export default function FounderLetterPage() {
  const { language } = useLanguage();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const src = language === 'ar'
    ? '/att/cube/founder-ar.html'
    : '/att/cube/founder.html';

  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // Inject site color overrides — match JOSOOR landing page theme
    const style = doc.createElement('style');
    style.textContent = `
      html, body { background: #111827 !important; }
      .bg-tint { background: #111827 !important; transition: none !important; }
      .bg-video { display: none !important; }
      .phase-overlay .phase-text-block h2 { color: #F4BB30 !important; }
      .phase-overlay .phase-text-block p { color: rgba(255, 255, 255, 0.88) !important; }
      .finale-enter-btn {
        background: linear-gradient(135deg, #F4BB30 0%, #D4AF37 100%) !important;
        color: #111827 !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 16px rgba(244, 187, 48, 0.3) !important;
      }
      .finale-enter-btn:hover {
        background: linear-gradient(135deg, #D4AF37 0%, #F4BB30 100%) !important;
        box-shadow: 0 6px 24px rgba(244, 187, 48, 0.4) !important;
      }
      #stage { filter: none; }
      /* Hide cube's own header/footer — parent page provides the header */
      header, footer { display: none !important; }
      #rubiks-top-controls { display: none !important; }
    `;
    doc.head.appendChild(style);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      position: 'relative',
      backgroundColor: '#111827',
      overflow: 'hidden'
    }}>
      <Header />
      <iframe
        key={language}
        ref={iframeRef}
        onLoad={handleIframeLoad}
        src={src}
        title="Founder's Letter"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          border: 'none',
          display: 'block',
          margin: 0,
          padding: 0,
          zIndex: 1,
        }}
        allowFullScreen
      />
    </div>
  );
}
