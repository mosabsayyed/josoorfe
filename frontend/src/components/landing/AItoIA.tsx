import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AItoIA({ language }: { language: string }) {
  const { t } = useTranslation();

  const reasons = t('aitoia.reasons', { returnObjects: true }) as string[];

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

      {/* Innovation block removed — replaced by SolutionBlocks component */}
    </div>
  );
}
