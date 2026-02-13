import React from 'react';

interface MockupChromeProps {
  label?: string;
  children: React.ReactNode;
}

export default function MockupChrome({ label, children }: MockupChromeProps) {
  return (
    <div className="mc-mock">
      <div className="mk-bar">
        <div className="mk-d mk-r"></div>
        <div className="mk-d mk-y"></div>
        <div className="mk-d mk-g"></div>
        {label && <span className="mk-label">{label}</span>}
      </div>
      <div className="mk-body">
        {children}
      </div>
    </div>
  );
}
