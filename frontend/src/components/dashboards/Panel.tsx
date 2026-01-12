import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  isDark?: boolean;
  language?: string;
}

const Panel: React.FC<PanelProps> = ({ children, className = '', id, isDark, language }) => {
  return (
    <div
      id={id}
      className={`panel ${className}`}
      style={{
        background: 'var(--component-panel-bg, #1F2937)',
        border: '1px solid var(--component-panel-border, #374151)',
        borderRadius: '0.5rem',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
      }}
    >
      {children}
    </div>
  );
};

export default Panel;