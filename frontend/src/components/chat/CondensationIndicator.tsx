/**
 * CondensationIndicator Component
 * 
 * Visual indicator showing that earlier messages have been condensed
 * Appears as a subtle divider with icon and explanation text
 * 
 * Shows:
 * - "Earlier messages condensed"
 * - Word count reduction info (optional)
 * - A divider line for visual separation
 */

import { Archive, ChevronDown } from 'lucide-react';
import React from 'react';

interface CondensationIndicatorProps {
  originalCount?: number;
  condensedCount?: number;
  tokensSaved?: number;
  language?: 'en' | 'ar';
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
}

export const CondensationIndicator: React.FC<CondensationIndicatorProps> = ({
  originalCount,
  condensedCount,
  tokensSaved,
  language = 'en',
  expanded = false,
  onToggleExpanded,
}) => {
  const isArabic = language === 'ar';

  const texts = {
    title: isArabic ? 'الرسائل السابقة مختصرة' : 'Earlier messages condensed',
    subtitle: isArabic ? 'تم ضغط الرسائل القديمة لتوفير السياق' : 'Earlier messages were compressed to maintain context',
    details: isArabic
      ? `${originalCount} رسالة مختصرة إلى ${condensedCount} رسالة (~${tokensSaved} رمز محفوظ)`
      : `${originalCount} messages condensed to ${condensedCount} (~${tokensSaved} tokens saved)`,
    viewMore: isArabic ? 'عرض المزيد' : 'View Details',
    hideSummary: isArabic ? 'إخفاء الملخص' : 'Hide Summary',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px 24px',
        margin: '16px 0',
        borderLeft: '3px solid rgba(244, 187, 48, 0.4)',
        borderRadius: '6px',
        backgroundColor: 'rgba(244, 187, 48, 0.05)',
        opacity: 0.85,
      }}
    >
      {/* Main Indicator Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Icon + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
          }}
        >
          <Archive
            size={18}
            style={{
              color: 'rgba(244, 187, 48, 0.7)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--component-text-primary)',
                lineHeight: 1.3,
              }}
            >
              {texts.title}
            </p>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--component-text-secondary)',
                lineHeight: 1.2,
              }}
            >
              {texts.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Toggle Button (if expandable) */}
        {originalCount && condensedCount && onToggleExpanded && (
          <button
            onClick={() => onToggleExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(244, 187, 48, 0.6)',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            title={expanded ? texts.hideSummary : texts.viewMore}
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {/* Expandable Details */}
      {expanded && originalCount && condensedCount && (
        <div
          style={{
            display: 'flex',
            fontSize: '12px',
            color: 'var(--component-text-secondary)',
            padding: '8px 0 0 28px',
            borderTop: '1px solid rgba(244, 187, 48, 0.1)',
            marginTop: '4px',
            lineHeight: 1.5,
          }}
        >
          <span>
            {originalCount} {originalCount === 1 ? (isArabic ? 'رسالة' : 'message') : isArabic ? 'رسائل' : 'messages'} → {condensedCount}{' '}
            {condensedCount === 1 ? (isArabic ? 'رسالة' : 'message') : isArabic ? 'رسائل' : 'messages'}
            {tokensSaved && ` (~${tokensSaved} tokens saved)`}
          </span>
        </div>
      )}
    </div>
  );
};

export default CondensationIndicator;
