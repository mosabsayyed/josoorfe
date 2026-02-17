import React from 'react';
import { useTranslation } from 'react-i18next';

export default function WatchMockup() {
  const { t } = useTranslation();

  return (
    <>
      <div className="wm-row">
        <div className="wm-box">
          <div className="wm-lbl">{t('mockups.watch.adaaKpis')}</div>
          <div className="wm-val" style={{ color: 'var(--component-color-success)' }}>
            28<span style={{ fontSize: '9px', color: 'var(--component-text-muted)' }}>/35</span>
          </div>
          <div className="wm-sub">4 {t('mockups.watch.drifting')}</div>
        </div>
        <div className="wm-box">
          <div className="wm-lbl">{t('mockups.watch.capabilities')}</div>
          <div className="wm-val" style={{ color: 'var(--component-text-accent)' }}>
            9<span style={{ fontSize: '9px', color: 'var(--component-text-muted)' }}>/12</span>
          </div>
          <div className="wm-sub">1 {t('mockups.watch.declining')}</div>
        </div>
        <div className="wm-box">
          <div className="wm-lbl">{t('mockups.watch.budget')}</div>
          <div className="wm-val" style={{ color: 'var(--component-text-primary)' }}>
            77<span style={{ fontSize: '9px', color: 'var(--component-text-muted)' }}>%</span>
          </div>
          <div className="wm-sub">SAR 240M</div>
        </div>
      </div>

      <div className="wm-sig sr">
        <div className="wm-badge">{t('mockups.watch.high')}</div>
        <div>
          <div className="wm-txt">
            <b>Licensing training</b> 40%. Regulation 8 wks.
          </div>
          <div className="wm-chain">Training→capability→regulation→Minister</div>
        </div>
      </div>

      <div className="wm-sig sa">
        <div className="wm-badge">{t('mockups.watch.trend')}</div>
        <div>
          <div className="wm-txt">
            <b>Inspection</b> green, declining: 94→89→83%
          </div>
        </div>
      </div>

      <div className="wm-sig sg">
        <div className="wm-badge">{t('mockups.watch.ok')}</div>
        <div>
          <div className="wm-txt">
            <b>Digital Permitting</b> 82%. On track.
          </div>
        </div>
      </div>
    </>
  );
}
