import './OntologyHome.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOntologyRagState, type OntologyRagState, type NodeInstance, type LoadingStep, type LineHealthDetail, type UpstreamRedSource, type LinkedNode, COLUMN_NARRATIVES_AR } from '../../services/ontologyService';

/*
 * SST Ontology Architecture Diagram
 * Visual layer: landscape.svg (5850×3378) as background + ALLCONN.svg lines inline
 * RAG layer: colored diamond overlays on node top faces + animated connection lines
 */

// SVG coordinate space — old coordinates (5850×3378) mapped via viewBox to new cropped landscape (5838×2581)
// Offset: old content at (15,800) → new content at (3,3), shift = (12, 797)
const VW = 5838;
const VH = 2581;
const VB_X = 12;  // viewBox x offset (maps old coords to new landscape)
const VB_Y = 797; // viewBox y offset

type RagStatus = 'green' | 'amber' | 'red' | 'default';

// Node positions in the 5850×3378 coordinate space
// Extracted from landscape.svg rect elements (actual building image positions)
const NODE_POS: Record<string, { x: number; y: number; w: number; h: number }> = {
  sectorObjectives: { x: 244,     y: 1992,  w: 477,  h: 441 },
  policyTools:      { x: 1399,    y: 1206,  w: 477,  h: 441 },
  adminRecords:     { x: 1493,    y: 1663,  w: 288,  h: 197 },
  dataTransactions: { x: 1495,    y: 2672,  w: 288,  h: 197 },
  performance:      { x: 1401,    y: 2890,  w: 477,  h: 441 },
  risks:            { x: 2556,    y: 1936,  w: 476,  h: 439 },
  riskPlans:        { x: 2916,    y: 2654,  w: 202,  h: 170 },
  cultureHealth:    { x: 3883,    y: 1233,  w: 201,  h: 170 },
  capabilities:     { x: 3508,    y: 1936,  w: 476,  h: 439 },
  orgUnits:         { x: 4314,    y: 1513,  w: 239,  h: 194 },
  processes:        { x: 4332,    y: 2019,  w: 239,  h: 194 },
  itSystems:        { x: 4328,    y: 2543,  w: 239,  h: 194 },
  vendors:          { x: 3883,    y: 2965,  w: 202,  h: 170 },
  projects:         { x: 5190,    y: 1945,  w: 477,  h: 441 },
  changeAdoption:   { x: 5510,    y: 2653,  w: 202,  h: 171 },
};

// Which nodes are clickable (have drill-down data)
const CLICKABLE_NODES = new Set(['sectorObjectives', 'policyTools', 'performance', 'risks', 'capabilities', 'orgUnits', 'processes', 'itSystems', 'projects']);

// Node label map for side panel
const NODE_LABELS: Record<string, { en: string; ar: string }> = {
  sectorObjectives: { en: 'Sector Objectives',    ar: 'الأهداف القطاعية' },
  policyTools:      { en: 'Policy Execution Tools',ar: 'أدوات تنفيذ السياسات' },
  adminRecords:     { en: 'Admin Records',         ar: 'السجلات الإدارية' },
  dataTransactions: { en: 'Data Transactions',     ar: 'المعاملات البيانية' },
  performance:      { en: 'Performance',           ar: 'الأداء' },
  risks:            { en: 'Risks',                 ar: 'المخاطر' },
  riskPlans:        { en: 'Risk Plans',            ar: 'خطط المخاطر' },
  cultureHealth:    { en: 'Culture Health',        ar: 'صحة الثقافة' },
  capabilities:     { en: 'Capabilities',          ar: 'القدرات المؤسسية' },
  orgUnits:         { en: 'Org Units',             ar: 'الوحدات التنظيمية' },
  processes:        { en: 'Processes',             ar: 'العمليات' },
  itSystems:        { en: 'IT Systems',            ar: 'أنظمة تقنية المعلومات' },
  vendors:          { en: 'Vendors',               ar: 'الموردون' },
  projects:         { en: 'Projects',              ar: 'المشاريع' },
  changeAdoption:   { en: 'Change Adoption',       ar: 'تبني التغيير' },
};


export default function OntologyHome() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const rtl = lang === 'ar';

  const [ragState, setRagState] = useState<OntologyRagState | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [selectedLine, setSelectedLine] = useState<{ from: string; to: string } | null>(null);
  const [tracePath, setTracePath] = useState<string[]>([]); // drill-down trace stack

  useEffect(() => {
    fetchOntologyRagState(setLoadingSteps)
      .then(state => {
        setRagState(state);
        // Keep tracker visible briefly so user sees final state
        setTimeout(() => setLoadingSteps([]), 1500);
      })
      .catch(err => {
        console.error('[OntologyHome] RAG fetch failed:', err);
        // Don't clear steps — show the error state
      });
  }, []);

  const getNodeRag = (key: string): RagStatus => ragState?.nodeRag[key] ?? 'default';

  // Line RAG: precomputed data flow health (orphan node detection)
  const getLineRag = (from: string, to: string): RagStatus => {
    if (!ragState) return 'default';
    return ragState.lineRag[`${from}->${to}`]
      || ragState.lineRag[`${to}->${from}`]
      || 'default';
  };

  const lineClick = (from: string, to: string) => ({
    onClick: () => { setSelectedLine({ from, to }); setSelectedNode(null); },
    style: { cursor: 'pointer' } as React.CSSProperties,
  });

  return (
    <div className="ontology-home" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>

      {/* ── Loading Tracker ── */}
      {loadingSteps.length > 0 && (
        <div className="ont-loading-tracker">
          <div className="ont-loading-title">
            {lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </div>
          {loadingSteps.map((step, i) => (
            <div key={i} className={`ont-loading-step ont-loading-step--${step.status}`}>
              <span className="ont-loading-icon">
                {step.status === 'loading' ? '⟳' : step.status === 'done' ? '✓' : '✕'}
              </span>
              <span className="ont-loading-label">{step.label}</span>
              {step.status === 'done' && step.count !== undefined && (
                <span className="ont-loading-count">{step.count} found</span>
              )}
              {step.status === 'error' && (
                <span className="ont-loading-count" style={{ color: 'var(--component-color-danger)' }}>failed</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="ont-svg-stage">

        {/* ── Layer 0: Column Header Strip ── */}
        <div className="ont-header-strip">
          {[
            { key: 'goals',    en: 'Goals',              ar: 'الأهداف',              pct: 15.42 },
            { key: 'sector',   en: 'Sector Outputs',      ar: 'المخرجات القطاعية',     pct: 24.84 },
            { key: 'health',   en: 'Health',              ar: 'الصحة',                pct: 14.78 },
            { key: 'capacity', en: 'Capacity',            ar: 'القدرات',              pct: 29.17 },
            { key: 'velocity', en: 'Velocity',            ar: 'سرعة التحول',          pct: 15.79 },
          ].map((col, i) => (
            <div key={col.key} className="ont-header-col" style={{ flex: `0 0 ${col.pct}%` }}>
              {i > 0 && <span className="ont-header-arrow">{rtl ? '\u2190' : '\u2192'}</span>}
              <span className="ont-header-label">{lang === 'ar' ? col.ar : col.en}</span>
            </div>
          ))}
        </div>

        {/* ── Layer 1: KPI Signal Strip (between header and landscape) ── */}
        <div className="ont-strip ont-layer-strip">
          {(ragState?.stripData || []).map(col => {
            const total = (col.green + col.amber + col.red) || 1;
            const gPct = (col.green / total) * 100;
            const aPct = (col.amber / total) * 100;
            const rPct = (col.red / total) * 100;
            const narrative = lang === 'ar'
              ? (col.priorityReds > 0
                  ? (COLUMN_NARRATIVES_AR[col.column]?.bad(col.priorityReds) ?? col.narrative)
                  : (COLUMN_NARRATIVES_AR[col.column]?.good ?? col.narrative))
              : col.narrative;
            return (
              <div key={col.column} className="ont-strip__cell">
                <div className="ont-strip__bar">
                  {gPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--green" style={{ width: `${gPct}%` }} />}
                  {aPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--amber" style={{ width: `${aPct}%` }} />}
                  {rPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--red" style={{ width: `${rPct}%` }} />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 10, marginTop: 2, marginBottom: 2 }}>
                  {col.green > 0 && <span style={{ color: '#22c55e', fontWeight: 600 }}>{col.green} {lang === 'ar' ? 'سليم' : 'on track'}</span>}
                  {col.amber > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{col.amber} {lang === 'ar' ? 'متابعة' : 'at risk'}</span>}
                  {col.red > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{col.red} {lang === 'ar' ? 'حرج' : 'critical'}</span>}
                </div>
                <span className={`ont-strip__count ${col.priorityReds > 0 ? 'ont-strip__count--alert' : 'ont-strip__count--clear'}`}>
                  {narrative}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Landscape Container (aspect-ratio wrapper) ── */}
        <div className="ont-landscape-wrap">

        {/* ── Layer 1: Background shapes from Figma export ── */}
        <img
          src={rtl ? '/att/ontology/landscape-ar.svg' : '/att/ontology/landscape-en.svg'}
          className="ont-layer-bg"
          alt="Ontology Architecture Diagram"
          draggable={false}
        />

        {/* ── Layer 2: Connection lines (ALLCONN paths, animated by RAG) ── */}
        <svg
          className="ont-layer-lines"
          viewBox={`${VB_X} ${VB_Y} ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* ── ALLCONN connection paths (27 connections from Figma SVG) ── */}

          {/* #1: capabilities → orgUnits (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'orgUnits')}`} {...lineClick('capabilities', 'orgUnits')}>
            <path d="M3872 2022L3855 2039L3838 2022" />
            <path d="M3854 2037V1645C3854 1640.58 3857.58 1637 3862 1637H4210" />
            <path d="M4193 1654L4210 1637L4193 1620" />
          </g>

          {/* #2: capabilities → processes (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'processes')}`} {...lineClick('capabilities', 'processes')}>
            <path d="M3977 2165L3960 2148L3977 2131" />
            <path d="M3963 2148H4210" />
            <path d="M4193 2131L4210 2148L4193 2165" />
          </g>

          {/* #3: capabilities → itSystems (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'itSystems')}`} {...lineClick('capabilities', 'itSystems')}>
            <path d="M3838 2319L3855 2302L3872 2319" />
            <path d="M3854 2305V2671C3854 2675.42 3857.58 2679 3862 2679H4210" />
            <path d="M4193 2662L4210 2679L4193 2696" />
          </g>

          {/* #4: itSystems → projects (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('itSystems', 'projects')}`} {...lineClick('itSystems', 'projects')}>
            <path d="M5408 2377L5425 2360L5442 2377" />
            <path d="M5424 2362V2671C5424 2675.42 5420.42 2679 5416 2679H4661" />
            <path d="M4678 2662L4661 2679L4678 2696" />
          </g>

          {/* #5: orgUnits → projects (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('orgUnits', 'projects')}`} {...lineClick('orgUnits', 'projects')}>
            <path d="M5442 1952L5425 1969L5408 1952" />
            <path d="M5424 1967V1645C5424 1640.58 5420.42 1637 5416 1637H4670" />
            <path d="M4687 1654L4670 1637L4687 1620" />
          </g>

          {/* #6: policyTools → capabilities (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'capabilities')}`} {...lineClick('policyTools', 'capabilities')}>
            <path d="M1928 1217L1911 1234L1928 1251" />
            <path d="M1912 1234H3738C3742.42 1234 3746 1237.58 3746 1242V1983" />
            <path d="M3729 1966L3746 1983L3763 1966" />
          </g>

          {/* #7: performance → capabilities (dashed) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('performance', 'capabilities')}`} {...lineClick('performance', 'capabilities')}>
            <path d="M1816 3293L1799 3310L1816 3327" />
            <path d="M1805 3310H3742C3746.42 3310 3750 3306.42 3750 3302V2342" strokeDasharray="8 8" />
            <path d="M3733 2359L3750 2342L3767 2359" />
          </g>

          {/* #8: projects → changeAdoption (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('projects', 'changeAdoption')}`} {...lineClick('projects', 'changeAdoption')}>
            <path d="M5625 2377L5608 2360L5591 2377" />
            <path d="M5607 2362V2633" />
            <path d="M5590 2616L5607 2633L5624 2616" />
          </g>

          {/* #9: projects → processes (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('projects', 'processes')}`} {...lineClick('projects', 'processes')}>
            <path d="M5114 2131L5131 2148L5114 2165" />
            <path d="M5131 2148H4670" />
            <path d="M4687 2131L4670 2148L4687 2165" />
          </g>

          {/* #10: policyTools → adminRecords (dashed, vertical down) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'adminRecords')}`} {...lineClick('policyTools', 'adminRecords')}>
            <path d="M1633 1844V1932" strokeDasharray="8 8" />
            <path d="M1616 1915L1633 1932L1650 1915" />
            <path d="M1649 1844H1617V1848H1649V1844Z" className="ont-conn-arrow" />
          </g>

          {/* #11: adminRecords → dataTransactions (dashed, vertical down) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('adminRecords', 'dataTransactions')}`} {...lineClick('adminRecords', 'dataTransactions')}>
            <path d="M1634 2569V2654" strokeDasharray="8 8" />
            <path d="M1617 2637L1634 2654L1651 2637" />
            <path d="M1650 2569H1618V2573H1650V2569Z" className="ont-conn-arrow" />
          </g>

          {/* #12: processes → itSystems (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('processes', 'itSystems')}`} {...lineClick('processes', 'itSystems')}>
            <path d="M4434 2413V2535" />
            <path d="M4417 2518L4434 2535L4451 2518" />
            <path d="M4450 2413H4418V2417H4450V2413Z" className="ont-conn-arrow" />
          </g>

          {/* #13: capabilities → risks (solid, horizontal) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'risks')}`} {...lineClick('capabilities', 'risks')}>
            <path d="M3488 2148H3046" />
            <path d="M3063 2131L3046 2148L3063 2165" />
            <path d="M3488 2164V2132H3484V2164H3488Z" className="ont-conn-arrow" />
          </g>

          {/* #14: orgUnits → processes (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('orgUnits', 'processes')}`} {...lineClick('orgUnits', 'processes')}>
            <path d="M4434 1909V1994" />
            <path d="M4417 1977L4434 1994L4451 1977" />
            <path d="M4450 1909H4418V1913H4450V1909Z" className="ont-conn-arrow" />
          </g>

          {/* #15: policyTools → adminRecords (dashed, upper stub) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'adminRecords')}`} {...lineClick('policyTools', 'adminRecords')}>
            <path d="M1633 1604V1659" strokeDasharray="8 8" />
            <path d="M1616 1642L1633 1659L1650 1642" />
            <path d="M1649 1604H1617V1608H1649V1604Z" className="ont-conn-arrow" />
          </g>

          {/* #16: sectorObjectives → performance (dashed, bottom sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('sectorObjectives', 'performance')}`} {...lineClick('sectorObjectives', 'performance')}>
            <path d="M478 2373V3294C478 3298.42 481.582 3302 486 3302H1451" strokeDasharray="8 8" />
            <path d="M1434 3285L1451 3302L1434 3319" />
            <path d="M462 2373L494 2373L494 2377L462 2377L462 2373Z" className="ont-conn-arrow" />
          </g>

          {/* #17: riskPlans → risks (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('riskPlans', 'risks')}`} {...lineClick('riskPlans', 'risks')}>
            <path d="M3013 2413V2647" />
            <path d="M2996 2630L3013 2647L3030 2630" />
            <path d="M3029 2413H2997V2417H3029V2413Z" className="ont-conn-arrow" />
          </g>

          {/* #18: dataTransactions → performance (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('dataTransactions', 'performance')}`} {...lineClick('dataTransactions', 'performance')}>
            <path d="M1635 2841V2926" />
            <path d="M1618 2909L1635 2926L1652 2909" />
            <path d="M1651 2841H1619V2845H1651V2841Z" className="ont-conn-arrow" />
          </g>

          {/* #19: sectorObjectives → policyTools (dashed, top sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('sectorObjectives', 'policyTools')}`} {...lineClick('sectorObjectives', 'policyTools')}>
            <path d="M478 2066V1250C478 1245.58 481.582 1242 486 1242H1352" strokeDasharray="8 8" />
            <path d="M1335 1259L1352 1242L1335 1225" />
            <path d="M462 2066L494 2066L494 2062L462 2062L462 2066Z" className="ont-conn-arrow" />
          </g>

          {/* #20: adminRecords → policyTools (dashed, right sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('adminRecords', 'policyTools')}`} {...lineClick('adminRecords', 'policyTools')}>
            <path d="M1823 1483H2029C2033.42 1483 2037 1486.58 2037 1491V1929" strokeDasharray="8 8" />
            <path d="M2020 1912L2037 1929L2054 1912" />
            <path d="M1823 1467L1823 1499L1827 1499L1827 1467L1823 1467Z" className="ont-conn-arrow" />
          </g>

          {/* #21: policyTools → adminRecords (dashed, left sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'adminRecords')}`} {...lineClick('policyTools', 'adminRecords')}>
            <path d="M1397 1479H1224C1219.58 1479 1216 1482.58 1216 1487V1925" strokeDasharray="8 8" />
            <path d="M1233 1908L1216 1925L1199 1908" />
            <path d="M1397 1463L1397 1495L1393 1495L1393 1463L1397 1463Z" className="ont-conn-arrow" />
          </g>

          {/* #22: policyTools → dataTransactions (dashed, left sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'dataTransactions')}`} {...lineClick('policyTools', 'dataTransactions')}>
            <path d="M1216 2586V2749C1216 2753.42 1219.58 2757 1224 2757H1489" strokeDasharray="8 8" />
            <path d="M1472 2740L1489 2757L1472 2774" />
            <path d="M1200 2586L1232 2586L1232 2590L1200 2590L1200 2586Z" className="ont-conn-arrow" />
          </g>

          {/* #23: dataTransactions → performance (dashed, right sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('dataTransactions', 'performance')}`} {...lineClick('dataTransactions', 'performance')}>
            <path d="M2045 2586V2749C2045 2753.42 2041.42 2757 2037 2757H1772" strokeDasharray="8 8" />
            <path d="M1789 2740L1772 2757L1789 2774" />
            <path d="M2061 2586L2029 2586L2029 2590L2061 2590L2061 2586Z" className="ont-conn-arrow" />
          </g>

          {/* #24: policyTools → risks (solid, long sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'risks')}`} {...lineClick('policyTools', 'risks')}>
            <path d="M2791 1976V1365C2791 1360.58 2787.42 1357 2783 1357H1843" />
            <path d="M1860 1374L1843 1357L1860 1340" />
            <path d="M2807 1976L2775 1976L2775 1972L2807 1972L2807 1976Z" className="ont-conn-arrow" />
          </g>

          {/* #25: risks → performance (dashed, long sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('risks', 'performance')}`} {...lineClick('risks', 'performance')}>
            <path d="M2791 2362V3048C2791 3052.42 2787.42 3056 2783 3056H1843" strokeDasharray="8 8" />
            <path d="M1860 3039L1843 3056L1860 3073" />
            <path d="M2807 2362L2775 2362L2775 2366L2807 2366L2807 2362Z" className="ont-conn-arrow" />
          </g>

          {/* #26: itSystems → vendors (solid, sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('itSystems', 'vendors')}`} {...lineClick('itSystems', 'vendors')}>
            <path d="M4435 2960V3217C4435 3221.42 4431.42 3225 4427 3225H4123" />
            <path d="M4140 3208L4123 3225L4140 3242" />
            <path d="M4451 2960L4419 2960L4419 2964L4451 2964L4451 2960Z" className="ont-conn-arrow" />
          </g>

          {/* #27: cultureHealth → orgUnits (solid, sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('cultureHealth', 'orgUnits')}`} {...lineClick('cultureHealth', 'orgUnits')}>
            <path d="M4111 1261H4419C4423.42 1261 4427 1264.58 4427 1269V1495" />
            <path d="M4410 1478L4427 1495L4444 1478" />
            <path d="M4111 1245L4111 1277L4115 1277L4115 1245L4111 1245Z" className="ont-conn-arrow" />
          </g>

          {/* RAG building-top SVGs — replace white roof piece with colored version */}
          {/* Fixed size from Figma export: 124×111 in the 5850×3378 coordinate space */}
          {Object.entries(NODE_POS).map(([key, pos]) => {
            const rag = getNodeRag(key);
            const ragSrc: Record<string, string> = {
              green: '/att/ontology/rag-green.svg',
              amber: '/att/ontology/rag-yellow.svg',
              red:   '/att/ontology/rag-red.svg',
            };
            const src = ragSrc[rag];
            // All RAG SVGs are 124×111 from Figma — fixed size, centered on building top edge
            const imgW = 124;
            const imgH = 111;
            const cx = pos.x + pos.w / 2;
            const imgX = cx - imgW / 2;
            const imgY = pos.y + imgH - 40;
            return (
              <g key={key}>
                {src && (
                  <image
                    href={src}
                    x={imgX} y={imgY}
                    width={imgW} height={imgH}
                    className={`ont-node-diamond ont-node-diamond--${rag}`}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )}
                {CLICKABLE_NODES.has(key) && (
                  <rect
                    x={pos.x} y={pos.y}
                    width={pos.w} height={pos.h * 0.4}
                    fill="transparent"
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={() => { setSelectedNode(key); setShowAllIssues(false); setTracePath([]); }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        </div>{/* end ont-landscape-wrap */}

        {/* ── Layer 4: Side Panel ── */}
        {selectedNode && (() => {
          const nodeRag = getNodeRag(selectedNode);
          const nodeLbl = NODE_LABELS[selectedNode]?.[lang as 'en' | 'ar'] ?? selectedNode;
          const instances: NodeInstance[] = ragState?.nodeDetails[selectedNode] || [];
          const ragColors: Record<RagStatus, string> = { red: '#ef4444', amber: '#f59e0b', green: '#22c55e', default: '#64748b' };

          // Triage sort: weighted combination of impact, urgency, and dependencies
          const triageScore = (inst: NodeInstance) =>
            (inst.impact * 0.35) + (inst.urgency * 0.35) + (inst.downstreamNodes.length * 0.3);
          const sortByImpact = (a: NodeInstance, b: NodeInstance) =>
            triageScore(b) - triageScore(a);
          const reds = instances.filter(i => i.rag === 'red').sort(sortByImpact);
          const ambers = instances.filter(i => i.rag === 'amber').sort(sortByImpact);
          const greens = instances.filter(i => i.rag === 'green' || i.rag === 'default');
          const topIssues = [...reds, ...ambers].slice(0, 3);
          const counts = { green: greens.length, amber: ambers.length, red: reds.length, total: instances.length };
          const healthPct = counts.total > 0 ? Math.round((counts.green / counts.total) * 100) : 0;

          // Generate human-readable verdict
          const verdict = (() => {
            if (counts.total === 0) return lang === 'ar' ? 'لا توجد بيانات' : 'No data available';
            if (nodeRag === 'red') return lang === 'ar'
              ? `${counts.red} عنصر يحتاج تدخل فوري من أصل ${counts.total}`
              : `${counts.red} of ${counts.total} need immediate attention`;
            if (nodeRag === 'amber') return lang === 'ar'
              ? `${counts.amber} عنصر في خطر — يحتاج متابعة`
              : `${counts.amber} items at risk — monitor closely`;
            return lang === 'ar'
              ? `${counts.green} من ${counts.total} يعمل بشكل سليم`
              : `${counts.green} of ${counts.total} operating normally`;
          })();

          // Generate "so what" insight
          const insight = (() => {
            if (reds.length === 0) return null;
            const top = reds[0];
            if (top.impact > 0) return lang === 'ar'
              ? `"${top.name}" يؤثر على ${top.impact} مؤشرات أداء — إذا لم يُعالج ستتأثر مخرجات القطاع`
              : `"${top.name}" impacts ${top.impact} downstream KPIs — unresolved, this will cascade across sector outputs`;
            return lang === 'ar'
              ? `"${top.name}" بحاجة لمراجعة عاجلة`
              : `"${top.name}" requires urgent review`;
          })();

          // Human-readable status for each issue
          const getIssueContext = (inst: NodeInstance): string => {
            if (inst.props.execute_status === 'issues') return lang === 'ar' ? 'تشغيل متعطل' : 'Operations disrupted';
            if (inst.props.execute_status === 'at-risk') return lang === 'ar' ? 'أداء متراجع' : 'Performance declining';
            if (inst.props.build_status?.includes('issues')) return lang === 'ar' ? 'تأخر في التنفيذ' : 'Delivery delayed';
            if (inst.props.build_status?.includes('atrisk')) return lang === 'ar' ? 'جدول زمني مهدد' : 'Timeline at risk';
            if (inst.props.actual_value != null && inst.props.target != null) {
              const pct = Math.round((inst.props.actual_value / inst.props.target) * 100);
              return lang === 'ar' ? `${pct}% من المستهدف` : `${pct}% of target`;
            }
            if (inst.props.progress_percentage != null) {
              const pctVal = Math.round(parseFloat(inst.props.progress_percentage) * 100);
              return lang === 'ar' ? `تقدم ${pctVal}%` : `${pctVal}% progress`;
            }
            return inst.rag === 'red' ? (lang === 'ar' ? 'يحتاج تدخل' : 'Needs intervention') : (lang === 'ar' ? 'يحتاج متابعة' : 'Monitor');
          };

          return (
            <div className="ont-panel-overlay">
              <div className="ont-panel-backdrop" onClick={() => setSelectedNode(null)} />
              <div className="ont-panel">
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{ float: rtl ? 'left' : 'right', background: 'none', border: 'none', color: 'var(--component-text-primary)', fontSize: 20, cursor: 'pointer' }}
                >&#x2715;</button>

                {/* ── Verdict Banner ── */}
                <div style={{
                  padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                  background: `${ragColors[nodeRag]}12`,
                  borderLeft: `4px solid ${ragColors[nodeRag]}`,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: ragColors[nodeRag], marginBottom: 4, fontFamily: 'var(--component-font-family)' }}>
                    {nodeLbl}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--component-text-primary)', lineHeight: 1.5 }}>
                    {verdict}
                  </div>
                </div>

                {/* ── Health Bar ── */}
                {counts.total > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--component-text-secondary)' }}>
                      <span>{lang === 'ar' ? 'نسبة السلامة' : 'Health rate'}</span>
                      <span style={{ fontWeight: 700, color: ragColors[nodeRag] }}>{healthPct}%</span>
                    </div>
                    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                      {counts.green > 0 && <div style={{ flex: counts.green, background: '#22c55e', transition: 'flex 0.6s' }} />}
                      {counts.amber > 0 && <div style={{ flex: counts.amber, background: '#f59e0b', transition: 'flex 0.6s' }} />}
                      {counts.red > 0 && <div style={{ flex: counts.red, background: '#ef4444', transition: 'flex 0.6s' }} />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 3, color: 'var(--component-text-secondary)' }}>
                      <span>{counts.green} {lang === 'ar' ? 'سليم' : 'healthy'}</span>
                      <span>{counts.amber} {lang === 'ar' ? 'تحت المراقبة' : 'watch'}</span>
                      <span>{counts.red} {lang === 'ar' ? 'حرج' : 'critical'}</span>
                    </div>
                  </div>
                )}

                {/* ── Key Insight ── */}
                {insight && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 16,
                    background: 'var(--component-bg-secondary)',
                    fontSize: 12, lineHeight: 1.6, color: 'var(--component-text-primary)',
                    fontStyle: 'italic',
                  }}>
                    {insight}
                  </div>
                )}

                {/* ── Prioritized Issue List: top 3 visible + collapsible rest ── */}
                {(() => {
                  const allIssues = [...reds, ...ambers];
                  if (allIssues.length === 0) return null;
                  const topItems = allIssues.slice(0, 3);
                  const restItems = allIssues.slice(3);

                  // Human-readable urgency reason per instance
                  const getUrgencyReason = (inst: NodeInstance): string => {
                    const u = inst.urgency;
                    if (inst.props.end_date) {
                      const days = Math.round((new Date(inst.props.end_date).getTime() - Date.now()) / (1000*60*60*24));
                      if (days <= 0) return lang === 'ar' ? 'متأخر عن الموعد' : 'Overdue';
                      if (days <= 90) return lang === 'ar' ? `${days} يوم متبقي` : `${days} days left`;
                      if (days <= 180) return lang === 'ar' ? `${Math.round(days/30)} أشهر متبقية` : `${Math.round(days/30)} months left`;
                      return lang === 'ar' ? 'الموعد بعيد' : 'Distant deadline';
                    }
                    if (inst.props.execute_status === 'issues') return lang === 'ar' ? 'تشغيل متعطل الآن' : 'Operations broken now';
                    if (inst.props.execute_status === 'at-risk') return lang === 'ar' ? 'أداء متراجع' : 'Performance declining';
                    if (u >= 0.8) return lang === 'ar' ? 'عاجل' : 'Urgent';
                    if (u >= 0.5) return lang === 'ar' ? 'متوسط الإلحاح' : 'Moderate urgency';
                    return lang === 'ar' ? 'غير عاجل' : 'Low urgency';
                  };

                  const renderItem = (inst: NodeInstance, idx: number) => {
                    const urgencyColor = inst.urgency >= 0.7 ? '#ef4444' : inst.urgency >= 0.4 ? '#f59e0b' : '#64748b';
                    const impactColor = inst.impact > 3 ? '#ef4444' : inst.impact > 0 ? '#f59e0b' : '#64748b';
                    return (
                    <div key={inst.id} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: `${ragColors[inst.rag]}08`,
                      border: `1px solid ${ragColors[inst.rag]}30`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: `${ragColors[inst.rag]}20`, color: ragColors[inst.rag],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--component-text-primary)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inst.name}
                          </div>
                          {inst.props.domain_id && (
                            <div style={{ fontSize: 10, color: 'var(--component-text-secondary)', fontFamily: 'monospace' }}>
                              {inst.props.domain_id}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: ragColors[inst.rag], marginTop: 2 }}>
                            {getIssueContext(inst)}
                          </div>
                        </div>
                      </div>
                      {/* Impact × Urgency breakdown */}
                      <div style={{ marginTop: 8, paddingLeft: 32, display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 3 }}>
                            {lang === 'ar' ? 'التأثير' : 'Impact'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: impactColor }}>
                            {inst.impact > 0
                              ? (lang === 'ar' ? `${inst.impact} مؤشرات` : `${inst.impact} KPIs`)
                              : (lang === 'ar' ? 'لا تأثير مباشر' : 'No downstream')}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 3 }}>
                            {lang === 'ar' ? 'الإلحاح' : 'Urgency'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: urgencyColor }}>
                            {getUrgencyReason(inst)}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 3 }}>
                            {lang === 'ar' ? 'الأولوية' : 'Priority'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: inst.priority > 0.5 ? '#ef4444' : inst.priority > 0.2 ? '#f59e0b' : '#64748b' }}>
                            {inst.priority > 0.5 ? (lang === 'ar' ? 'حرج' : 'Critical')
                              : inst.priority > 0.2 ? (lang === 'ar' ? 'مرتفع' : 'High')
                              : (lang === 'ar' ? 'منخفض' : 'Low')}
                          </div>
                        </div>
                      </div>
                      {/* Trace breadcrumb: back button + trail */}
                      {tracePath.length > 0 && (
                        <div style={{ marginTop: 6, paddingLeft: 32, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <div
                            onClick={(e) => { e.stopPropagation(); setTracePath(prev => prev.slice(0, -1)); }}
                            style={{
                              padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                              background: 'var(--component-bg-secondary)', border: '1px solid var(--component-panel-border)',
                              fontSize: 10, fontWeight: 700, color: 'var(--component-text-primary)',
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}
                          >
                            {'\u2190'} {lang === 'ar' ? 'رجوع' : 'Back'}
                          </div>
                          {tracePath.length > 1 && (
                            <div
                              onClick={(e) => { e.stopPropagation(); setTracePath([]); }}
                              style={{
                                padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                                fontSize: 9, color: 'var(--component-text-secondary)',
                                textDecoration: 'underline',
                              }}
                            >
                              {lang === 'ar' ? 'مسح الكل' : 'Clear'}
                            </div>
                          )}
                          <div style={{ fontSize: 9, color: 'var(--component-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {tracePath.map((tid, idx) => {
                              // Find node info for breadcrumb label
                              let label = tid;
                              for (const [nt, insts] of Object.entries(ragState?.nodeDetails || {})) {
                                const found = insts.find((n: NodeInstance) => n.id === tid);
                                if (found) { label = found.props.name || found.props.title || tid; break; }
                              }
                              return (
                                <span key={tid}>
                                  {idx > 0 && <span style={{ margin: '0 2px' }}>{'\u203A'}</span>}
                                  <span
                                    onClick={(e) => { e.stopPropagation(); setTracePath(prev => prev.slice(0, idx + 1)); }}
                                    style={{ cursor: 'pointer', textDecoration: idx < tracePath.length - 1 ? 'underline' : 'none', fontWeight: idx === tracePath.length - 1 ? 700 : 400 }}
                                  >
                                    {label}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Linked node chips: upstream (affected by) + downstream (affects) */}
                      {(() => {
                        // Determine which node's connections to show: last in tracePath, or the issue itself
                        const traceId = tracePath.length > 0 ? tracePath[tracePath.length - 1] : null;
                        let traceInstance: NodeInstance | null = null;
                        if (traceId && ragState) {
                          for (const [, insts] of Object.entries(ragState.nodeDetails)) {
                            const found = insts.find((n: NodeInstance) => n.id === traceId);
                            if (found) { traceInstance = found; break; }
                          }
                        }
                        const displayInst = traceInstance || inst;
                        return [
                          { nodes: displayInst.upstreamNodes, label: lang === 'ar' ? 'يتأثر بـ' : 'Affected by', arrow: '\u2190' },
                          { nodes: displayInst.downstreamNodes, label: lang === 'ar' ? 'يؤثر على' : 'Affects', arrow: '\u2192' },
                        ].map(({ nodes, label, arrow }) => nodes.length > 0 && (
                          <div key={label} style={{ marginTop: 6, paddingLeft: 32 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 4 }}>
                              {arrow} {label}{nodes.filter(n => n.rag === 'red').length > 0 && <span style={{ color: '#ef4444', marginLeft: 4 }}>{nodes.filter(n => n.rag === 'red').length} critical</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {nodes.map(dn => {
                                const dnLbl = NODE_LABELS[dn.nodeType]?.[lang as 'en' | 'ar'] ?? dn.nodeType;
                                return (
                                  <div
                                    key={dn.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Push this node onto the trace stack (avoid duplicates at the end)
                                      setTracePath(prev => prev[prev.length - 1] === dn.id ? prev : [...prev, dn.id]);
                                    }}
                                    style={{
                                      padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                                      background: `${ragColors[dn.rag]}15`,
                                      border: `1px solid ${ragColors[dn.rag]}30`,
                                      fontSize: 10, color: ragColors[dn.rag], fontWeight: 600,
                                      display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                  >
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ragColors[dn.rag], flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      {dn.name}
                                    </span>
                                    <span style={{ color: 'var(--component-text-secondary)', fontSize: 9, flexShrink: 0 }}>
                                      ({dnLbl})
                                    </span>
                                    <span style={{ fontSize: 8, flexShrink: 0 }}>{'\u203A'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                      {/* Mitigation Plans */}
                      {inst.linkedPlans.length > 0 && (
                        <div style={{ marginTop: 6, paddingLeft: 32 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 4 }}>
                            {lang === 'ar' ? 'خطط التخفيف' : 'Mitigation Plans'}
                          </div>
                          {inst.linkedPlans.map(plan => (
                            <div
                              key={plan.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedNode('riskPlans'); setShowAllIssues(false); setTracePath([]); }}
                              style={{
                                padding: '5px 10px', borderRadius: 6, marginBottom: 3, cursor: 'pointer',
                                background: plan.isOnTrack ? '#22c55e12' : '#ef444412',
                                border: `1px solid ${plan.isOnTrack ? '#22c55e30' : '#ef444430'}`,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              <span style={{ fontSize: 12 }}>{plan.isOnTrack ? '\u2714' : '\u26A0'}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--component-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {plan.name}
                                </div>
                                <div style={{ fontSize: 10, color: plan.isOnTrack ? '#22c55e' : '#ef4444' }}>
                                  {plan.isOnTrack
                                    ? (lang === 'ar' ? 'الخطة فعالة — تخفيف المخاطر' : 'Plan active — risk mitigated')
                                    : (lang === 'ar' ? `الخطة ${plan.status === 'overdue' ? 'متأخرة' : 'متوقفة'} — المخاطر قائمة` : `Plan ${plan.status} — risk NOT mitigated`)}
                                </div>
                              </div>
                              {inst.rawRag === 'red' && plan.isOnTrack && (
                                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#22c55e20', color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>
                                  {lang === 'ar' ? 'خُفض' : 'Downgraded'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )};

                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8 }}>
                        {lang === 'ar' ? `قائمة الأولويات (${allIssues.length})` : `Priority List (${allIssues.length})`}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {topItems.map((inst, idx) => renderItem(inst, idx))}
                      </div>
                      {restItems.length > 0 && (
                        <>
                          <button
                            onClick={() => setShowAllIssues(!showAllIssues)}
                            style={{
                              width: '100%', marginTop: 8, padding: '6px 0', border: 'none', cursor: 'pointer',
                              background: 'none', fontSize: 11, fontWeight: 600,
                              color: 'var(--component-text-secondary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                          >
                            <span style={{ transform: showAllIssues ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                            {showAllIssues
                              ? (lang === 'ar' ? 'إخفاء' : 'Hide')
                              : (lang === 'ar' ? `+${restItems.length} مشكلات أخرى` : `+${restItems.length} more issues`)}
                          </button>
                          {showAllIssues && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto' }}>
                              {restItems.map((inst, idx) => renderItem(inst, idx + 3))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* ── Summary Stats ── */}
                {counts.total > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {[
                      { n: counts.total, label: lang === 'ar' ? 'إجمالي' : 'Total', color: 'var(--component-text-primary)' },
                      { n: counts.green, label: lang === 'ar' ? 'سليم' : 'OK', color: '#22c55e' },
                      { n: counts.red + counts.amber, label: lang === 'ar' ? 'يحتاج اهتمام' : 'Attention', color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, textAlign: 'center',
                        background: 'var(--component-bg-secondary)',
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.n}</div>
                        <div style={{ fontSize: 10, color: 'var(--component-text-secondary)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CTA Buttons ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: ragColors[nodeRag], color: '#fff', fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--component-font-family)',
                  }}>
                    {lang === 'ar' ? 'عرض في مكتب المؤسسة' : 'Investigate in Enterprise Desk'}
                  </button>
                  <button style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', color: ragColors[nodeRag], fontSize: 13, fontWeight: 600,
                    border: `1px solid ${ragColors[nodeRag]}40`,
                    fontFamily: 'var(--component-font-family)',
                  }}>
                    {lang === 'ar' ? 'استشر المستشار الذكي' : 'Ask AI Advisor'}
                  </button>
                </div>

                {instances.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--component-text-secondary)', textAlign: 'center', padding: 20 }}>
                    {lang === 'ar' ? 'لا توجد بيانات لهذا العنصر' : 'No data available for this node'}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Layer 5: Line Health Panel ── */}
        {selectedLine && (() => {
          const key = `${selectedLine.from}->${selectedLine.to}`;
          const detail: LineHealthDetail | undefined =
            ragState?.lineDetails[key] || ragState?.lineDetails[`${selectedLine.to}->${selectedLine.from}`];
          if (!detail) return null;

          const fromLbl = NODE_LABELS[selectedLine.from]?.[lang as 'en' | 'ar'] ?? selectedLine.from;
          const toLbl = NODE_LABELS[selectedLine.to]?.[lang as 'en' | 'ar'] ?? selectedLine.to;
          const ragColors: Record<RagStatus, string> = { red: '#ef4444', amber: '#f59e0b', green: '#22c55e', default: '#64748b' };
          const connPct = Math.round(detail.connectivity * 100);
          const fromPct = detail.fromTotal > 0 ? Math.round((detail.fromConnected / detail.fromTotal) * 100) : 0;
          const toPct = detail.toTotal > 0 ? Math.round((detail.toConnected / detail.toTotal) * 100) : 0;

          const explanation = (() => {
            if (!detail.hasLinks) return lang === 'ar'
              ? 'لا توجد روابط مباشرة بين هذين النوعين في السلاسل النشطة'
              : 'No direct links between these types in active chains';
            if (detail.rag === 'green') return lang === 'ar'
              ? 'غالبية العناصر مرتبطة — البيانات تتدفق بشكل سليم'
              : 'Most nodes are connected — data flows actively between them';
            if (detail.rag === 'amber') return lang === 'ar'
              ? 'بعض العناصر غير مرتبطة — تدفق البيانات جزئي'
              : 'Some nodes are orphaned — partial data flow, gaps in connectivity';
            return lang === 'ar'
              ? 'أغلب العناصر غير مرتبطة — لا يوجد تدفق بيانات فعلي'
              : 'Most nodes are disconnected — no meaningful data flow between them';
          })();

          return (
            <div className="ont-panel-overlay">
              <div className="ont-panel-backdrop" onClick={() => setSelectedLine(null)} />
              <div className="ont-panel">
                <button
                  onClick={() => setSelectedLine(null)}
                  style={{ float: rtl ? 'left' : 'right', background: 'none', border: 'none', color: 'var(--component-text-primary)', fontSize: 20, cursor: 'pointer' }}
                >&#x2715;</button>

                {/* Connection Header */}
                <div style={{
                  padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                  background: `${ragColors[detail.rag]}12`,
                  borderLeft: `4px solid ${ragColors[detail.rag]}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ragColors[detail.rag], marginBottom: 4, fontFamily: 'var(--component-font-family)' }}>
                    {fromLbl} {rtl ? '\u2190' : '\u2192'} {toLbl}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: ragColors[detail.rag] }}>
                    {detail.hasLinks ? `${connPct}%` : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--component-text-secondary)' }}>
                    {lang === 'ar' ? 'صحة الاتصال' : 'Connection health'}
                  </div>
                </div>

                {/* Health Bar */}
                {detail.hasLinks && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                      <div style={{ width: `${connPct}%`, height: '100%', background: ragColors[detail.rag], transition: 'width 0.6s' }} />
                    </div>
                  </div>
                )}

                {/* From/To Stats */}
                {detail.hasLinks && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--component-bg-secondary)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--component-text-secondary)', marginBottom: 4 }}>{fromLbl}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--component-text-primary)' }}>{detail.fromConnected}/{detail.fromTotal}</div>
                      <div style={{ fontSize: 10, color: 'var(--component-text-secondary)' }}>
                        {lang === 'ar' ? `${fromPct}% مرتبط` : `${fromPct}% connected`}
                      </div>
                      {detail.fromTotal - detail.fromConnected > 0 && (
                        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
                          {detail.fromTotal - detail.fromConnected} {lang === 'ar' ? 'يتيم' : 'orphans'}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--component-bg-secondary)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--component-text-secondary)', marginBottom: 4 }}>{toLbl}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--component-text-primary)' }}>{detail.toConnected}/{detail.toTotal}</div>
                      <div style={{ fontSize: 10, color: 'var(--component-text-secondary)' }}>
                        {lang === 'ar' ? `${toPct}% مرتبط` : `${toPct}% connected`}
                      </div>
                      {detail.toTotal - detail.toConnected > 0 && (
                        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
                          {detail.toTotal - detail.toConnected} {lang === 'ar' ? 'يتيم' : 'orphans'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--component-bg-secondary)',
                  fontSize: 12, lineHeight: 1.6, color: 'var(--component-text-primary)',
                  fontStyle: 'italic',
                }}>
                  {explanation}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
