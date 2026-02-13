import React from 'react';

export default function WatchMockup() {
  return (
    <>
      <div className="wm-row">
        <div className="wm-box">
          <div className="wm-lbl">Adaa KPIs</div>
          <div className="wm-val" style={{ color: 'var(--component-color-success)' }}>
            28<span style={{ fontSize: '9px', color: 'var(--component-text-muted)' }}>/35</span>
          </div>
          <div className="wm-sub">4 drifting</div>
        </div>
        <div className="wm-box">
          <div className="wm-lbl">Capabilities</div>
          <div className="wm-val" style={{ color: 'var(--component-text-accent)' }}>
            9<span style={{ fontSize: '9px', color: 'var(--component-text-muted)' }}>/12</span>
          </div>
          <div className="wm-sub">1 declining</div>
        </div>
        <div className="wm-box">
          <div className="wm-lbl">Budget</div>
          <div className="wm-val" style={{ color: 'var(--component-text-primary)' }}>
            77<span style={{ fontSize: '9px', color: 'var(--component-text-muted)' }}>%</span>
          </div>
          <div className="wm-sub">SAR 240M</div>
        </div>
      </div>

      <div className="wm-sig sr">
        <div className="wm-badge">HIGH</div>
        <div>
          <div className="wm-txt">
            <b>Licensing training</b> 40%. Regulation 8 wks.
          </div>
          <div className="wm-chain">Training→capability→regulation→Minister</div>
        </div>
      </div>

      <div className="wm-sig sa">
        <div className="wm-badge">TREND</div>
        <div>
          <div className="wm-txt">
            <b>Inspection</b> green, declining: 94→89→83%
          </div>
        </div>
      </div>

      <div className="wm-sig sg">
        <div className="wm-badge">OK</div>
        <div>
          <div className="wm-txt">
            <b>Digital Permitting</b> 82%. On track.
          </div>
        </div>
      </div>
    </>
  );
}
