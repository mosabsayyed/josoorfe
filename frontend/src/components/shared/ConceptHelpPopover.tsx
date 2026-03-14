import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import './ConceptHelpPopover.css';

interface ConceptHelpPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  deskType: string;
}

export const ConceptHelpPopover: React.FC<ConceptHelpPopoverProps> = ({ isOpen, onClose, deskType }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ explanation: string; source_episodes?: Array<{ id: string; title: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResponse(null);
      setError(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the toggle click
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/v1/knowledge/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), desk_type: deskType, language }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(isAr ? 'تعذر الاتصال. حاول مرة أخرى.' : 'Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, loading, deskType, language, isAr]);

  if (!isOpen) return null;

  return (
    <div className="concept-help-popover" ref={popoverRef} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="concept-help-header">
        <span className="concept-help-title">{t('josoor.common.conceptHelpTitle')}</span>
        <button className="concept-help-close" onClick={onClose}>&times;</button>
      </div>

      <div className="concept-help-input-row">
        <input
          ref={inputRef}
          className="concept-help-input"
          type="text"
          placeholder={t('josoor.common.conceptHelpPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          disabled={loading}
        />
        <button
          className="concept-help-submit"
          onClick={handleSubmit}
          disabled={!query.trim() || loading}
        >
          {t('josoor.common.conceptHelpSubmit')}
        </button>
      </div>

      {loading && (
        <div className="concept-help-loading">
          <div className="concept-help-spinner" />
          <span>{t('josoor.common.conceptHelpLoading')}</span>
        </div>
      )}

      {error && <div className="concept-help-error">{error}</div>}

      {response && (
        <div className="concept-help-response">
          <p className="concept-help-explanation">{response.explanation}</p>
          {response.source_episodes && response.source_episodes.length > 0 && (
            <div className="concept-help-sources">
              {response.source_episodes.map(ep => (
                <span key={ep.id} className="concept-help-source-tag">
                  {t('josoor.common.conceptHelpReadMore')}: {ep.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
