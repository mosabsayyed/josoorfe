import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { L1Capability, L2Capability, L3Capability } from '../../types/enterprise';
import type { OverlayType } from '../../utils/enterpriseOverlayUtils';
import { getCapabilityMatrix } from '../../services/enterpriseService';
import { chatService } from '../../services/chatService';
import { Artifact } from '../../types/api';
import { EnterpriseHeader } from './enterprise/EnterpriseHeader';
import { OverlayControls } from './enterprise/OverlayControls';
import { DynamicInsightPanel } from './enterprise/DynamicInsightPanel';
import { DynamicInsightTitle } from './enterprise/DynamicInsightTitle';
import { CapabilityMatrix } from './enterprise/CapabilityMatrix';
import { CapabilityTooltip } from './enterprise/CapabilityTooltip';
import { CapabilityDetailPanel } from './enterprise/CapabilityDetailPanel';
import StrategyReportModal from './sector/StrategyReportModal';

import './enterprise/EnterpriseDesk.css';

interface TooltipData {
  l3: L3Capability;
  x: number;
  y: number;
}

interface EnterpriseDeskProps {
  year?: string;
  quarter?: string;
  focusCapId?: string | null;
}

export function EnterpriseDesk({ year = '2025', quarter = 'Q1', focusCapId }: EnterpriseDeskProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // AI Risk Analysis state
  const [riskPromptTemplate, setRiskPromptTemplate] = useState<string | null>(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [riskReportHtml, setRiskReportHtml] = useState('');
  const [riskArtifacts, setRiskArtifacts] = useState<Artifact[]>([]);
  const [riskConversationId, setRiskConversationId] = useState<number | null>(null);

  // Filter state (single source of truth)
  const [selectedOverlay, setSelectedOverlay] = useState<OverlayType>('none');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [modeFilter, setModeFilter] = useState<'all' | 'build' | 'execute'>('all');
  const [selectedL3, setSelectedL3] = useState<L3Capability | null>(null);
  const [selectedL2, setSelectedL2] = useState<L2Capability | null>(null);

  // Convert global year/quarter to service format
  // Backend expects: year as number, quarter as integer (1, 2, 3, 4)
  const selectedYear: number | 'all' = parseInt(year);
  const selectedQuarter: number | 'all' = parseInt(quarter.replace('Q', '')); // "Q4" → 4

  // Cross-desk navigation: auto-select capability from query param
  const [searchParams] = useSearchParams();
  const targetCapId = searchParams.get('cap');

  // Fetch capability matrix from Neo4j (cached via React Query)
  const { data: matrixData = [], isLoading, error: queryError } = useQuery({
    queryKey: ['enterprise-matrix', selectedYear, selectedQuarter],
    queryFn: () => getCapabilityMatrix(selectedYear, selectedQuarter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load capabilities') : null;

  // Fetch AI risk analysis prompt template on mount
  useEffect(() => {
    const fetchPromptTemplate = async () => {
      try {
        const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
        const RAW_API_BASE = VITE_ENV?.VITE_API_URL || '';
        const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
        const API_PATH_PREFIX = (API_BASE_URL && API_BASE_URL.endsWith('/api/v1')) ? '' : '/api/v1';
        const baseUrl = API_BASE_URL || window.location.origin;

        const response = await fetch(`${baseUrl}${API_PATH_PREFIX}/prompts/risk_advisory`);
        if (response.ok) {
          const data = await response.json();
          setRiskPromptTemplate(data.content);
        } else {
          console.error('[EnterpriseDesk] Failed to fetch risk prompt template:', response.statusText);
        }
      } catch (error) {
        console.error('[EnterpriseDesk] Error fetching risk prompt template:', error);
      }
    };
    fetchPromptTemplate();
  }, []);

  // Auto-select capability from cross-desk navigation (query param ?cap=X or focusCapId prop)
  const effectiveCapId = focusCapId || targetCapId;
  useEffect(() => {
    if (!effectiveCapId || matrixData.length === 0) return;
    for (const l1 of matrixData) {
      // Check L1
      if (l1.id === effectiveCapId) {
        if (l1.l2.length > 0 && l1.l2[0].l3.length > 0) {
          setSelectedL3(l1.l2[0].l3[0]);
        }
        return;
      }
      for (const l2 of l1.l2) {
        // Check L2
        if (l2.id === effectiveCapId) {
          if (l2.l3.length > 0) {
            setSelectedL3(l2.l3[0]);
          }
          return;
        }
        // Check L3
        for (const l3 of l2.l3) {
          if (l3.id === effectiveCapId) {
            setSelectedL3(l3);
            return;
          }
        }
      }
    }
  }, [effectiveCapId, matrixData]);

  // Check if L3 should be dimmed based on filters
  // NOTE: Year/quarter filtering is done server-side during matrix building
  // Only mode filter applies here (build vs execute)
  const isL3Dimmed = (l3: L3Capability): boolean => {
    const matchesModeFilter =
      modeFilter === 'all' ||
      (modeFilter === 'build' && l3.mode === 'build') ||
      (modeFilter === 'execute' && l3.mode === 'execute');

    return !matchesModeFilter; // Dim if doesn't match mode filter
  };

  // Toggle overlay selection (single overlay only)
  const toggleOverlay = (overlay: OverlayType) => {
    if (overlay === 'none') {
      setSelectedOverlay('none');
      return;
    }

    if (selectedOverlay === overlay) {
      setSelectedOverlay('none');
    } else {
      setSelectedOverlay(overlay);
    }
  };

  // Tooltip handlers
  const handleL3Hover = (l3: L3Capability, event: React.MouseEvent) => {
    setTooltip({
      l3,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleL3Leave = () => {
    setTooltip(null);
  };

  const handleL3Click = (l3: L3Capability) => {
    setSelectedL3(l3);
    setSelectedL2(null);
  };

  const handleL2Click = (l2: L2Capability) => {
    setSelectedL2(l2);
    setSelectedL3(null);
  };

  const handlePanelClose = () => {
    setSelectedL3(null);
    setSelectedL2(null);
  };

  // Get all L3s (respecting filters) for insight panel
  const allL3s = useMemo(() => {
    const l3List: L3Capability[] = [];
    matrixData.forEach(l1 => {
      l1.l2.forEach(l2 => {
        l2.l3.forEach(l3 => {
          if (!isL3Dimmed(l3)) {
            l3List.push(l3);
          }
        });
      });
    });
    return l3List;
  }, [selectedYear, selectedQuarter, modeFilter, matrixData]);

  // AI Risk Analysis handler
  const handleAIRiskAnalysis = async (cap: any) => {
    setIsRiskModalOpen(true);
    setRiskReportHtml(`<div style="display:flex;align-items:center;justify-content:center;height:100%;"><h3 style="color:#F4BB30">${t('josoor.enterprise.detailPanel.generatingAnalysis')}</h3></div>`);
    setRiskArtifacts([]);

    if (!riskPromptTemplate) {
      setRiskReportHtml(`<div style="display:flex;align-items:center;justify-content:center;height:100%;"><h3 style="color:#ef4444">Error: Prompt template not loaded</h3></div>`);
      return;
    }

    const capId = cap.id;
    const capYear = cap.year || selectedYear;
    const riskId = cap.rawRisk?.id || cap.rawCapability?.risk?.id || '';
    const prompt = `Please analyze capability ${capId} (year: ${capYear}).${riskId ? ` Risk ID: ${riskId}` : ''}`;

    try {
      const response = await chatService.sendMessage({
        query: prompt,
        desk_type: 'sector_desk'
      });

      if (response.llm_payload?.answer) {
        const processedArtifacts = response.metadata?.llm_payload?.artifacts ||
                                  response.llm_payload?.artifacts || [];
        const cleanAnswer = response.metadata?.llm_payload?.answer ||
                           response.llm_payload.answer;

        setRiskReportHtml(cleanAnswer);
        setRiskArtifacts(processedArtifacts);
        if (response.conversation_id) {
          setRiskConversationId(response.conversation_id);
        }
        window.dispatchEvent(new Event('josoor_conversation_update'));
      } else {
        setRiskReportHtml(`<p style="color:red">${t('josoor.enterprise.detailPanel.analysisFailed')}</p>`);
        setRiskArtifacts([]);
      }
    } catch (error) {
      console.error('[EnterpriseDesk] AI Risk Analysis Failed:', error);
      setRiskReportHtml(`<p style="color:red">Analysis Error: ${(error as Error).message}</p>`);
      setRiskArtifacts([]);
    }
  };

  return (
    <div className="enterprise-desk-container">
      {/* Sticky Header */}
      <div className="enterprise-header-wrapper">
        {/* Title Row: Split into 2 columns matching blocks below */}
        <div className="enterprise-title-row">
          <h1 className="enterprise-main-title">{t('josoor.enterprise.title')}</h1>
          <div className="enterprise-insights-title-section">
            <DynamicInsightTitle selectedOverlay={selectedOverlay} />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as 'all' | 'build' | 'execute')}
              className="insight-mode-filter"
            >
              <option value="all">{t('josoor.enterprise.allModes')}</option>
              <option value="build">{t('josoor.enterprise.build')}</option>
              <option value="execute">{t('josoor.enterprise.execute')}</option>
            </select>
          </div>
        </div>

        {/* Single Row: Overlay Buttons Block + Insights Panel Block */}
        <div className="enterprise-controls-row">
          {/* Left Block: All 6 Overlay Buttons */}
          <div className="overlay-buttons-block">
            <button
              onClick={() => toggleOverlay('none')}
              className={`overlay-btn ${selectedOverlay === 'none' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              {t('josoor.enterprise.statusOnly')}
            </button>
            <button
              onClick={() => toggleOverlay('risk-exposure')}
              className={`overlay-btn ${selectedOverlay === 'risk-exposure' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              ⚠️ {t('josoor.enterprise.riskExposure')}
            </button>
            <button
              disabled
              className="overlay-btn overlay-btn-disabled"
            >
              🎯 {t('josoor.enterprise.externalPressure')}
            </button>
            <button
              disabled
              className="overlay-btn overlay-btn-disabled"
            >
              ⚖️ {t('josoor.enterprise.footprintStress')}
            </button>
            <button
              disabled
              className="overlay-btn overlay-btn-disabled"
            >
              ⚡ {t('josoor.enterprise.changeSaturation')}
            </button>
            <button
              disabled
              className="overlay-btn overlay-btn-disabled"
            >
              📉 {t('josoor.enterprise.trendWarning')}
            </button>
          </div>

          {/* Right Block: Insights Panel */}
          <DynamicInsightPanel
            selectedOverlay={selectedOverlay}
            allL3s={allL3s}
          />
        </div>
      </div>

      {/* Scrollable Matrix Wrapper */}
      <div className="enterprise-matrix-wrapper">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">{t('josoor.enterprise.loadingEnterprise')}</div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-red-500">{t('josoor.enterprise.errorPrefix')}: {error}</div>
        ) : (
          <CapabilityMatrix
            capabilityMatrix={matrixData}
            selectedOverlay={selectedOverlay}
            isL3Dimmed={isL3Dimmed}
            onL3Hover={handleL3Hover}
            onL3Leave={handleL3Leave}
            onL3Click={handleL3Click}
            onL2Click={handleL2Click}
          />
        )}
      </div>

      {/* Tooltip - Fixed positioning to prevent edge cutoff */}
      {tooltip && (
        <CapabilityTooltip
          l3={tooltip.l3}
          x={tooltip.x}
          y={tooltip.y}
          selectedOverlay={selectedOverlay}
        />
      )}

      {/* Detail Panel - slides in from right on L3 click */}
      {selectedL3 && (
        <CapabilityDetailPanel
          l3={selectedL3}
          onClose={handlePanelClose}
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
          onAIAnalysis={() => handleAIRiskAnalysis(selectedL3)}
        />
      )}

      {/* Detail Panel - slides in from right on L2 click */}
      {selectedL2 && !selectedL3 && (
        <CapabilityDetailPanel
          l2={selectedL2}
          onClose={handlePanelClose}
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
          onAIAnalysis={() => handleAIRiskAnalysis(selectedL2)}
        />
      )}

      {/* AI Risk Analysis Modal */}
      <StrategyReportModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        htmlContent={riskReportHtml}
        artifacts={riskArtifacts}
        onContinueInChat={() => {
          setIsRiskModalOpen(false);
          const chatPath = riskConversationId
            ? `/chat?conversation_id=${riskConversationId}`
            : '/chat';
          navigate(chatPath);
        }}
      />
    </div>
  );
}
