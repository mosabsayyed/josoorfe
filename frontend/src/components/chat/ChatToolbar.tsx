import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Lock, ChevronDown } from 'lucide-react';
import './ChatToolbar.css';

interface ChatToolbarProps {
  selectedPersona: string | null;
  onPersonaChange: (persona: string) => void;
  isPersonaLocked: boolean;
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
}

const PERSONAS = [
  { key: 'general_analysis', labelKey: 'josoor.chat.toolbar.visionExpert' },
  { key: 'risk_advisory', labelKey: 'josoor.chat.toolbar.riskAnalyst' },
  { key: 'strategy_brief', labelKey: 'josoor.chat.toolbar.strategyGeneralist' },
  { key: 'intervention_planning', labelKey: 'josoor.chat.toolbar.planningExpert' },
  { key: 'stakeholder_communication', labelKey: 'josoor.chat.toolbar.stakeCommExpert' },
];

const TOOLS = [
  { key: 'recall_memory', labelKey: 'josoor.chat.toolbar.recallMemory' },
  { key: 'search_ksa_facts', labelKey: 'josoor.chat.toolbar.searchVisionDb' },
];

export function ChatToolbar({
  selectedPersona,
  onPersonaChange,
  isPersonaLocked,
  selectedTools,
  onToolsChange,
}: ChatToolbarProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const handleToolToggle = (toolKey: string) => {
    if (selectedTools.includes(toolKey)) {
      onToolsChange(selectedTools.filter(t => t !== toolKey));
    } else {
      onToolsChange([...selectedTools, toolKey]);
    }
  };

  return (
    <div className="chat-toolbar" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Persona Dropdown */}
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

      {/* Divider */}
      <div className="chat-toolbar__divider" />

      {/* Tool Toggles */}
      <div className="chat-toolbar__tools">
        <span className="chat-toolbar__tools-label">{t('josoor.chat.toolbar.tools')}:</span>
        {TOOLS.map(tool => (
          <button
            key={tool.key}
            className={`chat-toolbar__tool-chip ${selectedTools.includes(tool.key) ? 'chat-toolbar__tool-chip--active' : ''}`}
            onClick={() => handleToolToggle(tool.key)}
            type="button"
          >
            {t(tool.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
