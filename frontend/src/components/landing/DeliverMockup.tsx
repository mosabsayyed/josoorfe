import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DeliverMockup() {
  const { t } = useTranslation();

  return (
    <>
      <div className="dlm-h">42 {t('mockups.deliver.scanned')} · 4 {t('mockups.deliver.needAttention')}</div>

      <div className="dlm-r">
        <span className="dlm-n">Licensing training — 8 weeks</span>
        <span className="dlm-b dlm-crit">{t('mockups.deliver.critical')}</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">Inspection — green declining</span>
        <span className="dlm-b dlm-trn">{t('mockups.deliver.trend')}</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">Vendor — 3 deps</span>
        <span className="dlm-b dlm-trn">{t('mockups.deliver.expiry')}</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">Survey — Adaa, 9 days</span>
        <span className="dlm-b dlm-ok">{t('mockups.deliver.done')}</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">26 on track</span>
        <span className="dlm-b dlm-skip">{t('mockups.deliver.skipped')}</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">12 no movement</span>
        <span className="dlm-b dlm-skip">{t('mockups.deliver.skipped')}</span>
      </div>

      <div className="dlm-stats">
        <div className="dlm-stat">
          <div className="dlm-sv" style={{ color: 'var(--component-color-danger)' }}>4</div>
          <div className="dlm-sl">{t('mockups.deliver.attention')}</div>
        </div>
        <div className="dlm-stat">
          <div className="dlm-sv" style={{ color: 'var(--component-text-muted)' }}>38</div>
          <div className="dlm-sl">{t('mockups.deliver.skipped')}</div>
        </div>
      </div>
    </>
  );
}
