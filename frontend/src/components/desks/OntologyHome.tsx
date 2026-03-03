import './OntologyHome.css';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOntologyRagState, type OntologyRagState } from '../../services/ontologyService';

/*
 * SST Ontology Architecture Diagram
 * Canvas: 5833 wide, y from 149 (just above headers) to 3395
 * Supports LTR (English) and RTL (Arabic) with mirrored layout
 */

const W = 5833;
const TOP = 149; // start just above category headers (were at y=229)
const BOT = 3395;
const H = BOT - TOP; // 3246

const py = (y: number) => `${((y - TOP) / H) * 100}%`;
const pw = (w: number) => `${(w / W) * 100}%`;
const ph = (h: number) => `${(h / H) * 100}%`;

// Assets
const A = {
  sectorObj: '/att/ontology/sector-objective.png',
  gold: '/att/ontology/gold-coin.png',
  obj3: '/att/ontology/object-sector-3.png',
  obj5: '/att/ontology/object-sector-5.png',
  obj6: '/att/ontology/object-sector-6.png',
  obj7: '/att/ontology/object-sector-7.png',
  obj9: '/att/ontology/object-sector-9.png',
  obj10: '/att/ontology/object-sector-10.png',
  obj11: '/att/ontology/object-sector-11.png',
  obj12: '/att/ontology/object-sector-12.png',
  obj13: '/att/ontology/object-sector-13.png',
  obj14: '/att/ontology/object-sector-14.png',
  obj8: '/att/ontology/object-sector-8.png',
  entObj1: '/att/ontology/object-entity-1.png',
  entOrgUnits: '/att/ontology/object-entity-orgunits.png',
  entITSystems: '/att/ontology/object-entity-itsystems.png',
};

const V = '?v=2';

type RagStatus = 'green' | 'amber' | 'red' | 'default';

// Bilingual labels (KSA glossary-approved Arabic)
const L = {
  goals:        { en: 'Goals',                ar: 'الأهداف' },
  sectorOut:    { en: 'Sector Outputs',       ar: 'مخرجات القطاع' },
  health:       { en: 'Health',               ar: 'الصحة' },
  capacity:     { en: 'Capacity',             ar: 'القدرة الاستيعابية' },
  velocity:     { en: 'Velocity',             ar: 'السرعة' },
  vision2030:   { en: 'Vision 2030',          ar: 'رؤية 2030' },
  sectorObj:    { en: 'Sector Objectives',    ar: 'الأهداف القطاعية' },
  sectorVC:     { en: 'Sector Value Chains',  ar: 'سلاسل قيمة القطاع' },
  policyTools:  { en: 'Policy Execution Tools', ar: 'أدوات تنفيذ السياسات' },
  adminRecords: { en: 'Admin Records',        ar: 'السجلات الإدارية' },
  dataTx:       { en: 'Data Transactions',    ar: 'المعاملات البيانية' },
  govEntity:    { en: 'Gov Entity',           ar: 'الجهة الحكومية' },
  citizen:      { en: 'Citizen',              ar: 'المواطن' },
  performance:  { en: 'Performance',          ar: 'الأداء' },
  bridge:       { en: 'Bridge',               ar: 'الجسر' },
  risks:        { en: 'Risks',                ar: 'المخاطر' },
  riskPlans:    { en: 'Risk Plans',           ar: 'خطط المخاطر' },
  enterprise:   { en: 'Enterprise',           ar: 'المؤسسة' },
  cultureH:     { en: 'Culture Health',       ar: 'صحة الثقافة' },
  orgUnits:     { en: 'Org Units',            ar: 'الوحدات التنظيمية' },
  capabilities: { en: 'Capabilities',         ar: 'القدرات المؤسسية' },
  processes:    { en: 'Processes',            ar: 'العمليات' },
  vendors:      { en: 'Vendors',              ar: 'الموردون' },
  itSystems:    { en: 'IT Systems',           ar: 'أنظمة تقنية المعلومات' },
  transform:    { en: 'Transformation',       ar: 'التحول' },
  projects:     { en: 'Projects',             ar: 'المشاريع' },
  changeAdopt:  { en: 'Change Adoption',      ar: 'تبني التغيير' },
  upstreamBiz:  { en: 'Business (Upstream)',  ar: 'الأعمال (المنبع)' },
  midstreamBiz: { en: 'Business (Midstream)', ar: 'الأعمال (الوسط)' },
  downstreamBiz:{ en: 'Business (Downstream)',ar: 'الأعمال (المصب)' },
};

type Lang = 'en' | 'ar';

export default function OntologyHome() {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as Lang;
  const rtl = lang === 'ar';

  // RTL mirror: flip x positions horizontally
  const pxPos = (x: number, w: number) => `${((rtl ? W - x - w : x) / W) * 100}%`;
  const cx = (x: number, w: number) => ((rtl ? W - x - w : x) + (w / 2)) / W * 100;
  const cy = (y: number, h: number) => ((y - TOP) + (h / 2)) / H * 100;

  const t = (label: { en: string; ar: string }) => label[lang];

  const [ragState, setRagState] = useState<OntologyRagState | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    fetchOntologyRagState()
      .then(setRagState)
      .catch(err => console.warn('[OntologyHome] RAG fetch failed, using defaults:', err));
  }, []);

  const getLineRag = (from: string, to: string): RagStatus => {
    if (!ragState) return 'default';
    const fromRag = ragState.nodeRag[from] || 'default';
    const toRag = ragState.nodeRag[to] || 'default';
    const priority: Record<RagStatus, number> = { red: 3, amber: 2, green: 1, default: 0 };
    return priority[fromRag] >= priority[toRag] ? fromRag : toRag;
  };

  const getLineWeight = (from: string, to: string): 'thin' | 'med' | 'thick' => {
    if (!ragState) return 'med';
    const key = `${from}->${to}`;
    return ragState.lineWeight[key] || 'med';
  };

  const getNodeRag = (nodeKey: string): RagStatus => {
    if (!ragState) return 'default';
    return ragState.nodeRag[nodeKey] || 'default';
  };

  // Positioned box — RTL-aware
  function Box({ x, y, w, h, children, className = '', style = {} }: {
    x: number; y: number; w: number; h: number;
    children?: React.ReactNode; className?: string; style?: React.CSSProperties;
  }) {
    return (
      <div className={`ont-box ${className}`} style={{
        left: pxPos(x, w), top: py(y), width: pw(w), height: ph(h),
        ...style,
      }}>
        {children}
      </div>
    );
  }

  // Image
  function Img({ x, y, w, h, src, alt = '', nodeKey, clickable = false }: {
    x: number; y: number; w: number; h: number; src: string; alt?: string;
    nodeKey?: string; clickable?: boolean;
  }) {
    const ragClass = nodeKey ? `ont-node--${getNodeRag(nodeKey)}` : '';
    const clickClass = clickable ? 'ont-img--clickable' : '';
    return (
      <Box x={x} y={y} w={w} h={h} className={`ont-img ${ragClass} ${clickClass}`}>
        <img
          src={src} alt={alt}
          style={rtl ? { transform: 'scaleX(-1)' } : undefined}
          onClick={clickable && nodeKey ? () => setSelectedNode(nodeKey) : undefined}
        />
      </Box>
    );
  }

  // Text label
  function Txt({ x, y, w, h, size, color, children, bold = true }: {
    x: number; y: number; w: number; h: number;
    size: number; color: 'dark' | 'light'; children: React.ReactNode; bold?: boolean;
  }) {
    return (
      <Box x={x} y={y} w={w} h={h} className={`ont-txt ont-txt--${color}`} style={{
        fontWeight: bold ? 700 : 400,
        fontSize: `clamp(8px, ${(size / W) * 100}vw, ${size}px)`,
      }}>
        {children}
      </Box>
    );
  }

  function NodeTxt({ x, y, w, h, size, color, children, bold = true }: {
    x: number; y: number; w: number; h: number;
    size: number; color: 'dark' | 'light'; children: React.ReactNode; bold?: boolean;
  }) {
    const scaled = Math.round(size * 1.22);
    return (
      <Txt x={x} y={y} w={w} h={h} size={scaled} color={color} bold={bold}>
        {children}
      </Txt>
    );
  }

  function HeaderIcon({ kind }: { kind: 'goals' | 'sectorOut' | 'bridge' | 'enterprise' | 'velocity' }) {
    if (kind === 'goals') {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.28" />
          <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.45" />
          <circle cx="12" cy="12" r="2.3" fill="currentColor" />
        </svg>
      );
    }

    if (kind === 'sectorOut') {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.4 8.2h5.6a3.2 3.2 0 0 1 0 6.4H8.4a3.2 3.2 0 0 1 0-6.4Z" fill="currentColor" opacity="0.72" />
          <path d="M10 10.2h5.6a3.2 3.2 0 0 1 0 6.4H10a3.2 3.2 0 0 1 0-6.4Z" fill="currentColor" />
        </svg>
      );
    }

    if (kind === 'bridge') {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 17.5h18v2H3z" fill="currentColor" opacity="0.9" />
          <path d="M6 17.5v-3a6 6 0 0 1 12 0v3" fill="currentColor" opacity="0.72" />
          <rect x="8.8" y="14" width="1.8" height="3.5" fill="currentColor" />
          <rect x="11.1" y="14" width="1.8" height="3.5" fill="currentColor" />
          <rect x="13.4" y="14" width="1.8" height="3.5" fill="currentColor" />
        </svg>
      );
    }

    if (kind === 'enterprise') {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h16v2H4z" fill="currentColor" opacity="0.88" />
          <path d="M6 20V8l6-4 6 4v12" fill="currentColor" opacity="0.55" />
          <rect x="9" y="11" width="2" height="2" fill="currentColor" />
          <rect x="13" y="11" width="2" height="2" fill="currentColor" />
          <rect x="9" y="14" width="2" height="2" fill="currentColor" />
          <rect x="13" y="14" width="2" height="2" fill="currentColor" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13h9v2H4z" fill="currentColor" opacity="0.8" />
        <path d="M10 7l9 6-9 6z" fill="currentColor" />
      </svg>
    );
  }

  // Category header bar with icon
  function Header({ x, y, w, h, label, iconKind }: {
    x: number; y: number; w: number; h: number; label: { en: string; ar: string }; iconKind: 'goals' | 'sectorOut' | 'bridge' | 'enterprise' | 'velocity';
  }) {
    return (
      <Box x={x} y={y} w={w} h={h} className="ont-header">
        <span className="ont-header__icon" aria-hidden="true"><HeaderIcon kind={iconKind} /></span>
        {t(label)}
      </Box>
    );
  }

  const relationNodes = {
    sectorObjectives: { x: 183, y: 1944, w: 477, h: 441 },
    policyTools: { x: 1343, y: 1249, w: 477, h: 441 },
    adminRecords: { x: 1466, y: 1877, w: 225, h: 150 },
    citizen: { x: 1013, y: 1877, w: 225, h: 188 },
    govEntity: { x: 1918, y: 1881, w: 228, h: 150 },
    businessUp: { x: 1013, y: 2095, w: 225, h: 153 },
    businessMid: { x: 1474, y: 2095, w: 228, h: 155 },
    businessDown: { x: 1918, y: 2095, w: 228, h: 155 },
    dataTransactions: { x: 1463, y: 2311, w: 250, h: 150 },
    performance: { x: 1343, y: 2688, w: 477, h: 441 },
    risks: { x: 2496, y: 1944, w: 477, h: 441 },
    riskPlans: { x: 2633, y: 2814, w: 202, h: 171 },
    capabilities: { x: 3448, y: 1944, w: 477, h: 441 },
    orgUnits: { x: 4179, y: 1317, w: 408, h: 282 },
    processes: { x: 4179, y: 2027, w: 408, h: 282 },
    itSystems: { x: 4179, y: 2758, w: 408, h: 282 },
    vendors: { x: 3585, y: 2814, w: 202, h: 171 },
    projects: { x: 5129, y: 1945, w: 477, h: 441 },
    changeAdoption: { x: 5266, y: 2805, w: 202, h: 171 },
    cultureHealth: { x: 3585, y: 1373, w: 202, h: 171 },
  };

  const anchorPoint = (
    node: { x: number; y: number; w: number; h: number },
    tx: number,
    ty: number,
  ) => {
    const centerX = cx(node.x, node.w);
    const centerY = cy(node.y, node.h);
    const halfW = (node.w / W) * 50;
    const halfH = (node.h / H) * 50;
    const dx = tx - centerX;
    const dy = ty - centerY;
    const safeDx = Math.abs(dx) < 0.0001 ? 0.0001 : dx;
    const safeDy = Math.abs(dy) < 0.0001 ? 0.0001 : dy;
    const scale = 1 / Math.max(Math.abs(safeDx) / halfW, Math.abs(safeDy) / halfH);
    return {
      x: centerX + dx * scale,
      y: centerY + dy * scale,
    };
  };

  const relationLines = [
    { from: 'sectorObjectives', to: 'policyTools', label: 'REALIZED_VIA', laneX: -4 },
    { from: 'policyTools', to: 'sectorObjectives', label: 'GOVERNED_BY', laneX: -2.8 },
    { from: 'sectorObjectives', to: 'performance', label: 'CASCADED_VIA', laneX: -1.2 },
    { from: 'performance', to: 'sectorObjectives', label: 'AGGREGATES_TO', laneX: 1.0 },
    { from: 'policyTools', to: 'adminRecords', label: 'REFERS_TO', laneX: -0.8 },
    { from: 'adminRecords', to: 'citizen', label: 'APPLIED_ON', laneX: -4.8 },
    { from: 'adminRecords', to: 'govEntity', label: 'APPLIED_ON', laneX: 4.8 },
    { from: 'adminRecords', to: 'businessUp', label: 'APPLIED_ON', laneX: -2.4 },
    { from: 'citizen', to: 'dataTransactions', label: 'TRIGGERS_EVENT', laneX: -3.8 },
    { from: 'govEntity', to: 'dataTransactions', label: 'TRIGGERS_EVENT', laneX: 3.8 },
    { from: 'businessDown', to: 'dataTransactions', label: 'TRIGGERS_EVENT', laneX: 1.9 },
    { from: 'dataTransactions', to: 'performance', label: 'MEASURED_BY', laneX: 0.6 },

    { from: 'policyTools', to: 'capabilities', label: 'SETS_PRIORITIES', laneX: 0.8 },
    { from: 'performance', to: 'capabilities', label: 'SETS_TARGETS', laneX: 2.0 },
    { from: 'capabilities', to: 'policyTools', label: 'EXECUTES', laneX: -1.2 },
    { from: 'capabilities', to: 'performance', label: 'REPORTS', laneX: -2.4 },
    { from: 'capabilities', to: 'risks', label: 'MONITORED_BY', laneX: -1.4 },
    { from: 'risks', to: 'riskPlans', label: 'HAS_PLAN*', laneX: 0.5 },
    { from: 'risks', to: 'policyTools', label: 'INFORMS', laneX: 0.2 },
    { from: 'risks', to: 'performance', label: 'INFORMS', laneX: -0.6 },

    { from: 'capabilities', to: 'orgUnits', label: 'ROLE_GAPS', laneX: 2.2 },
    { from: 'capabilities', to: 'processes', label: 'KNOWLEDGE_GAPS', laneX: -1.4 },
    { from: 'capabilities', to: 'itSystems', label: 'AUTOMATION_GAPS', laneX: -2.6 },
    { from: 'cultureHealth', to: 'orgUnits', label: 'MONITORS_FOR', laneX: -1.8 },
    { from: 'orgUnits', to: 'processes', label: 'APPLY', laneX: 1.5 },
    { from: 'processes', to: 'itSystems', label: 'AUTOMATION', laneX: 2.0 },
    { from: 'processes', to: 'performance', label: 'FEEDS_INTO', laneX: -3.5 },
    { from: 'itSystems', to: 'vendors', label: 'DEPENDS_ON', laneX: -1.6 },

    { from: 'orgUnits', to: 'projects', label: 'GAPS_SCOPE', laneX: 2.2 },
    { from: 'processes', to: 'projects', label: 'GAPS_SCOPE', laneX: 0.4 },
    { from: 'itSystems', to: 'projects', label: 'GAPS_SCOPE', laneX: -1.8 },
    { from: 'projects', to: 'orgUnits', label: 'CLOSE_GAPS', laneX: 3.4 },
    { from: 'projects', to: 'processes', label: 'CLOSE_GAPS', laneX: -0.8 },
    { from: 'projects', to: 'itSystems', label: 'CLOSE_GAPS', laneX: -3.2 },
    { from: 'projects', to: 'changeAdoption', label: 'ADOPTION_RISKS', laneX: 2.2 },
    { from: 'changeAdoption', to: 'projects', label: 'INCREASE_ADOPTION', laneX: -2.2 },
  ] as const;

  const renderedLines = (() => {
    type NodeKey = keyof typeof relationNodes;
    type RenderLine = { from: NodeKey; to: NodeKey; laneX: number; bidirectional: boolean };
    const map = new Map<string, RenderLine>();

    relationLines.forEach((rel) => {
      const from = rel.from as NodeKey;
      const to = rel.to as NodeKey;
      const forwardKey = `${String(from)}->${String(to)}`;
      const reverseKey = `${String(to)}->${String(from)}`;

      if (map.has(reverseKey)) {
        const reverse = map.get(reverseKey)!;
        reverse.bidirectional = true;
        reverse.laneX = (reverse.laneX + (rel.laneX ?? 0)) / 2;
        return;
      }

      map.set(forwardKey, {
        from,
        to,
        laneX: rel.laneX ?? 0,
        bidirectional: false,
      });
    });

    return Array.from(map.values());
  })();

  return (
    <div className="ontology-home" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
      <div className="ont-frame" style={{ paddingBottom: `${(H / W) * 100}%` }}>

        {/* ═══ CATEGORY HEADERS ═══ */}
        <Header x={0} y={169} w={852} h={230} label={L.goals} iconKind="goals" />
        <Header x={852} y={169} w={1452} h={230} label={L.sectorOut} iconKind="sectorOut" />
        <Header x={2304} y={169} w={861} h={230} label={L.health} iconKind="bridge" />
        <Header x={3165} y={169} w={1705} h={230} label={L.capacity} iconKind="enterprise" />
        <Header x={4870} y={169} w={963} h={230} label={L.velocity} iconKind="velocity" />

        {/* ═══ KPI SIGNAL STRIP ═══ */}
        <Box x={0} y={430} w={5833} h={350} className="ont-strip">
          {(ragState?.stripData || []).map(col => {
            const total = col.green + col.amber + col.red || 1;
            const gPct = (col.green / total) * 100;
            const aPct = (col.amber / total) * 100;
            const rPct = (col.red / total) * 100;
            const labels: Record<string, { clear: string; alert: string }> = {
              goals:    { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'أولوية' : 'priority' },
              sector:   { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'أولوية' : 'priority' },
              health:   { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'عالي الأثر' : 'high-impact' },
              capacity: { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'حرج' : 'critical' },
              velocity: { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'معطل' : 'blocked' },
            };
            const lbl = labels[col.column] || labels.goals;
            return (
              <div key={col.column} className="ont-strip__cell">
                <div className="ont-strip__bar">
                  {gPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--green" style={{ width: `${gPct}%` }} />}
                  {aPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--amber" style={{ width: `${aPct}%` }} />}
                  {rPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--red" style={{ width: `${rPct}%` }} />}
                </div>
                <span className={`ont-strip__count ${col.priorityReds > 0 ? 'ont-strip__count--alert' : 'ont-strip__count--clear'}`}>
                  {col.priorityReds > 0 ? `${col.priorityReds} ${lbl.alert}` : lbl.clear}
                </span>
              </div>
            );
          })}
        </Box>

        {/* ═══ COLUMN BACKGROUNDS ═══ */}
        <Box x={0} y={814} w={852} h={2581} className="ont-col ont-col--light" />
        <Box x={852} y={814} w={1452} h={2581} className="ont-col ont-col--dark" />
        <Box x={2304} y={814} w={861} h={2581} className="ont-col ont-col--light" />
        <Box x={3165} y={814} w={1705} h={2581} className="ont-col ont-col--dark" />
        <Box x={4870} y={814} w={963} h={2581} className="ont-col ont-col--light" />

        {/* ═══ RELATIONS (from Noor memory chains + ontology vocabulary) ═══ */}
        <svg className="ont-relations" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Ontology relations">
          <defs>
            {(['green', 'amber', 'red', 'default'] as const).map(rag => (
              <marker key={rag} id={`ont-arrow-${rag}`} viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className={`ont-rel-arrow--${rag}`} />
              </marker>
            ))}
          </defs>
          {renderedLines.map((relation) => {
            const fromNode = relationNodes[relation.from];
            const toNode = relationNodes[relation.to];
            const c1x = cx(fromNode.x, fromNode.w);
            const c1y = cy(fromNode.y, fromNode.h);
            const c2x = cx(toNode.x, toNode.w);
            const c2y = cy(toNode.y, toNode.h);
            const s = anchorPoint(fromNode, c2x, c2y);
            const e = anchorPoint(toNode, c1x, c1y);
            const mx = ((s.x + e.x) / 2) + (relation.laneX ?? 0);
            const path = `M ${s.x} ${s.y} L ${mx} ${s.y} L ${mx} ${e.y} L ${e.x} ${e.y}`;
            const rag = getLineRag(relation.from, relation.to);
            const weight = getLineWeight(relation.from, relation.to);
            return (
              <g key={`${relation.from}-${relation.to}`}>
                <path
                  d={path}
                  className={`ont-rel-line ont-rel-line--${rag} ont-rel-line--${weight}`}
                  markerStart={relation.bidirectional ? `url(#ont-arrow-${rag})` : undefined}
                  markerEnd={`url(#ont-arrow-${rag})`}
                />
              </g>
            );
          })}
        </svg>

        {/* ═══ COL 1: GOALS ═══ */}
        <Txt x={85} y={967} w={673} h={116} size={48} color="dark">{t(L.vision2030)}</Txt>
        <Img x={183} y={1944} w={477} h={441} src={A.sectorObj} alt="Sector Objectives" nodeKey="sectorObjectives" clickable />
        <NodeTxt x={279} y={2501} w={284} h={116} size={24} color="dark">{t(L.sectorObj)}</NodeTxt>

        {/* ═══ COL 2: SECTOR VALUE CHAINS ═══ */}
        <Txt x={949} y={952} w={1258} h={116} size={48} color="light">{t(L.sectorVC)}</Txt>
        <NodeTxt x={1282} y={1185} w={613} h={58} size={24} color="light">{t(L.policyTools)}</NodeTxt>
        <Img x={1343} y={1249} w={477} h={441} src={A.sectorObj} alt="Policy Tools" nodeKey="policyTools" clickable />

        {/* Sector value-chain intermediate nodes */}
        <Img x={1013} y={1877} w={225} h={188} src={A.obj3 + V} alt="Citizen" nodeKey="citizen" />
        <NodeTxt x={1013} y={2031} w={225} h={34} size={14} color="light" bold={false}>{t(L.citizen)}</NodeTxt>

        <Img x={1466} y={1877} w={225} h={150} src={A.obj12 + V} alt="Admin Records" nodeKey="adminRecords" />
        <NodeTxt x={1466} y={2035} w={225} h={34} size={14} color="light" bold={false}>{t(L.adminRecords)}</NodeTxt>

        <Img x={1918} y={1881} w={228} h={150} src={A.obj5 + V} alt="Gov Entity" nodeKey="govEntity" />
        <NodeTxt x={1918} y={2044} w={228} h={34} size={14} color="light" bold={false}>{t(L.govEntity)}</NodeTxt>

        <Img x={1013} y={2095} w={225} h={153} src={A.obj7 + V} alt="Business Upstream" nodeKey="businessUp" />
        <NodeTxt x={978} y={2255} w={295} h={34} size={12} color="light" bold={false}>{t(L.upstreamBiz)}</NodeTxt>

        <Img x={1474} y={2095} w={228} h={155} src={A.obj11 + V} alt="Business Midstream" nodeKey="businessMid" />
        <NodeTxt x={1424} y={2260} w={325} h={34} size={12} color="light" bold={false}>{t(L.midstreamBiz)}</NodeTxt>

        <Img x={1918} y={2095} w={228} h={155} src={A.obj6 + V} alt="Business Downstream" nodeKey="businessDown" />
        <NodeTxt x={1868} y={2255} w={325} h={34} size={12} color="light" bold={false}>{t(L.downstreamBiz)}</NodeTxt>

        <Img x={1463} y={2311} w={250} h={150} src={A.obj8 + V} alt="Data Transactions" nodeKey="dataTransactions" />
        <NodeTxt x={1418} y={2467} w={340} h={34} size={12} color="light" bold={false}>{t(L.dataTx)}</NodeTxt>

        <Img x={1343} y={2688} w={477} h={441} src={A.sectorObj} alt="Performance" nodeKey="performance" clickable />
        <NodeTxt x={1282} y={3137} w={613} h={58} size={24} color="light">{t(L.performance)}</NodeTxt>

        {/* ═══ COL 3: BRIDGE ═══ */}
        <Txt x={2398} y={967} w={673} h={116} size={48} color="dark">{t(L.bridge)}</Txt>
        <Img x={2496} y={1944} w={477} h={441} src={A.sectorObj} alt="Risks" nodeKey="risks" clickable />
        <NodeTxt x={2530} y={2554} w={408} h={58} size={24} color="dark">{t(L.risks)}</NodeTxt>
        <Img x={2633} y={2814} w={202} h={171} src={A.gold} alt="Risk Plans" nodeKey="riskPlans" />
        <NodeTxt x={2589} y={3039} w={296} h={58} size={24} color="dark">{t(L.riskPlans)}</NodeTxt>

        {/* ═══ COL 4: ENTERPRISE ═══ */}
        <Txt x={3636} y={967} w={913} h={116} size={48} color="light">{t(L.enterprise)}</Txt>

        <Img x={3585} y={1373} w={202} h={171} src={A.gold} alt="Culture Health" nodeKey="cultureHealth" />
        <NodeTxt x={3491} y={1598} w={371} h={58} size={24} color="light">{t(L.cultureH)}</NodeTxt>

        <Img x={4179} y={1317} w={408} h={282} src={A.entOrgUnits + V} alt="Org Units" nodeKey="orgUnits" clickable />
        <NodeTxt x={4215} y={1640} w={327} h={58} size={24} color="light">{t(L.orgUnits)}</NodeTxt>

        <Img x={3448} y={1944} w={477} h={441} src={A.sectorObj} alt="Capabilities" nodeKey="capabilities" clickable />
        <NodeTxt x={3519} y={2554} w={335} h={58} size={24} color="light">{t(L.capabilities)}</NodeTxt>

        <Img x={4179} y={2027} w={408} h={282} src={A.entObj1 + V} alt="Processes" nodeKey="processes" clickable />
        <NodeTxt x={4215} y={2368} w={327} h={58} size={24} color="light">{t(L.processes)}</NodeTxt>

        <Img x={3585} y={2814} w={202} h={171} src={A.gold} alt="Vendors" nodeKey="vendors" />
        <NodeTxt x={3519} y={3039} w={335} h={58} size={24} color="light">{t(L.vendors)}</NodeTxt>

        <Img x={4179} y={2758} w={408} h={282} src={A.entITSystems + V} alt="IT Systems" nodeKey="itSystems" clickable />
        <NodeTxt x={4220} y={3097} w={327} h={58} size={24} color="light">{t(L.itSystems)}</NodeTxt>

        {/* ═══ COL 5: TRANSFORMATION ═══ */}
        <Txt x={4964} y={967} w={807} h={116} size={48} color="dark">{t(L.transform)}</Txt>
        <Img x={5129} y={1945} w={477} h={441} src={A.sectorObj} alt="Projects" nodeKey="projects" clickable />
        <NodeTxt x={5200} y={2442} w={335} h={58} size={24} color="dark">{t(L.projects)}</NodeTxt>
        <Img x={5266} y={2805} w={202} h={171} src={A.gold} alt="Change Adoption" nodeKey="changeAdoption" />
        <NodeTxt x={5200} y={3027} w={335} h={116} size={24} color="dark">{t(L.changeAdopt)}</NodeTxt>

        {selectedNode && (
          <div className="ont-panel-overlay">
            <div className="ont-panel-backdrop" onClick={() => setSelectedNode(null)} />
            <div className="ont-panel">
              <button onClick={() => setSelectedNode(null)} style={{
                float: rtl ? 'left' : 'right', background: 'none', border: 'none',
                color: 'var(--component-text-primary)', fontSize: 20, cursor: 'pointer',
              }}>&#x2715;</button>
              <h3 style={{ color: 'var(--component-text-accent)', fontFamily: 'var(--component-font-family)', margin: '0 0 12px' }}>
                {t((L as any)[selectedNode] || L.capabilities)}
              </h3>
              <p style={{ color: 'var(--component-text-secondary)', fontFamily: 'var(--component-font-family)', fontSize: 14 }}>
                {rtl ? '\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0642\u0631\u064A\u0628\u0627\u064B \u2014 \u0633\u064A\u062A\u0645 \u0631\u0628\u0637\u0647\u0627 \u0628\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u062F\u0631\u0627\u062A \u0627\u0644\u0645\u0624\u0633\u0633\u064A\u0629' : 'Detail panel coming \u2014 will connect to CapabilityDetailPanel'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
