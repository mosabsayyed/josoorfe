import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, TrendingUp, Clock, FileText, BarChart3, Shield, Building, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import './ReportingDesk.css';

type ReportView = 'control-outcomes' | 'standard-reports';

export function ReportingDesk() {
  const [selectedView, setSelectedView] = useState<ReportView>('control-outcomes');
  const [archiveCollapsed, setArchiveCollapsed] = useState(false);

  // API State
  const [reportingStats, setReportingStats] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { getReportingStats } = await import('@/services/reportingService');
        const data = await getReportingStats();
        setReportingStats(data);
      } catch (e) {
        console.error('Failed to fetch reporting stats', e);
      }
    };
    fetchReports();
  }, []);

  const viewButtons: { id: ReportView; label: string; description: string }[] = [
    { id: 'control-outcomes', label: 'Control Outcomes', description: 'Primary projection report' },
    { id: 'standard-reports', label: 'Standard Reports', description: 'Byproduct PMO views' },
  ];

  return (
    <div className="reporting-container">
      {/* Header */}
      <div className="reporting-header">
        <h1 className="reporting-title">Reporting Desk</h1>
        <p className="reporting-subtitle">Projection outcomes and standard reporting</p>
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
          title={archiveCollapsed ? 'Expand Archive' : 'Collapse Archive'}
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
                Report Archive
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
            Decision Timeline
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
                    <div className="node-label text-green">Intervention Decision</div>
                    <div className="metric-label">2025-12-15</div>
                    <div className="text-slate-300 text-8px mt-0.5">Pause Project X</div>
                  </div>
                </div>

                <div className="timeline-node">
                  <div className="node-icon bg-amber">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="node-label text-amber">Execution Window</div>
                    <div className="metric-label">Q1 2026 • 45 days</div>
                  </div>
                </div>

                <div className="timeline-node">
                  <div className="node-icon bg-blue">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="node-label text-blue">Measurement Point</div>
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
            Before / After Comparison
          </h3>
          <div className="comparison-block">
            <div className="comparison-title">
              Capability: Plant Operations
            </div>

            <div className="comparison-grid">
              {/* BEFORE Column */}
              <div>
                <div className="comparison-col-header">
                  BEFORE (Dec 2025)
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Risk Exposure</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-red">62%</div>
                      <div className="badge-sm badge-bg-red">
                        RED
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Leakage</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-red">30%</div>
                      <div className="badge-sm badge-bg-red">
                        BROKEN
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Load</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-red">5</div>
                      <AlertCircle className="w-3 h-3 text-red" />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Mode</div>
                    <div className="badge-sm badge-bg-blue text-center">
                      BUILD
                    </div>
                  </div>
                </div>
              </div>

              {/* AFTER Column */}
              <div>
                <div className="comparison-col-header header-green">
                  AFTER (Mar 2026)
                </div>
                <div className="metrics-grid">
                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">Risk Exposure</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-green">38%</div>
                      <div className="badge-sm badge-bg-amber">
                        AMBER
                      </div>
                    </div>
                    <div className="trend-badge text-green">
                      <TrendingUp className="w-2.5 h-2.5 rotate-180" />
                      -24%
                    </div>
                  </div>

                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">Leakage</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-green">12%</div>
                      <div className="badge-sm badge-bg-green">
                        HEALTHY
                      </div>
                    </div>
                    <div className="trend-badge text-green">
                      <TrendingUp className="w-2.5 h-2.5 rotate-180" />
                      -18%
                    </div>
                  </div>

                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">Load</div>
                    <div className="metric-val-flex">
                      <div className="val-large text-green">3</div>
                      <CheckCircle className="w-3 h-3 text-green" />
                    </div>
                    <div className="trend-badge text-green">-2</div>
                  </div>

                  <div className="metric-card metric-card-green-border">
                    <div className="metric-label">Mode</div>
                    <div className="badge-sm badge-bg-green text-center">
                      OPERATE
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
                  Did the intervention work? YES - Significant improvement across all metrics
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Residuals & Escalations (compact horizontal) */}
        <div>
          <h3 className="section-title">
            Residuals & Escalations
          </h3>
          <div className="residuals-grid">
            <div className="residual-block">
              <div className="block-header-amber">
                Remaining Risks
              </div>
              <div className="residual-list">
                <div className="residual-item">
                  <div className="dot-amber" />
                  <div className="text-gray text-8px">
                    Delay risk at 38% (acceptable)
                  </div>
                </div>
                <div className="residual-item">
                  <div className="dot-amber" />
                  <div className="text-gray text-8px">
                    Process gap Medium (monitoring)
                  </div>
                </div>
              </div>
            </div>

            <div className="residual-block">
              <div className="block-header-red">
                Structural Issues
              </div>
              <div className="residual-list">
                <div className="residual-item">
                  <div className="dot-red" />
                  <div className="text-gray text-8px">
                    Distribution overloaded
                  </div>
                </div>
                <div className="residual-item">
                  <div className="dot-red" />
                  <div className="text-gray text-8px">
                    PT-03 underperforming
                  </div>
                </div>
              </div>
            </div>

            <div className="residual-block border-red-2">
              <div className="block-header-red">
                Escalation Required?
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="escalation-badge">
                  YES
                </div>
              </div>
              <div className="text-gray text-8px leading-relaxed">
                Distribution requires executive review
              </div>
              <div className="mt-2 pt-2 border-t border-[rgba(148,163,184,0.2)]">
                <div className="text-slate-500 text-7px normal">
                  Feeds to Control Signals
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
          title={archiveCollapsed ? 'Expand Archive' : 'Collapse Archive'}
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
                Report Archive
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
              Report Builder
            </h3>
            <div className="action-btn-group">
              <button className="btn-secondary">
                <Download className="w-3 h-3" />
                Export PDF
              </button>
              <button className="btn-primary">
                <FileText className="w-3 h-3" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Builder Controls in Grid */}
          <div className="builder-controls">
            {/* Report Type */}
            <div>
              <div className="control-label">Report Type</div>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="control-input"
              >
                <option value="performance">📊 Performance</option>
                <option value="risk">🛡️ Risk Assessment</option>
                <option value="portfolio">🏢 Portfolio Status</option>
                <option value="ministerial">📄 Ministerial Brief</option>
              </select>
            </div>

            {/* Time Window */}
            <div>
              <div className="control-label">Time Window</div>
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
                <div className="text-label text-8px mb-1.5">Sector</div>
                <select className="control-input">
                  <option>Water</option>
                  <option>Energy</option>
                  <option>All</option>
                </select>
              </div>
              <div>
                <div className="text-label text-8px mb-1.5">Entity</div>
                <select className="control-input">
                  <option>All</option>
                  <option>Desal Corp</option>
                  <option>Distribution</option>
                </select>
              </div>
              <div>
                <div className="text-label text-8px mb-1.5">Capability</div>
                <select className="control-input">
                  <option>All</option>
                  <option>Plant Ops</option>
                  <option>Distribution</option>
                </select>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-end">
              <div className="draft-badge">
                DRAFT
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
                    {selectedReportType === 'performance' && 'Performance Report'}
                    {selectedReportType === 'risk' && 'Risk Assessment Report'}
                    {selectedReportType === 'portfolio' && 'Portfolio Status Report'}
                    {selectedReportType === 'ministerial' && 'Ministerial Brief'}
                  </h2>
                  <div className="sheet-meta">
                    Period: {selectedTimeWindow.toUpperCase()} • Generated: {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="sheet-draft-tag">
                  DRAFT
                </div>
              </div>

              {/* Executive Summary */}
              <div className="sheet-section">
                <div className="section-title">
                  Executive Summary
                </div>
                <div className="sheet-text">
                  The water sector demonstrated strong performance in Q1 2026, with 22 of 45
                  capabilities now stabilized. Risk exposure decreased by 18% following targeted
                  interventions in Plant Operations and Quality Control. Six chronic risks remain
                  under active management, requiring continued executive oversight.
                </div>
              </div>

              {/* Key Metrics Table */}
              <div className="sheet-section">
                <div className="section-title">
                  Key Metrics
                </div>
                <table className="sheet-table">
                  <thead>
                    <tr>
                      <th className="sheet-th">
                        Metric
                      </th>
                      <th className="sheet-th sheet-th-right">
                        Current
                      </th>
                      <th className="sheet-th sheet-th-right">
                        Target
                      </th>
                      <th className="sheet-th sheet-th-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric: 'Avg Risk Exposure', current: '42%', target: '35%', status: 'amber' },
                      { metric: 'Capabilities Stabilized', current: '22/45', target: '30/45', status: 'amber' },
                      { metric: 'Avg Leakage %', current: '14%', target: '10%', status: 'amber' },
                      { metric: 'Projects On-Time', current: '78%', target: '85%', status: 'amber' },
                      { metric: 'Policy Tool Effectiveness', current: '88%', target: '80%', status: 'green' },
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
                  Analysis Narrative (Agent-Written)
                </div>
                <div className="narrative-box">
                  <p>
                    <strong className="text-slate-200">Performance Trend:</strong> Plant Operations
                    capability demonstrated significant improvement following the Q4 2025 intervention
                    to pause Project X. Risk exposure decreased from 62% to 38%, and operational load
                    reduced from 5 to 3 active projects.
                  </p>
                  <p>
                    <strong className="text-slate-200">Areas of Concern:</strong> Distribution
                    Management remains overloaded with persistent process gaps. This structural issue
                    requires strategic reset consideration in the annual planning cycle.
                  </p>
                  <p>
                    <strong className="text-slate-200">Recommendations:</strong> Continue monitoring
                    Plant Operations in OPERATE mode. Initiate intervention planning for Distribution
                    capability before Q2 2026. Escalate Policy Tool PT-03 effectiveness to ministerial
                    review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence & Audit Panel (20%) */}
          <div className="info-sidebar">
            <h3 className="section-title">
              Evidence & Audit
            </h3>

            <div className="info-block">
              <div className="block-header-gray">
                Data Sources
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
                Last Updated
              </div>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">Capability data:</span>
                  <span className="info-val">2026-01-08</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Risk assessments:</span>
                  <span className="info-val">2026-01-07</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Project status:</span>
                  <span className="info-val">2026-01-09</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Performance metrics:</span>
                  <span className="info-val-amber">2026-01-05</span>
                </div>
              </div>
            </div>

            <div className="info-block">
              <div className="block-header-gray">
                Confidence Level
              </div>
              <div className="mb-3">
                <div className="info-row mb-1">
                  <span className="info-label">Overall Confidence</span>
                  <span className="info-val">87%</span>
                </div>
                <div className="confidence-bar-bg">
                  <div className="confidence-bar-fill" style={{ width: '87%' }} />
                </div>
              </div>
              <div className="text-gray text-8px leading-relaxed">
                High confidence. All primary data sources current within 7 days. Performance metrics
                require refresh.
              </div>
            </div>

            <div className="missing-block">
              <div className="block-header-red">
                Missing Inputs
              </div>
              <div className="info-list">
                <div className="info-item">
                  <AlertCircle className="w-3 h-3 text-red mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    3 capabilities missing maturity scores
                  </div>
                </div>
                <div className="info-item">
                  <AlertCircle className="w-3 h-3 text-red mt-0.5 flex-shrink-0" />
                  <div className="info-text">
                    2 projects without adoption data
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
