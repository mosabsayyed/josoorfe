import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import './ConceptHelpPopover.css';

interface ConceptHelpOverlayProps {
  active: boolean;
  deskType: string;
}

export const ConceptHelpOverlay: React.FC<ConceptHelpOverlayProps> = ({ active, deskType }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ explanation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset when deactivated
  useEffect(() => {
    if (!active) {
      setClickPos(null);
      setTerm('');
      setResponse(null);
      setError(null);
      setLoading(false);
    }
  }, [active]);

  // Escape dismisses response panel
  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setClickPos(null);
        setTerm('');
        setResponse(null);
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active]);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Rich app context for each desk type — what it is, what it contains, what it's used for
  const appContext: Record<string, string> = {
    ontology: [
      'The Start Here (Ontology) app visualizes the organizational ontology as an interactive graph.',
      'It shows how entity types connect through chains: Projects → Change Adoption → Processes → Capabilities → Org Units → IT Systems.',
      'There are 4 chains: change_to_capability, capability_to_policy, capability_to_performance, and sector_value_chain.',
      'Each connection line shows flow health — orphan/bastard detection per leg, with green (healthy), amber (some breaks), or red (many breaks) indicators.',
      'The app contains node counts, relationship counts, triage panels ranking items by impact/urgency/dependencies, and drill-down expansion for each entity type.',
      'It is used by executives and analysts to understand how the organization\'s digital transformation components are connected and where the gaps are.',
    ].join(' '),
    enterprise: [
      'The Enterprise Desk shows capability maturity and operational health across the entire organization.',
      'It displays stage gates (S1–S5) measuring maturity across 3 dimensions: People, Process, and Tools — the level is the LOWEST of the three.',
      'Capabilities are in either BUILD mode (being developed, scored 0 or 1) or OPERATE mode (live, with KPI performance gauges and risk exposure overlays).',
      'The risk exposure overlay shows dependency count as a gradient heatmap — higher dependency = higher exposure.',
      'KPI strips use traffic-light colors: green (≥90%), amber (≥70%), red (<70%) based on actual vs target achievement.',
      'The L2 panel shows two blocks: "Capabilities in Operation" first, then "Being Built" second, with rollup using MIN of children.',
      'It is used by leadership to monitor which capabilities are mature, which are at risk, and where intervention is needed.',
    ].join(' '),
    sector: [
      'The Sector Desk maps the value chain for a specific sector (e.g., healthcare, education, finance).',
      'It shows how organizational capabilities deliver sector-level outcomes through a Sankey diagram and data tables.',
      'Each sector has its own value chain showing the flow from inputs through activities to outputs and outcomes.',
      'It contains sector-specific KPIs, capability mappings, and performance indicators.',
      'It is used by sector strategists to understand how organizational capabilities serve sector-specific goals and where sector performance gaps exist.',
    ].join(' '),
    explorer: [
      'The Explorer Desk is a direct query interface to the organizational knowledge graph (Neo4j).',
      'Users can browse nodes (entities) and relationships, view their properties, and run queries.',
      'It shows entity types like EntityProject, EntityCapability, EntityProcess, EntityOrgUnit, EntityITSystem, and their relationships.',
      'The desk includes a 3D graph visualization, data tables, and Sankey flow diagrams.',
      'It is used by analysts and data teams to investigate specific data points, verify relationships, and explore the organizational graph in detail.',
    ].join(' '),
    planning: [
      'The Planning Lab is where risk-based intervention plans are created and managed.',
      'Interventions attach to specific RISKS (not capabilities) — each risk can have a RiskPlan with 3 levels: L1=Sponsor, L2=Deliverable, L3=Task.',
      'The lab includes a Gantt chart (SVAR React Gantt) for scheduling deliverables and tasks.',
      'Plans are stored as RiskPlan nodes in Neo4j, linked to the risks they address.',
      'It is used by project managers and risk owners to define concrete actions, assign responsibilities, and track progress against identified risks.',
    ].join(' '),
    chat: [
      'The AI Chat interface where users interact with Josoor\'s AI advisors.',
      'It supports multiple expert personas: Strategy Advisor, Risk Analyst, Operations Expert, Change Management Specialist, and Sector Analyst.',
      'The chat has access to tools like Recall Memory (organizational knowledge graph) and Search Vision DB (document analysis).',
      'Users can request strategy briefs, risk advisories, intervention plans, stakeholder communications, and general analysis.',
      'It is used by executives and managers to get AI-powered insights, recommendations, and analysis based on their organization\'s actual data.',
    ].join(' '),
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (panelRef.current?.contains(e.target as Node)) return;

    // Hide overlay to find the real element underneath
    if (overlayRef.current) overlayRef.current.style.pointerEvents = 'none';
    const realTarget = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (overlayRef.current) overlayRef.current.style.pointerEvents = '';

    if (!realTarget) return;

    const tagName = realTarget.tagName.toLowerCase();
    // Skip non-text elements
    if (['img', 'svg', 'path', 'rect', 'circle', 'canvas', 'video', 'iframe'].includes(tagName)) return;
    // Skip UI controls — buttons, inputs, selects, nav items
    if (['button', 'input', 'select', 'option', 'textarea', 'a', 'nav'].includes(tagName)) return;
    // Skip elements with button/tab/nav roles
    const role = realTarget.getAttribute('role');
    if (role && ['button', 'tab', 'menuitem', 'option', 'switch', 'checkbox', 'radio', 'slider', 'navigation', 'link'].includes(role)) return;
    // Skip if inside a button or interactive control
    if (realTarget.closest('button, a, select, input, textarea, [role="button"], [role="tab"], [role="menuitem"], [role="slider"], nav')) return;

    // Get the phrase text from the clicked element (not single word)
    let text = (realTarget.innerText || realTarget.textContent || '').trim();
    if (!text) return;

    // If too long, get direct text nodes only
    if (text.length > 120) {
      const directText = Array.from(realTarget.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => (n.textContent || '').trim())
        .filter(Boolean)
        .join(' ');
      if (directText) text = directText;
    }
    text = text.slice(0, 120);
    // Skip very short text (UI labels like "3D", "EN", "×")
    if (text.length < 4) return;

    // Gather surrounding context from parent/siblings
    const parent = realTarget.parentElement;
    let surroundingContext = '';
    if (parent) {
      const parentText = (parent.innerText || '').trim().slice(0, 300);
      if (parentText && parentText !== text) {
        surroundingContext = parentText;
      }
    }

    e.stopPropagation();
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickPos({ x, y });
    setTerm(text);
    setResponse(null);
    setError(null);
    setLoading(true);

    const deskDescription = appContext[deskType] || `The ${deskType} application.`;

    fetch('/api/v1/knowledge/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        term: text,
        app_name: deskType,
        app_context: [
          deskDescription,
          surroundingContext ? `The term appears in this context: "${surroundingContext}"` : '',
        ].filter(Boolean).join(' '),
        language,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then(data => setResponse(data))
      .catch(() => setError(isAr ? 'تعذر الاتصال. حاول مرة أخرى.' : 'Could not connect. Please try again.'))
      .finally(() => setLoading(false));
  }, [deskType, language, isAr]);

  if (!active) return null;

  // Calculate panel position (keep within bounds)
  const panelStyle: React.CSSProperties = clickPos ? {
    position: 'absolute',
    left: Math.min(clickPos.x, (typeof window !== 'undefined' ? window.innerWidth * 0.5 : 400)) + 'px',
    top: clickPos.y + 'px',
    zIndex: 200,
  } : {};

  return (
    <div
      ref={overlayRef}
      className="concept-help-overlay"
      onClick={handleClick}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {clickPos && term && (
        <div className="concept-help-panel" style={panelStyle} ref={panelRef}>
          <div className="concept-help-header">
            <span className="concept-help-term">{term}</span>
            <button className="concept-help-close" onClick={(e) => {
              e.stopPropagation();
              setClickPos(null); setTerm(''); setResponse(null); setError(null);
            }}>&times;</button>
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
              <div
                className="concept-help-explanation"
                dangerouslySetInnerHTML={{ __html: response.explanation }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
