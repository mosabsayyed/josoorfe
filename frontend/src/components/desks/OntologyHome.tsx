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
  headerGoals: '/att/ontology/header-goals.png',
  headerSector: '/att/ontology/header-sector-output.png',
  headerHealth: '/att/ontology/header-health.png',
  headerCapacity: '/att/ontology/header-capacity.png',
  headerVelocity: '/att/ontology/header-velocity.png',
  adminDataTxn: '/att/ontology/admin-records-datatxn.png',
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
  resources:      { en: 'Resources',             ar: 'الموارد' },
  infrastructure: { en: 'Infrastructure',        ar: 'البنية التحتية' },
  regulatory:     { en: 'Regulatory',            ar: 'التنظيمي' },
  remote:         { en: 'Remote',                ar: 'عن بعد' },
  agricultural:   { en: 'Agricultural',          ar: 'الزراعي' },
  urban:          { en: 'Urban',                 ar: 'الحضري' },
  business:       { en: 'Business',              ar: 'الأعمال' },
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
  function Img({ x, y, w, h, src, alt = '', nodeKey, clickable = false, focal = false }: {
    x: number; y: number; w: number; h: number; src: string; alt?: string;
    nodeKey?: string; clickable?: boolean; focal?: boolean;
  }) {
    const ragClass = nodeKey ? `ont-node--${getNodeRag(nodeKey)}` : '';
    const clickClass = clickable ? 'ont-img--clickable' : '';
    const focalClass = focal ? 'ont-img--focal' : '';
    return (
      <Box x={x} y={y} w={w} h={h} className={`ont-img ${ragClass} ${clickClass} ${focalClass}`}>
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
    const iconMap: Record<string, string> = {
      goals: A.headerGoals,
      sectorOut: A.headerSector,
      bridge: A.headerHealth,
      enterprise: A.headerCapacity,
      velocity: A.headerVelocity,
    };
    return <img src={iconMap[kind]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
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
    adminRecords: { x: 1466, y: 1577, w: 250, h: 170 },
    // Stakeholder areas (for relation line anchoring)
    govEntity: { x: 1013, y: 1830, w: 225, h: 40 },
    business: { x: 1474, y: 1830, w: 228, h: 40 },
    citizen: { x: 1918, y: 1830, w: 225, h: 40 },
    // Gov Entity sub-sectors (left column)
    resources: { x: 1013, y: 1920, w: 225, h: 153 },
    infrastructure: { x: 1013, y: 2110, w: 225, h: 153 },
    regulatory: { x: 1013, y: 2300, w: 225, h: 153 },
    // Business sub-sectors (center column)
    businessUp: { x: 1474, y: 1920, w: 225, h: 153 },
    businessMid: { x: 1474, y: 2110, w: 228, h: 155 },
    businessDown: { x: 1474, y: 2300, w: 228, h: 155 },
    // Citizen sub-sectors (right column)
    remote: { x: 1918, y: 1920, w: 225, h: 153 },
    agricultural: { x: 1918, y: 2110, w: 225, h: 153 },
    urban: { x: 1918, y: 2300, w: 225, h: 153 },
    dataTransactions: { x: 1463, y: 2510, w: 250, h: 150 },
    performance: { x: 1343, y: 2800, w: 477, h: 441 },
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

  // Edge-based anchor: exit/enter from a specific face of a node
  type Edge = 'left' | 'right' | 'top' | 'bottom';

  const getEdgeAnchor = (
    node: { x: number; y: number; w: number; h: number },
    edge: Edge,
  ): { x: number; y: number } => {
    // RTL: mirror x positions
    const nx = rtl ? ((W - node.x - node.w) / W) * 100 : (node.x / W) * 100;
    const ny = ((node.y - TOP) / H) * 100;
    const nw = (node.w / W) * 100;
    const nh = (node.h / H) * 100;
    // RTL: flip left/right
    const eff: Edge = rtl ? (edge === 'left' ? 'right' : edge === 'right' ? 'left' : edge) : edge;
    switch (eff) {
      case 'left':   return { x: nx,          y: ny + nh / 2 };
      case 'right':  return { x: nx + nw,     y: ny + nh / 2 };
      case 'top':    return { x: nx + nw / 2, y: ny };
      case 'bottom': return { x: nx + nw / 2, y: ny + nh };
    }
  };

  // Clean connections matching Figma design — simple L-path routing
  const cleanLines: Array<{
    from: string; to: string;
    fEdge: Edge; tEdge: Edge;
    offset?: number; // small shift for the vertical segment (% units) to avoid overlaps
  }> = [
    // Goals ↔ Sector Outputs
    { from: 'sectorObjectives', to: 'policyTools',      fEdge: 'right',  tEdge: 'left'   },
    { from: 'performance',      to: 'sectorObjectives', fEdge: 'left',   tEdge: 'right'  },

    // Within Sector Outputs col (vertical flow)
    { from: 'policyTools',      to: 'adminRecords',     fEdge: 'bottom', tEdge: 'top'    },
    { from: 'dataTransactions', to: 'performance',      fEdge: 'bottom', tEdge: 'top'    },

    // Sector Outputs → Capacity (long horizontal, spans Health col)
    { from: 'policyTools',      to: 'capabilities',     fEdge: 'right',  tEdge: 'left',  offset: -1.5 },
    { from: 'performance',      to: 'capabilities',     fEdge: 'right',  tEdge: 'left',  offset:  1.5 },

    // Capabilities → Health (Risks) — goes LEFT
    { from: 'capabilities',     to: 'risks',            fEdge: 'left',   tEdge: 'right'  },
    { from: 'risks',            to: 'riskPlans',        fEdge: 'bottom', tEdge: 'top'    },

    // Capabilities → Processes (horizontal across Capacity col)
    { from: 'capabilities',     to: 'processes',        fEdge: 'right',  tEdge: 'left'   },

    // Within Capacity col
    { from: 'cultureHealth',    to: 'orgUnits',         fEdge: 'right',  tEdge: 'left'   },
    { from: 'orgUnits',         to: 'processes',        fEdge: 'bottom', tEdge: 'top'    },
    { from: 'processes',        to: 'itSystems',        fEdge: 'bottom', tEdge: 'top'    },
    { from: 'itSystems',        to: 'vendors',          fEdge: 'left',   tEdge: 'right'  },

    // Capacity → Velocity
    { from: 'orgUnits',         to: 'projects',         fEdge: 'right',  tEdge: 'top',    offset: -1 },
    { from: 'processes',        to: 'projects',         fEdge: 'right',  tEdge: 'left'   },
    { from: 'itSystems',        to: 'projects',         fEdge: 'right',  tEdge: 'bottom', offset:  1 },
    { from: 'projects',         to: 'changeAdoption',   fEdge: 'bottom', tEdge: 'top'    },
  ];

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

        {/* ═══ RELATIONS ═══ */}
        <svg className="ont-relations" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Ontology relations">
          <defs>
            {(['green', 'amber', 'red', 'default'] as const).map(rag => (
              <marker key={rag} id={`ont-arrow-${rag}`} viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className={`ont-rel-arrow--${rag}`} />
              </marker>
            ))}
          </defs>
          {cleanLines.map((line) => {
            const fromNode = relationNodes[line.from as keyof typeof relationNodes];
            const toNode = relationNodes[line.to as keyof typeof relationNodes];
            if (!fromNode || !toNode) return null;
            const s = getEdgeAnchor(fromNode, line.fEdge);
            const e = getEdgeAnchor(toNode, line.tEdge);
            const offset = line.offset ?? 0;
            const dx = Math.abs(s.x - e.x);
            const dy = Math.abs(s.y - e.y);
            let d: string;
            if (dx < 0.3) {
              d = `M ${s.x} ${s.y} V ${e.y}`;
            } else if (dy < 0.3) {
              d = `M ${s.x} ${s.y} H ${e.x}`;
            } else {
              const midX = (s.x + e.x) / 2 + offset;
              d = `M ${s.x} ${s.y} H ${midX} V ${e.y} H ${e.x}`;
            }
            const rag = getLineRag(line.from, line.to);
            return (
              <path
                key={`${line.from}-${line.to}`}
                d={d}
                className={`ont-rel-line ont-rel-line--${rag} ont-rel-line--med`}
                markerEnd={`url(#ont-arrow-${rag})`}
              />
            );
          })}
        </svg>

        {/* ═══ COL 1: GOALS ═══ */}
        <Txt x={85} y={967} w={673} h={116} size={48} color="dark">{t(L.vision2030)}</Txt>
        <Img x={183} y={1944} w={477} h={441} src={A.sectorObj} alt="Sector Objectives" nodeKey="sectorObjectives" clickable focal />
        <NodeTxt x={279} y={2501} w={284} h={116} size={24} color="dark">{t(L.sectorObj)}</NodeTxt>

        {/* ═══ COL 2: SECTOR VALUE CHAINS ═══ */}
        <Txt x={949} y={952} w={1258} h={116} size={48} color="light">{t(L.sectorVC)}</Txt>
        <NodeTxt x={1282} y={1185} w={613} h={58} size={24} color="light">{t(L.policyTools)}</NodeTxt>
        <Img x={1343} y={1249} w={477} h={441} src={A.sectorObj} alt="Policy Tools" nodeKey="policyTools" clickable />

        {/* Admin Records */}
        <Img x={1466} y={1577} w={250} h={170} src={A.adminDataTxn + V} alt="Admin Records" nodeKey="adminRecords" />
        <NodeTxt x={1466} y={1755} w={225} h={34} size={14} color="light" bold={false}>{t(L.adminRecords)}</NodeTxt>

        {/* Stakeholder labels */}
        <NodeTxt x={976} y={1790} w={295} h={34} size={16} color="light" bold>{t(L.govEntity)}</NodeTxt>
        <NodeTxt x={1424} y={1790} w={295} h={34} size={16} color="light" bold>{t(L.business)}</NodeTxt>
        <NodeTxt x={1868} y={1790} w={295} h={34} size={16} color="light" bold>{t(L.citizen)}</NodeTxt>

        {/* Sub-sector grid: Gov Entity column (left) */}
        <Img x={1013} y={1920} w={225} h={153} src={A.obj5 + V} alt="Resources" nodeKey="resources" />
        <NodeTxt x={978} y={2080} w={295} h={34} size={12} color="light" bold={false}>{t(L.resources)}</NodeTxt>

        <Img x={1013} y={2110} w={225} h={153} src={A.obj9 + V} alt="Infrastructure" nodeKey="infrastructure" />
        <NodeTxt x={978} y={2270} w={295} h={34} size={12} color="light" bold={false}>{t(L.infrastructure)}</NodeTxt>

        <Img x={1013} y={2300} w={225} h={153} src={A.obj10 + V} alt="Regulatory" nodeKey="regulatory" />
        <NodeTxt x={978} y={2460} w={295} h={34} size={12} color="light" bold={false}>{t(L.regulatory)}</NodeTxt>

        {/* Sub-sector grid: Business column (center) */}
        <Img x={1474} y={1920} w={225} h={153} src={A.obj7 + V} alt="Upstream" nodeKey="businessUp" />
        <NodeTxt x={1424} y={2080} w={295} h={34} size={12} color="light" bold={false}>{t(L.upstreamBiz)}</NodeTxt>

        <Img x={1474} y={2110} w={228} h={155} src={A.obj11 + V} alt="Midstream" nodeKey="businessMid" />
        <NodeTxt x={1424} y={2270} w={325} h={34} size={12} color="light" bold={false}>{t(L.midstreamBiz)}</NodeTxt>

        <Img x={1474} y={2300} w={228} h={155} src={A.obj6 + V} alt="Downstream" nodeKey="businessDown" />
        <NodeTxt x={1424} y={2460} w={325} h={34} size={12} color="light" bold={false}>{t(L.downstreamBiz)}</NodeTxt>

        {/* Sub-sector grid: Citizen column (right) */}
        <Img x={1918} y={1920} w={225} h={153} src={A.obj3 + V} alt="Remote" nodeKey="remote" />
        <NodeTxt x={1868} y={2080} w={295} h={34} size={12} color="light" bold={false}>{t(L.remote)}</NodeTxt>

        <Img x={1918} y={2110} w={225} h={153} src={A.obj14 + V} alt="Agricultural" nodeKey="agricultural" />
        <NodeTxt x={1868} y={2270} w={295} h={34} size={12} color="light" bold={false}>{t(L.agricultural)}</NodeTxt>

        <Img x={1918} y={2300} w={225} h={153} src={A.obj13 + V} alt="Urban" nodeKey="urban" />
        <NodeTxt x={1868} y={2460} w={295} h={34} size={12} color="light" bold={false}>{t(L.urban)}</NodeTxt>

        <Img x={1463} y={2510} w={250} h={150} src={A.adminDataTxn + V} alt="Data Transactions" nodeKey="dataTransactions" />
        <NodeTxt x={1418} y={2667} w={340} h={34} size={12} color="light" bold={false}>{t(L.dataTx)}</NodeTxt>

        <Img x={1343} y={2800} w={477} h={441} src={A.sectorObj} alt="Performance" nodeKey="performance" clickable />
        <NodeTxt x={1282} y={3249} w={613} h={58} size={24} color="light">{t(L.performance)}</NodeTxt>

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
