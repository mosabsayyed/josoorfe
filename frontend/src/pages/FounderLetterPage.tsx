import React, { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';

export default function FounderLetterPage() {
  const { language } = useLanguage();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isPrerender = typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap');

  const src = language === 'ar'
    ? '/att/cube/founder-ar.html'
    : '/att/cube/founder.html';

  const summary = language === 'ar'
    ? {
        eyebrow: 'رسالة المؤسس',
        title: 'لماذا بُنيت جسور بهذه الطريقة',
        body: 'تعرض هذه الرسالة منطق جسور كمنهج لتحويل التعقيد المؤسسي إلى وضوح قابل للتنفيذ. الفكرة ليست إضافة لوحة جديدة فوق البيانات، بل بناء طبقة معرفية تربط الأهداف والسياسات والقدرات والمشاريع والمخاطر والأداء داخل سياق واحد يمكن استكشافه.',
        points: [
          'المنصة تبدأ من الواقع المؤسسي القائم، ولا تفترض أن البيانات مرتبة مسبقاً.',
          'القيمة الأساسية هي الاكتشاف: كشف العلاقات والاعتماديات والتأثيرات غير المرئية في النماذج التقليدية.',
          'النتيجة المقصودة هي ذكاء مؤسسي يساعد القيادات على اتخاذ قرارات أوضح وأسرع وأكثر اتساقاً.',
        ],
        cta: 'النسخة التفاعلية الكاملة متاحة داخل الموقع عند فتح الصفحة مباشرة.',
      }
    : {
        eyebrow: 'Founder Letter',
        title: 'Why Josoor was built this way',
        body: 'This letter explains Josoor as a methodology for turning institutional complexity into navigable clarity. The goal is not another dashboard layer over existing data, but a knowledge layer that connects objectives, policies, capabilities, projects, risks, and performance in one explorable context.',
        points: [
          'The platform starts from the institution as it actually exists, not from an assumption of perfectly prepared data.',
          'Its primary value is discovery: revealing dependencies, relationships, and hidden effects that conventional systems do not surface well.',
          'The intended outcome is institutional intelligence that supports clearer, faster, and more coherent executive decisions.',
        ],
        cta: 'The full interactive letter remains available when the page is opened normally in the site.',
      };

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
      {isPrerender ? (
        <main
          style={{
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
            padding: '120px 24px 48px',
            display: 'flex',
            justifyContent: 'center',
            overflowY: 'auto',
          }}
        >
          <article
            style={{
              width: '100%',
              maxWidth: '860px',
              background: 'rgba(17, 24, 39, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '28px',
              padding: '40px 32px',
              color: '#F9FAFB',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.32)',
            }}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language}
          >
            <p style={{ margin: 0, color: '#F4BB30', fontSize: '14px', fontWeight: 700, letterSpacing: language === 'ar' ? 0 : '0.12em', textTransform: language === 'ar' ? 'none' : 'uppercase' }}>
              {summary.eyebrow}
            </p>
            <h1 style={{ margin: '16px 0 20px', fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.05 }}>
              {summary.title}
            </h1>
            <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.8, color: 'rgba(249, 250, 251, 0.88)' }}>
              {summary.body}
            </p>
            <ul style={{ margin: '28px 0 0', paddingInlineStart: '20px', display: 'grid', gap: '14px', fontSize: '17px', lineHeight: 1.7, color: 'rgba(249, 250, 251, 0.92)' }}>
              {summary.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p style={{ margin: '28px 0 0', fontSize: '15px', lineHeight: 1.7, color: 'rgba(209, 213, 219, 0.9)' }}>
              {summary.cta}
            </p>
          </article>
        </main>
      ) : (
        <iframe
          key={language}
          ref={iframeRef}
          onLoad={handleIframeLoad}
          src={src}
          title="Founder's Letter"
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            width: '100vw',
            height: 'calc(100vh - 60px)',
            border: 'none',
            display: 'block',
            margin: 0,
            padding: 0,
            zIndex: 1,
          }}
          allowFullScreen
        />
      )}
    </div>
  );
}
