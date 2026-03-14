import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { L1Capability, L2Capability, L3Capability } from '../../types/enterprise';
import type { OverlayType } from '../../utils/enterpriseOverlayUtils';
import { getCapabilityMatrix } from '../../services/enterpriseService';
import { chatService } from '../../services/chatService';
import { Artifact } from '../../types/api';
import type { RiskAnalysisSnapshot } from '../../utils/planParser';
import { EnterpriseHeader } from './enterprise/EnterpriseHeader';
import { OverlayControls } from './enterprise/OverlayControls';
import { DynamicInsightPanel } from './enterprise/DynamicInsightPanel';
import { DynamicInsightTitle } from './enterprise/DynamicInsightTitle';
import { CapabilityMatrix } from './enterprise/CapabilityMatrix';
import { CapabilityTooltip } from './enterprise/CapabilityTooltip';
import { CapabilityDetailPanel } from './enterprise/CapabilityDetailPanel';
import StrategyReportModal from './sector/StrategyReportModal';
import { parseOptionsResponse, InterventionOption } from '../../utils/optionsParser';

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
  onIntervene?: (ctx: any) => void;
  onContinueInChat?: (conversationId: number) => void;
}

export function EnterpriseDesk({ year = '2025', quarter = 'Q1', focusCapId, onIntervene, onContinueInChat }: EnterpriseDeskProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // AI Risk Analysis state
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [riskReportHtml, setRiskReportHtml] = useState('');
  const [riskArtifacts, setRiskArtifacts] = useState<Artifact[]>([]);
  const [riskConversationId, setRiskConversationId] = useState<number | null>(null);
  const [riskOptions, setRiskOptions] = useState<InterventionOption[] | null>(null);

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
          setSelectedL2(l2);
          setSelectedL3(null);
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

  const handleSelectOption = (option: InterventionOption) => {
    const cap = selectedL3 || selectedL2;
    if (!cap) return;

    const isL2 = !!cap.l3;
    const capMode = cap.mode || (isL2 && cap.l3.some((c: any) => c.mode === 'execute') ? 'execute' : 'build');
    const statusField = capMode === 'execute' ? cap.execute_status : cap.build_status;
    const band = statusField || 'unknown';
    // KPI: L3 direct, L2 from upwardChain (same as detail panel)
    const kpiPct = cap.kpi_achievement_pct ?? (() => {
      const pt = cap.upwardChain?.performanceTargets?.[0];
      if (!pt) return undefined;
      const actual = pt.actual_value != null ? Number(pt.actual_value) : null;
      const target = pt.target != null ? Number(pt.target) : null;
      if (actual == null || target == null || target <= 0) return undefined;
      return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
    })();
    const ctx = {
      riskId: cap.rawRisk?.id || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.id : '') || '',
      riskName: cap.rawRisk?.name || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.name : '') || '',
      riskCategory: cap.rawRisk?.risk_category || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.risk_category : '') || '',
      mitigationStrategy: cap.rawRisk?.mitigation_strategy || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.mitigation_strategy : '') || '',
      capabilityId: cap.id || '',
      capabilityName: cap.name || '',
      band,
      mode: capMode,
      maturityLevel: cap.maturity_level,
      targetMaturityLevel: cap.target_maturity_level,
      buildStatus: cap.build_status,
      executeStatus: cap.execute_status,
      kpiAchievementPct: kpiPct,
      buildExposurePct: cap.build_exposure_pct,
      peopleScore: cap.people_score,
      processScore: cap.process_score,
      toolsScore: cap.tools_score,
      expectedDelayDays: cap.expected_delay_days,
      operateTrendFlag: cap.rawRisk?.operate_trend_flag,
      operationalHealthPct: cap.rawRisk?.operational_health_pct,
      prevOperationalHealthPct: cap.rawRisk?.prev_operational_health_pct,
      prev2OperationalHealthPct: cap.rawRisk?.prev2_operational_health_pct,
      yearlyTrend: cap.yearlyTrend,
      selectedOption: {
        id: option.id,
        title: option.title,
        description: option.description,
        impact: option.impact,
        timeline: option.timeline,
        confidence: option.confidence,
      },
      riskAnalysisNarrative: riskReportHtml,
      riskAnalysisArtifacts: riskArtifacts,
      riskAnalysis: {
        risk_id: cap.rawRisk?.id || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.id : '') || '',
        risk_name: cap.rawRisk?.name || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.name : '') || '',
        risk_category: cap.rawRisk?.risk_category || (isL2 ? cap.l3.find((c: any) => c.rawRisk)?.rawRisk?.risk_category : '') || '',
        capability_id: cap.id || '',
        capability_name: cap.name || '',
        band,
        mode: capMode,
        selected_strategy: option.title,
        strategy_description: option.description,
        narrative_html: riskReportHtml,
        people_score: cap.people_score,
        process_score: cap.process_score,
        tools_score: cap.tools_score,
        maturity_level: cap.maturity_level,
        target_maturity_level: cap.target_maturity_level,
        kpi_achievement_pct: kpiPct,
        build_exposure_pct: cap.build_exposure_pct,
        dependency_count: cap.dependency_count,
        build_status: cap.build_status,
        execute_status: cap.execute_status,
        snapshot_date: new Date().toISOString(),
        artifacts: riskArtifacts,
      } as RiskAnalysisSnapshot,
      capDataYear: cap.year || selectedYear,
      selectedYear,
    };

    setIsRiskModalOpen(false);
    setRiskOptions(null);

    if (onIntervene) {
      onIntervene(ctx);
    } else {
      // Fallback: store context and navigate to planning desk
      sessionStorage.setItem('interventionContext', JSON.stringify(ctx));
      navigate('/josoor?view=planning-desk');
    }
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

    const capId = cap.id;
    const capName = cap.name || capId;
    const capYear = cap.year || selectedYear;
    const isL2 = !!cap.l3;
    // Mode: L3 has cap.mode; L2 derives from children (CapabilityDetailPanel line 896)
    const capMode = cap.mode || (isL2 && cap.l3.some((c: any) => c.mode === 'execute') ? 'execute' : 'build');
    const statusField = capMode === 'execute' ? cap.execute_status : cap.build_status;

    const lang = document.documentElement.dir === 'rtl' ? 'Arabic' : 'English';

    // KPI: L3 direct, L2 from upwardChain (same derivation as CapabilityDetailPanel)
    const kpiPct = cap.kpi_achievement_pct ?? (() => {
      const pt = cap.upwardChain?.performanceTargets?.[0];
      if (!pt) return undefined;
      const actual = pt.actual_value != null ? Number(pt.actual_value) : null;
      const target = pt.target != null ? Number(pt.target) : null;
      if (actual == null || target == null || target <= 0) return undefined;
      return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
    })();

    // Band: raw status value (issues, at-risk, ontrack, etc.)
    const band = statusField || 'unknown';

    // Build supplementary context lines (only include fields that have values)
    const contextLines: string[] = [];
    contextLines.push(`Capability Name: ${capName}`);
    contextLines.push(`Mode: ${capMode}`);
    contextLines.push(`Band: ${band}`);
    if (cap.build_status) contextLines.push(`Build Status: ${cap.build_status}`);
    if (cap.execute_status) contextLines.push(`Execute Status: ${cap.execute_status}`);
    if (cap.maturity_level != null) contextLines.push(`Maturity Level: ${cap.maturity_level}`);
    if (cap.target_maturity_level != null) contextLines.push(`Target Maturity Level: ${cap.target_maturity_level}`);
    if (kpiPct != null) contextLines.push(`KPI Achievement: ${kpiPct}%`);
    if (cap.build_exposure_pct != null) contextLines.push(`Build Exposure: ${cap.build_exposure_pct}%`);
    if (cap.people_score != null) contextLines.push(`People Score: ${cap.people_score}`);
    if (cap.process_score != null) contextLines.push(`Process Score: ${cap.process_score}`);
    if (cap.tools_score != null) contextLines.push(`Tools Score: ${cap.tools_score}`);
    // Trend / delay data
    if (cap.expected_delay_days != null) contextLines.push(`Expected Delay Days: ${cap.expected_delay_days}`);
    // Risk fields from rawRisk (L3 only)
    const risk = cap.rawRisk;
    if (risk) {
      if (risk.id) contextLines.push(`Risk ID: ${risk.id}`);
      if (risk.name) contextLines.push(`Risk Name: ${risk.name}`);
      if (risk.risk_category) contextLines.push(`Risk Category: ${risk.risk_category}`);
      if (risk.risk_status) contextLines.push(`Risk Status: ${risk.risk_status}`);
      if (risk.mitigation_strategy) contextLines.push(`Mitigation Strategy: ${risk.mitigation_strategy}`);
      if (risk.operate_trend_flag) contextLines.push(`Operate Trend Flag: ${risk.operate_trend_flag}`);
      if (risk.operational_health_pct != null) contextLines.push(`Operational Health: ${risk.operational_health_pct}%`);
      if (risk.prev_operational_health_pct != null) contextLines.push(`Previous Operational Health: ${risk.prev_operational_health_pct}%`);
      if (risk.prev2_operational_health_pct != null) contextLines.push(`Previous-2 Operational Health: ${risk.prev2_operational_health_pct}%`);
    }

    // Yearly trend data (scores across past years)
    if (cap.yearlyTrend?.length > 1) {
      contextLines.push(`\nYearly Trend:`);
      cap.yearlyTrend.forEach((yr: any) => {
        const parts = [`${yr.year}/Q${yr.quarter}`];
        if (yr.build_status) parts.push(`build:${yr.build_status}`);
        if (yr.execute_status) parts.push(`execute:${yr.execute_status}`);
        if (yr.kpi_achievement_pct != null) parts.push(`kpi:${yr.kpi_achievement_pct}%`);
        if (yr.build_exposure_pct != null) parts.push(`exposure:${yr.build_exposure_pct}%`);
        if (yr.people_score != null) parts.push(`people:${yr.people_score}`);
        if (yr.process_score != null) parts.push(`process:${yr.process_score}`);
        if (yr.tools_score != null) parts.push(`tools:${yr.tools_score}`);
        if (yr.maturity_level != null) parts.push(`maturity:${yr.maturity_level}`);
        contextLines.push(`  ${parts.join(' | ')}`);
      });
    }

    // Cumulative data model explanation
    contextLines.push(`\nData Model: Capabilities are cumulative across years. A capability created in 2025 with no 2026 entry remains the active version in 2026. When querying, retrieve all years (year=0) and select the latest entry where year <= ${selectedYear}.`);

    // Template expects capability ID + year first, then supplementary context
    const prompt = `Capability: ${capId}. Reporting Period: ${selectedYear} / Q1. Respond entirely in ${lang}.\n\nSupplementary context:\n${contextLines.join('\n')}`;

    try {
      const response = await chatService.sendMessage({
        query: prompt,
        prompt_key: 'risk_advisory',
        language
      });

      if (response.llm_payload?.answer) {
        const processedArtifacts = response.metadata?.llm_payload?.artifacts ||
                                  response.llm_payload?.artifacts || [];
        const cleanAnswer = response.metadata?.llm_payload?.answer ||
                           response.llm_payload.answer;

        const parsed = parseOptionsResponse(cleanAnswer);
        setRiskReportHtml(parsed.narrative);
        setRiskOptions(parsed.options);
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
          onSelectL3={(l3) => {
            setSelectedL2(null);
            setSelectedL3(l3);
          }}
        />
      )}

      {/* AI Risk Analysis Modal */}
      <StrategyReportModal
        isOpen={isRiskModalOpen}
        onClose={() => {
          setIsRiskModalOpen(false);
          setRiskOptions(null);
        }}
        htmlContent={riskReportHtml}
        artifacts={riskArtifacts}
        interventionOptions={riskOptions}
        onSelectOption={handleSelectOption}
        onContinueInChat={() => {
          setIsRiskModalOpen(false);
          if (riskConversationId && onContinueInChat) {
            onContinueInChat(riskConversationId);
          }
        }}
        title={t('josoor.enterprise.riskAdvisory')}
      />
    </div>
  );
}
