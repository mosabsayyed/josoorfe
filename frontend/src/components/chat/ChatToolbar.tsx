import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Lock, ChevronDown } from 'lucide-react';
import './ChatToolbar.css';

interface ChatToolbarProps {
  selectedPersona: string | null;
  onPersonaChange: (persona: string) => void;
  isPersonaLocked: boolean;
}

const PERSONAS = [
  { key: 'vision_expert', labelKey: 'josoor.chat.toolbar.visionExpert' },
  { key: 'risk_advisory', labelKey: 'josoor.chat.toolbar.riskAnalyst' },
  { key: 'strategy_brief', labelKey: 'josoor.chat.toolbar.strategyGeneralist' },
  { key: 'intervention_planning', labelKey: 'josoor.chat.toolbar.planningExpert' },
  { key: 'stakeholder_communication', labelKey: 'josoor.chat.toolbar.stakeCommExpert' },
];

export function ChatToolbar({
  selectedPersona,
  onPersonaChange,
  isPersonaLocked,
}: ChatToolbarProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="chat-toolbar" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="chat-toolbar__persona">
        <div className={`chat-toolbar__select-wrapper ${isPersonaLocked ? 'chat-toolbar__select-wrapper--locked' : ''}`}>
          <select
            className="chat-toolbar__select"
            value={selectedPersona || ''}
            onChange={(e) => onPersonaChange(e.target.value)}
            disabled={isPersonaLocked}
          >
            <option value="" disabled>{t('josoor.chat.toolbar.selectExpert')}</option>
            {PERSONAS.map(p => (
              <option key={p.key} value={p.key}>{t(p.labelKey)}</option>
            ))}
          </select>
          {isPersonaLocked ? (
            <Lock className="chat-toolbar__select-icon" size={14} />
          ) : (
            <ChevronDown className="chat-toolbar__select-icon" size={14} />
          )}
        </div>
        {isPersonaLocked && (
          <span className="chat-toolbar__locked-hint">{t('josoor.chat.toolbar.personaLocked')}</span>
        )}
      </div>
    </div>
  );
}
