import React, { useState } from 'react';
import { AIExplainButton } from './AIExplainButton';

// Types for the action items
interface ActionItem {
  id: string;
  type: 'decision' | 'signal' | 'missing';
  title: string;
  description?: string;
  severity?: 'high' | 'medium' | 'low';
}

interface CardActionIconsProps {
  contextId: string;          // e.g., 'internalOutputs', 'strategicInsights', 'sectorOutcomes'
  contextTitle: string;       // Human readable name
  contextData?: any;          // The data to send to AI for explanation
  actions?: ActionItem[];     // Pending actions for this context
  isDark?: boolean;
}

// Inline styles - no Tailwind
const styles = {
  container: {
    display: 'flex',
    gap: '8px',
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    zIndex: 10
  },
  iconButton: (isDark: boolean) => ({
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    transition: 'background 0.2s',
  }),
  badge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    background: '#EF4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modal: (isDark: boolean) => ({
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }),
  modalContent: (isDark: boolean) => ({
    background: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  }),
  modalHeader: (isDark: boolean) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`
  }),
  modalTitle: (isDark: boolean) => ({
    fontSize: '1rem',
    fontWeight: 600,
    color: isDark ? '#F9FAFB' : '#1F2937',
    margin: 0
  }),
  closeButton: (isDark: boolean) => ({
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: isDark ? '#9CA3AF' : '#6B7280'
  }),
  actionItem: (isDark: boolean, severity?: string) => ({
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderLeft: `3px solid ${
      severity === 'high' ? '#EF4444' : 
      severity === 'medium' ? '#F59E0B' : '#10B981'
    }`
  })
};

export const CardActionIcons: React.FC<CardActionIconsProps> = ({ 
  contextId, 
  contextTitle, 
  contextData, 
  actions = [],
  isDark = true 
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      <div style={styles.container}>
        {/* Pending Actions Button */}
        <button 
          style={{ ...styles.iconButton(isDark), position: 'relative' }}
          onClick={() => setShowActions(true)}
          title="Pending Actions"
        >
          📋
          {actions.length > 0 && (
            <span style={styles.badge}>{actions.length}</span>
          )}
        </button>

        {/* Explain to Me Button - Replaced with reusable AIExplainButton */}
        <AIExplainButton 
            mode="icon"
            contextId={contextId}
            contextTitle={contextTitle}
            contextData={contextData}
            isDark={isDark}
        />
      </div>

      {/* Pending Actions Modal */}
      {showActions && (
        <div style={styles.modal(isDark)} onClick={() => setShowActions(false)}>
          <div style={styles.modalContent(isDark)} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader(isDark)}>
              <h3 style={styles.modalTitle(isDark)}>Pending Actions: {contextTitle}</h3>
              <button style={styles.closeButton(isDark)} onClick={() => setShowActions(false)}>×</button>
            </div>
            
            {actions.length === 0 ? (
              <p style={{ color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', padding: '20px' }}>
                No pending actions for this section.
              </p>
            ) : (
              actions.map(action => (
                <div key={action.id} style={styles.actionItem(isDark, action.severity)}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginBottom: '4px'
                  }}>
                    {action.type === 'decision' ? '⚡ Decision' : 
                     action.type === 'signal' ? '⚠️ Signal' : '📊 Missing Data'}
                  </div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: isDark ? '#F9FAFB' : '#1F2937',
                    marginBottom: '4px'
                  }}>
                    {action.title}
                  </div>
                  {action.description && (
                    <div style={{ fontSize: '0.875rem', color: isDark ? '#9CA3AF' : '#6B7280' }}>
                      {action.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CardActionIcons;
