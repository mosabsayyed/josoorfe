import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chainsService, ChainResponse } from '../../services/chainsService';
import '../../styles/quick-chains-panel.css';

type QuickChainsPanelProps = {
  defaultYear?: number;
  onChainResult?: (result: ChainResponse) => void;
};

export function QuickChainsPanel({ defaultYear = 2025, onChainResult }: QuickChainsPanelProps) {
  const { t } = useTranslation();
  const [nodeId, setNodeId] = useState('');
  const [year, setYear] = useState<number>(defaultYear);
  const [mode, setMode] = useState<'narrative' | 'diagnostic'>('narrative');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ChainResponse | null>(null);

  const CHAINS = [
    { key: 'sector_value_chain', label: t('josoor.explorerFilters.chains.sector_value_chain') },
    { key: 'setting_strategic_initiatives', label: t('josoor.explorerFilters.chains.setting_strategic_initiatives') },
    { key: 'operate_oversight', label: t('josoor.explorerFilters.chains.operate_oversight') },
  ];

  const handleRun = async (chainKey: string) => {
    if (!nodeId.trim()) {
      setError(t('josoor.chat.chains.provideId'));
      return;
    }
    setError(null);
    setLoadingKey(chainKey);
    try {
      const result = await chainsService.executeChain(
        chainKey,
        nodeId.trim(),
        year,
        undefined,  // quarter
        mode === 'diagnostic'
      );
      setLastResult(result);
      if (onChainResult) onChainResult(result);
    } catch (e: any) {
      setError(e?.message || t('josoor.chat.chains.failedToRun'));
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="quick-chains-panel">
      <div className="quick-chains-header">{t('josoor.chat.chains.verifiedChains')}</div>
      <div className="quick-chains-inputs">
        <label className="quick-chains-label">
          {t('josoor.chat.chains.nodeId')}
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            placeholder="e.g. OBJ-123"
            className="quick-chains-input"
          />
        </label>
        <label className="quick-chains-label">
          {t('josoor.chat.chains.year')}
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || defaultYear)}
            className="quick-chains-input"
          />
        </label>
        <label className="quick-chains-label">
          {t('josoor.chat.chains.mode')}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'narrative' | 'diagnostic')}
            className="quick-chains-input"
          >
            <option value="narrative">{t('josoor.chat.chains.narrative')}</option>
            <option value="diagnostic">{t('josoor.chat.chains.diagnostic')}</option>
          </select>
        </label>
      </div>

      <div className="quick-chains-buttons">
        {CHAINS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleRun(key)}
            className="quick-chains-button"
            disabled={!!loadingKey}
          >
            {loadingKey === key ? t('josoor.chat.chains.running') : label}
          </button>
        ))}
      </div>

      {error && <div className="quick-chains-error">{error}</div>}

      {lastResult && (
        <div className="quick-chains-result">
          <div className="quick-chains-result-title">{t('josoor.chat.chains.lastResult')}</div>
          <div className="quick-chains-meta">
            <span>{t('josoor.chat.chains.chain')} {lastResult.chain_key}</span>
            <span>{t('josoor.chat.chains.id')} {lastResult.id}</span>
            <span>{t('josoor.chat.chains.yearLabel')} {lastResult.year}</span>
            <span>{t('josoor.chat.chains.count')} {lastResult.count}</span>
            {lastResult.mode && <span>{t('josoor.chat.chains.modeLabel')} {lastResult.mode}</span>}
          </div>
          <pre className="quick-chains-pre">{JSON.stringify(lastResult.results?.slice(0, 2) || [], null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
