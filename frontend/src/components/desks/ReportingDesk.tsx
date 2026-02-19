import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, TrendingUp, Clock, FileText, BarChart3, Shield, Building, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import './ReportingDesk.css';

type ReportView = 'control-outcomes' | 'standard-reports';

export function ReportingDesk() {
  const { t } = useTranslation();
  const [selectedView, setSelectedView] = useState<ReportView>('control-outcomes');
  const [archiveCollapsed, setArchiveCollapsed] = useState(false);

  // API State - Using static mock data for now
  const [reportingStats, setReportingStats] = useState<any>(null);

  // TODO: Wire to real API later
  // useEffect(() => {
  //   const fetchReports = async () => {
  //     try {
  //       const { getReportingStats } = await import('@/services/reportingService');
  //       const data = await getReportingStats();
  //       setReportingStats(data);
  //     } catch (e) {
  //       console.error('Failed to fetch reporting stats', e);
  //     }
  //   };
  //   fetchReports();
  // }, []);

  const viewButtons: { id: ReportView; label: string; description: string }[] = [
    { id: 'control-outcomes', label: t('josoor.reporting.controlOutcomes'), description: t('josoor.reporting.primaryProjectionReport') },
    { id: 'standard-reports', label: t('josoor.reporting.standardReports'), description: t('josoor.reporting.byproductPmoViews') },
  ];

  return (
    <div className="reporting-container">
      {/* Header */}
      <div className="reporting-header">
        <h1 className="reporting-title">{t('josoor.reporting.title')}</h1>
        <p className="reporting-subtitle">{t('josoor.reporting.subtitle')}</p>
      </div>

      {/* View Selection */}
      <div className="view-selection">
        <div className="view-buttons-container">
          {viewButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedView(btn.id)}
              className={`view-btn ${selectedView === btn.id
                ? 'view-btn-active'
                : 'view-btn-inactive'
                }`}
            >
              <div className="view-btn-label">{btn.label}</div>
              <div className={`view-btn-desc ${selectedView === btn.id ? 'view-btn-desc-active' : 'view-btn-desc-inactive'}`}>
                {btn.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="reporting-content">
        {selectedView === 'control-outcomes' && (
          <ControlOutcomes archiveCollapsed={archiveCollapsed} setArchiveCollapsed={setArchiveCollapsed} />
        )}
        {selectedView === 'standard-reports' && (
          <StandardReports archiveCollapsed={archiveCollapsed} setArchiveCollapsed={setArchiveCollapsed} />
        )}
      </div>
    </div>
  );
}

// A) Control Outcomes (Primary Report)
function ControlOutcomes({ archiveCollapsed, setArchiveCollapsed }: { archiveCollapsed: boolean; setArchiveCollapsed: (collapsed: boolean) => void }) {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState('latest');

  const previousReports = [
    { id: 'latest', capability: 'Plant Operations', date: '2026-03-31', result: 'Success', risk: 'Red → Amber' },
    { id: 'r2', capability: 'Distribution Mgmt', date: '2025-12-15', result: 'Partial', risk: 'Amber → Amber' },
    { id: 'r3', capability: 'Quality Control', date: '2025-09-30', result: 'Success', risk: 'Amber → Green' },
    { id: 'r4', capability: 'Asset Maintenance', date: '2025-06-15', result: 'Failed', risk: 'Amber → Red' },
  ];

  return (
    <div className={`outcomes-grid ${archiveCollapsed ? 'grid-cols-collapsed' : 'grid-cols-expanded'}`}>
      {/* Previously Issued Reports (left sidebar - collapsible) */}
      <div className="archive-sidebar">
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setArchiveCollapsed(!archiveCollapsed)}
          className="collapse-btn"
          title={archiveCollapsed ? t('josoor.reporting.expandArchive') : t('josoor.reporting.collapseArchive')}
        >
          {archiveCollapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-300" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-300" />
          )}
        </button>

        {!archiveCollapsed && (
          <div className="archive-content">
            <div className="archive-header">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="archive-title">
                {t('josoor.reporting.reportArchive')}
              </h3>
            </div>
            <div className="archive-list">
              {previousReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`report-item ${selectedReport === report.id
                    ? 'report-item-active'
                    : 'report-item-inactive'
                    }`}
                >
                  <div className="report-item-title">{report.capability}</div>
                  <div className={`report-item-date ${selectedReport === report.id ? 'date-active' : 'date-inactive'}`}>
                    {report.date}
                  </div>
                  <div className="report-item-footer">
                    <span
                      className={`${report.result === 'Success'
                        ? 'result-success'
                        : report.result === 'Partial'
                          ? 'result-partial'
                          : 'result-failed'
                        } ${selectedReport === report.id ? 'result-white' : ''}`}
                    >
                      {report.result}
                    </span>
                    <span className={`report-risk ${selectedReport === report.id ? 'risk-active' : 'risk-inactive'}`}>
                      {report.risk}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {archiveCollapsed && (
          <div className="archive-collapsed-content">
            <Calendar className="w-4 h-4 text-slate-500 rotate-90" />
            {previousReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                title={`${report.capability} - ${report.date}`}
                className={`collapsed-indicator ${selectedReport === report.id
                  ? 'indicator-active'
                  : report.result === 'Partial'
                    ? 'indicator-partial'
                    : 'indicator-success'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content (right) - Full remaining width */}
      <div className="main-area">
        {/* 1. Decision Timeline (compact horizontal) */}
        <div className="section-group">
          <h3 className="section-title">
            {t('josoor.reporting.decisionTimeline')}
          </h3>
          <div className="timeline-block">
            <div className="relative">
              {/* Timeline bar */}
              <div className="timeline-track" />

              {/* Timeline nodes */}
              <div className="timeline-nodes">
                <div className="timeline-node">
                  <div className="node-icon bg-green">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="node-label text-green">{t('josoor.reporting.interventionDecision')}</div>
                    <div className="metric-label">2025-12-15</div>
                    <div className="text-slate-300 text-8px mt-0.5">{t('josoor.reporting.pauseProjectX')}</div>
                  </div>
                </div>

                <div className="timeline-node">
                  <div className="node-icon bg-amber">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="node-label text-amber">{t('josoor.reporting.executionWindow')}</div>
                    <div className="metric-label">Q1 2026 • 45 days</div>
                  </div>
                </div>

                <div className="timeline-node">
                  <div className="node-icon bg-blue">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="node-label text-blue">{t('josoor.reporting.measurementPoint')}</div>
                    <div className="metric-label">2026-03-31 • Q1 Close</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Before / After Comparison (compact grid) */}
        <div className="section-group">
          <h3 className="section-title">
            {t('josoor.reporting.beforeAfterComparison')}
          </h3>
          <div className="comparison-block">
            <div className="comparison-title">
              {t('josoor.reporting.capabilityPlantOperations')}
            </div>

            <div className="comparison-grid">
              {/* BEFORE Column */}
              <div>
                <div className="comparison-col-header">
                  {t('josoor.reporting.before')} (Dec 2025)
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">{t('josoor.reporting.riskExposure')}</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-red">62%</div>
                      <div className="badge-sm badge-bg-red">
                        {t('josoor.reporting.red')}
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">{t('josoor.reporting.leakage')}</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-red">30%</div>
                      <div className="badge-sm badge-bg-red">
                        {t('josoor.reporting.broken')}
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">{t('josoor.reporting.load')}</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-red">5</div>
                      <AlertCircle className="w-3 h-3 text-red" />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">{t('josoor.reporting.mode')}</div>
                    <div className="badge-sm badge-bg-blue text-center">
                      {t('josoor.reporting.build')}
                    </div>
                  </div>
                </div>
              </div>

              {/* AFTER Column */}
              <div>
                <div className="comparison-col-header header-green">
                  {t('josoor.reporting.after')} (Mar 2026)
                </div>
                <div className="metrics-grid">
                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">{t('josoor.reporting.riskExposure')}</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-green">38%</div>
                      <div className="badge-sm badge-bg-amber">
                        {t('josoor.reporting.amber')}
                      </div>
                    </div>
                    <div className="trend-badge text-green">
                      <TrendingUp className="w-2.5 h-2.5 rotate-180" />
                      -24%
                    </div>
                  </div>

                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">{t('josoor.reporting.leakage')}</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-green">12%</div>
                      <div className="badge-sm badge-bg-green">
                        {t('josoor.reporting.healthy')}
                      </div>
                    </div>
                    <div className="trend-badge text-green">
                      <TrendingUp className="w-2.5 h-2.5 rotate-180" />
                      -18%
                    </div>
                  </div>

                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">{t('josoor.reporting.load')}</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-green">3</div>
                      <CheckCircle className="w-3 h-3 text-green" />
                    </div>
                    <div className="trend-badge text-green">-2</div>
                  </div>

                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">{t('josoor.reporting.mode')}</div>
                    <div className="badge-sm badge-bg-green text-center">
                      {t('josoor.reporting.operate')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success indicator */}
            <div className="success-indicator">
              <div className="success-box">
                <CheckCircle className="w-5 h-5 text-green" />
                <div className="text-green text-10px font-bold">
                  {t('josoor.reporting.interventionResult')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Residuals & Escalations (compact horizontal) */}
        <div>
          <h3 className="section-title">
            {t('josoor.reporting.residualsEscalations')}
          </h3>
          <div className="residuals-grid">
            <div className="residual-block">
              <div className="block-header-amber">
                {t('josoor.reporting.remainingRisks')}
              </div>
              <div className="residual-list">
                <div className="residual-item">
                  <div className="dot-amber" />
                  <div className="text-gray text-8px">
                    {t('josoor.reporting.delayRiskAcceptable')}
                  </div>
                </div>
                <div className="residual-item">
                  <div className="dot-amber" />
                  <div className="text-gray text-8px">
                    {t('josoor.reporting.processGapMonitoring')}
                  </div>
                </div>
              </div>
            </div>

            <div className="residual-block">
              <div className="block-header-red">
                {t('josoor.reporting.structuralIssues')}
              </div>
              <div className="residual-list">
                <div className="residual-item">
                  <div className="dot-red" />
                  <div className="text-gray text-8px">
                    {t('josoor.reporting.distributionOverloaded')}
                  </div>
                </div>
                <div className="residual-item">
                  <div className="dot-red" />
                  <div className="text-gray text-8px">
                    {t('josoor.reporting.pt03Underperforming')}
                  </div>
                </div>
              </div>
            </div>

            <div className="residual-block border-red-2">
              <div className="block-header-red">
                {t('josoor.reporting.escalationRequired')}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="escalation-badge">
                  {t('josoor.reporting.yes')}
                </div>
              </div>
              <div className="text-gray text-8px leading-relaxed">
                {t('josoor.reporting.distributionExecutiveReview')}
              </div>
              <div className="mt-2 pt-2 border-t border-[rgba(148,163,184,0.2)]">
                <div className="text-slate-500 text-7px normal">
                  {t('josoor.reporting.feedsToControlSignals')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// B) Standard Reports (Byproduct Views)
function StandardReports({ archiveCollapsed, setArchiveCollapsed }: { archiveCollapsed: boolean; setArchiveCollapsed: (collapsed: boolean) => void }) {
  const { t } = useTranslation();
  const [selectedReportType, setSelectedReportType] = useState('performance');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState('q1-2026');
  const [selectedReport, setSelectedReport] = useState('latest');

  const previousReports = [
    { id: 'latest', type: 'Performance', period: 'Q1 2026', date: '2026-01-09', status: 'Draft' },
    { id: 'r2', type: 'Risk', period: 'Q4 2025', date: '2025-12-28', status: 'Final' },
    { id: 'r3', type: 'Portfolio', period: 'H2 2025', date: '2025-12-20', status: 'Final' },
    { id: 'r4', type: 'Ministerial', period: 'FY 2025', date: '2025-12-15', status: 'Final' },
  ];

  return (
    <div className={`outcomes-grid ${archiveCollapsed ? 'grid-cols-collapsed' : 'grid-cols-expanded'}`}>
      {/* Previously Issued Reports (left sidebar - collapsible) */}
      <div className="archive-sidebar">
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setArchiveCollapsed(!archiveCollapsed)}
          className="collapse-btn"
          title={archiveCollapsed ? t('josoor.reporting.expandArchive') : t('josoor.reporting.collapseArchive')}
        >
          {archiveCollapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-300" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-300" />
          )}
        </button>

        {!archiveCollapsed && (
          <div className="archive-content">
            <div className="archive-header">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="archive-title">
                {t('josoor.reporting.reportArchive')}
              </h3>
            </div>
            <div className="archive-list">
              {previousReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`report-item ${selectedReport === report.id
                    ? 'report-item-active'
                    : 'report-item-inactive'
                    }`}
                >
                  <div className="report-item-title">{report.type}</div>
                  <div className={`report-item-date ${selectedReport === report.id ? 'date-active' : 'date-inactive'}`}>
                    {report.period}
                  </div>
                  <div className="report-item-footer">
                    <span className={`report-item-date ${selectedReport === report.id ? 'date-active' : 'date-inactive'}`}>
                      {report.date}
                    </span>
                    <span
                      className={`badge-sm ${report.status === 'Draft'
                        ? 'badge-bg-amber'
                        : 'badge-bg-green'
                        } ${selectedReport === report.id ? 'bg-white text-green' : ''}`}
                    >
                      {report.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {archiveCollapsed && (
          <div className="archive-collapsed-content">
            <Calendar className="w-4 h-4 text-slate-500 rotate-90" />
            {previousReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                title={`${report.type} - ${report.period}`}
                className={`collapsed-indicator ${selectedReport === report.id
                  ? 'indicator-active'
                  : report.status === 'Draft'
                    ? 'indicator-partial'
                    : 'indicator-success'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content (right) */}
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Report Builder - Full Width Row */}
        <div className="report-builder-bar">
          <div className="builder-header-row">
            <h3 className="section-title">
              {t('josoor.reporting.reportBuilder')}
            </h3>
            <div className="action-btn-group">
              <button className="btn-secondary">
                <Download className="w-3 h-3" />
                {t('josoor.reporting.exportPdf')}
              </button>
              <button className="btn-primary">
                <FileText className="w-3 h-3" />
                {t('josoor.reporting.generateReport')}
              </button>
            </div>
          </div>

          {/* Builder Controls in Grid */}
          <div className="builder-controls">
            {/* Report Type */}
            <div>
              <div className="control-label">{t('josoor.reporting.reportType')}</div>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="control-input"
              >
                <option value="performance">{t('josoor.reporting.performance')}</option>
                <option value="risk">{t('josoor.reporting.riskAssessment')}</option>
                <option value="portfolio">{t('josoor.reporting.portfolioStatus')}</option>
                <option value="ministerial">{t('josoor.reporting.ministerialBrief')}</option>
              </select>
            </div>

            {/* Time Window */}
            <div>
              <div className="control-label">{t('josoor.reporting.timeWindow')}</div>
              <select
                value={selectedTimeWindow}
                onChange={(e) => setSelectedTimeWindow(e.target.value)}
                className="control-input"
              >
                <option value="q4-2025">Q4 2025</option>
                <option value="q1-2026">Q1 2026</option>
                <option value="h1-2026">H1 2026</option>
                <option value="fy-2026">FY 2026</option>
              </select>
            </div>

            {/* Scope Filters */}
            <div className="scope-grid">
              <div>
                <div className="text-label text-8px mb-1.5">{t('josoor.reporting.sector')}</div>
                <select className="control-input">
                  <option>{t('josoor.reporting.water')}</option>
                  <option>{t('josoor.reporting.energy')}</option>
                  <option>{t('josoor.common.all')}</option>
                </select>
              </div>
              <div>
                <div className="text-label text-8px mb-1.5">{t('josoor.reporting.entity')}</div>
                <select className="control-input">
                  <option>{t('josoor.common.all')}</option>
                  <option>Desal Corp</option>
                  <option>{t('josoor.reporting.distribution')}</option>
                </select>
              </div>
              <div>
                <div className="text-label text-8px mb-1.5">{t('josoor.reporting.capability')}</div>
                <select className="control-input">
                  <option>{t('josoor.common.all')}</option>
                  <option>{t('josoor.reporting.plantOps')}</option>
                  <option>{t('josoor.reporting.distribution')}</option>
                </select>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-end">
              <div className="draft-badge">
                {t('josoor.reporting.draft')}
              </div>
            </div>
          </div>
        </div>

        {/* Preview and Evidence - 80/20 Split */}
        <div className="preview-layout">
          {/* Live Preview (80%) */}
          <div className="preview-main">
            <div className="paper-sheet">
              {/* Report Header */}
              <div className="sheet-header">
                <div>
                  <h2 className="sheet-title">
                    {selectedReportType === 'performance' && t('josoor.reporting.performanceReport')}
                    {selectedReportType === 'risk' && t('josoor.reporting.riskAssessmentReport')}
                    {selectedReportType === 'portfolio' && t('josoor.reporting.portfolioStatusReport')}
                    {selectedReportType === 'ministerial' && t('josoor.reporting.ministerialBrief')}
                  </h2>
                  <div className="sheet-meta">
                    {t('josoor.reporting.period')}: {selectedTimeWindow.toUpperCase()} • {t('josoor.reporting.generated')}: {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="sheet-draft-tag">
                  {t('josoor.reporting.draft')}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="sheet-section">
                <div className="section-title">
                  {t('josoor.reporting.executiveSummary')}
                </div>
                <div className="sheet-text">
                  {t('josoor.reporting.executiveSummaryText')}
                </div>
              </div>

              {/* Key Metrics Table */}
              <div className="sheet-section">
                <div className="section-title">
                  {t('josoor.reporting.keyMetrics')}
                </div>
                <table className="sheet-table">
                  <thead>
                    <tr>
                      <th className="sheet-th">
                        {t('josoor.reporting.metric')}
                      </th>
                      <th className="sheet-th sheet-th-right">
                        {t('josoor.reporting.current')}
                      </th>
                      <th className="sheet-th sheet-th-right">
                        {t('josoor.reporting.target')}
                      </th>
                      <th className="sheet-th sheet-th-right">
                        {t('josoor.reporting.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric: t('josoor.reporting.avgRiskExposure'), current: '42%', target: '35%', status: 'amber' },
                      { metric: t('josoor.reporting.capabilitiesStabilized'), current: '22/45', target: '30/45', status: 'amber' },
                      { metric: t('josoor.reporting.avgLeakage'), current: '14%', target: '10%', status: 'amber' },
                      { metric: t('josoor.reporting.projectsOnTime'), current: '78%', target: '85%', status: 'amber' },
                      { metric: t('josoor.reporting.policyToolEffectiveness'), current: '88%', target: '80%', status: 'green' },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="sheet-td">{row.metric}</td>
                        <td className="sheet-td sheet-td-right font-bold">
                          {row.current}
                        </td>
                        <td className="sheet-td sheet-td-right sheet-td-gray">
                          {row.target}
                        </td>
                        <td className="sheet-td sheet-td-right">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${row.status === 'green'
                              ? 'bg-green'
                              : row.status === 'amber'
                                ? 'bg-amber'
                                : 'bg-red'
                              }`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Narrative Section */}
              <div>
                <div className="section-title">
                  {t('josoor.reporting.analysisNarrative')}
                </div>
                <div className="narrative-box">
                  <p>
                    <strong className="text-slate-200">{t('josoor.reporting.performanceTrend')}:</strong> {t('josoor.reporting.performanceTrendText')}
                  </p>
                  <p>
                    <strong className="text-slate-200">{t('josoor.reporting.areasOfConcern')}:</strong> {t('josoor.reporting.areasOfConcernText')}
                  </p>
                  <p>
                    <strong className="text-slate-200">{t('josoor.reporting.recommendations')}:</strong> {t('josoor.reporting.recommendationsText')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence & Audit Panel (20%) */}
          <div className="info-sidebar">
            <h3 className="section-title">
              {t('josoor.reporting.evidenceAudit')}
            </h3>

            <div className="info-block">
              <div className="block-header-gray">
                {t('josoor.reporting.dataSources')}
              </div>
              <div className="info-list">
                <div className="info-item">
                  <CheckCircle className="w-3 h-3 text-green mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    Entity.Capability (45 records)
                  </div>
                </div>
                <div className="info-item">
                  <CheckCircle className="w-3 h-3 text-green mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    Entity.Risk (86 records)
                  </div>
                </div>
                <div className="info-item">
                  <CheckCircle className="w-3 h-3 text-green mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    Entity.Project (124 records)
                  </div>
                </div>
                <div className="info-item">
                  <CheckCircle className="w-3 h-3 text-green mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    Sector.PolicyTool (28 records)
                  </div>
                </div>
                <div className="info-item">
                  <CheckCircle className="w-3 h-3 text-green mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    Sector.Performance (35 records)
                  </div>
                </div>
              </div>
            </div>

            <div className="info-block">
              <div className="block-header-gray">
                {t('josoor.reporting.lastUpdated')}
              </div>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">{t('josoor.reporting.capabilityData')}:</span>
                  <span className="info-val">2026-01-08</span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('josoor.reporting.riskAssessments')}:</span>
                  <span className="info-val">2026-01-07</span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('josoor.reporting.projectStatus')}:</span>
                  <span className="info-val">2026-01-09</span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('josoor.reporting.performanceMetrics')}:</span>
                  <span className="info-val-amber">2026-01-05</span>
                </div>
              </div>
            </div>

            <div className="info-block">
              <div className="block-header-gray">
                {t('josoor.reporting.confidenceLevel')}
              </div>
              <div className="mb-3">
                <div className="info-row mb-1">
                  <span className="info-label">{t('josoor.reporting.overallConfidence')}</span>
                  <span className="info-val">87%</span>
                </div>
                <div className="confidence-bar-bg">
                  <div className="confidence-bar-fill" style={{ width: '87%' }} />
                </div>
              </div>
              <div className="text-gray text-8px leading-relaxed">
                {t('josoor.reporting.confidenceDescription')}
              </div>
            </div>

            <div className="missing-block">
              <div className="block-header-red">
                {t('josoor.reporting.missingInputs')}
              </div>
              <div className="info-list">
                <div className="info-item">
                  <AlertCircle className="w-3 h-3 text-red mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    {t('josoor.reporting.missingMaturityScores')}
                  </div>
                </div>
                <div className="info-item">
                  <AlertCircle className="w-3 h-3 text-red mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    {t('josoor.reporting.missingAdoptionData')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
