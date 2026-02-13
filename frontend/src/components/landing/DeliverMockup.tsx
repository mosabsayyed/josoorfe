import React from 'react';

export default function DeliverMockup() {
  return (
    <>
      <div className="dlm-h">42 scanned · 4 need attention</div>

      <div className="dlm-r">
        <span className="dlm-n">Licensing training — 8 weeks</span>
        <span className="dlm-b dlm-crit">Critical</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">Inspection — green declining</span>
        <span className="dlm-b dlm-trn">Trend</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">Vendor — 3 deps</span>
        <span className="dlm-b dlm-trn">Expiry</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">Survey — Adaa, 9 days</span>
        <span className="dlm-b dlm-ok">Done</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">26 on track</span>
        <span className="dlm-b dlm-skip">Skipped</span>
      </div>

      <div className="dlm-r">
        <span className="dlm-n">12 no movement</span>
        <span className="dlm-b dlm-skip">Skipped</span>
      </div>

      <div className="dlm-stats">
        <div className="dlm-stat">
          <div className="dlm-sv" style={{ color: 'var(--component-color-danger)' }}>4</div>
          <div className="dlm-sl">Attention</div>
        </div>
        <div className="dlm-stat">
          <div className="dlm-sv" style={{ color: 'var(--component-text-muted)' }}>38</div>
          <div className="dlm-sl">Skipped</div>
        </div>
      </div>
    </>
  );
}
