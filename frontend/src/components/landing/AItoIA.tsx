import React from 'react';
import { useTranslation } from 'react-i18next';

const IA_ICONS = [
  '/att/icons/icon-inputs-ready.png',
  '/att/icons/icon-ai-in-loop.png',
  '/att/icons/icon-accelerated-certainty.png',
];

export default function AItoIA({ language }: { language: string }) {
  const { t } = useTranslation();

  const reasons = t('aitoia.reasons', { returnObjects: true }) as string[];
  const iaItems = t('aitoia.iaItems', { returnObjects: true }) as Array<{ icon: string; strong: string; desc: string }>;

  // Highlight Watch/Decide/Deliver in gold (content from trusted i18n files only)
  const highlightWorkflow = (text: string) => {
    const words = ['Watch', 'Decide', 'Deliver', 'تراقبها', 'تقرّرها', 'تنفّذها'];
    let result = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'g');
      result = result.replace(regex, `<span style="color: #F4BB30; font-weight: 600;">$1</span>`);
    });
    return result;
  };

  return (
    <div id="aitoia">
      {/* Challenge block */}
      <section className="aitoia-section" style={{
        background: 'var(--component-bg-primary, #111827)',
        width: '100%',
      }}>
        <div className="aitoia-glass">
          <div className="aitoia-header">
            <span className="aitoia-tag">{t('aitoia.tag')}</span>
            <h2>{t('aitoia.title')}</h2>
            <p className="subtitle" style={{ maxWidth: '90vw' }}>{t('aitoia.challengeSubtitle')}</p>
          </div>
          <div className="challenge-columns">
            <div className="challenge-col challenge-reasons">
              <h3>{t('aitoia.reasonsTitle')}</h3>
              <ol>
                {reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ol>
            </div>
            <div className="challenge-col challenge-consequence">
              <h3>{t('aitoia.consequenceTitle')}</h3>
              <p>{t('aitoia.consequence')}</p>
            </div>
          </div>
          <p className="challenge-footnote">{t('aitoia.footnote')}</p>
        </div>
      </section>

      {/* Innovation block */}
      <section className="aitoia-section" style={{
        background: 'var(--component-bg-primary, #111827)',
        width: '100%',
      }}>
        <div className="aitoia-glass">
          <div className="aitoia-header">
            <span className="aitoia-tag">{t('aitoia.innovationTag')}</span>
            <h2>{t('aitoia.innovationTitle')}</h2>
            <p className="subtitle" style={{ maxWidth: '90vw' }}>{t('aitoia.innovationSubtitle')}</p>
          </div>
          <div className="aitoia-block aitoia-ia" style={{ opacity: 1, pointerEvents: 'auto' }}>
            <ul>
              {iaItems.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={IA_ICONS[i]} alt={item.strong} width={96} height={96} style={{ flexShrink: 0 }} className="aitoia-bullet-icon" />
                  <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
                    <strong>{item.strong}</strong>
                    {/* i18n content is developer-controlled, not user input */}
                    <span dangerouslySetInnerHTML={{ __html: highlightWorkflow(item.desc) }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
