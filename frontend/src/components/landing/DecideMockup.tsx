import React from 'react';

export default function DecideMockup() {
  return (
    <div className="dm-grid">
      <div>
        <div className="dm-box" style={{ marginBottom: '0.3rem' }}>
          <div className="dm-lbl">Impact chain</div>
          <p>
            <b>Training</b> <span className="dm-arrow">→</span> 40%<br />
            <span className="dm-arrow">↳</span> <b>Licensing Ops</b> gap<br />
            <span className="dm-arrow">↳</span> regulation Q3<br />
            <span className="dm-arrow">↳</span> investors old process<br />
            <span className="dm-arrow">↳</span> <b>Minister</b>
          </p>
        </div>
        <div className="dm-box">
          <div className="dm-lbl">Root cause</div>
          <p>
            Training conflicts with <b>Q2 deadlines</b>. Nobody connected to regulation.
          </p>
        </div>
      </div>
      <div>
        <div className="dm-opt">
          <div className="dm-oh oa">A — Reschedule</div>
          <div className="dm-op">
            <b>Minimal cost.</b> Ready 2 wks early.
          </div>
        </div>
        <div className="dm-opt">
          <div className="dm-oh ob">B — Bootcamp</div>
          <div className="dm-op">
            3-day, 25 staff. <b>SAR 180K.</b>
          </div>
        </div>
        <div className="dm-opt">
          <div className="dm-oh oc">C — Hope</div>
          <div className="dm-op">
            <b>40% chance</b> not ready. Years damage.
          </div>
        </div>
      </div>
    </div>
  );
}
