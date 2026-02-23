type OverlayKey = {
  label: string;
  name: string;
};

type OverlayValue = {
  term_equivalent?: string;
  target?: string;
  baseline?: string;
  actual_value?: string;
  unit?: string;
  value_source?: string;
};

const OVERLAY: Record<string, OverlayValue> = {
  'SectorObjective::Contribute to National GDP': {
    term_equivalent: 'Manufacturing GDP growth objective',
    value_source: 'text_overlay',
  },
  'SectorPerformance::GDP Contribution Rate': {
    term_equivalent: 'Manufacturing GDP target',
    target: 'SAR 895 Billion by 2030',
    unit: 'SAR',
    value_source: 'text_overlay',
  },
  'SectorPerformance::Investment Agreement Value': {
    term_equivalent: 'FDI / investment attraction proxy',
    target: 'FDI 5.7% of GDP by 2030',
    unit: '% GDP',
    value_source: 'text_overlay',
  },
  'SectorPerformance::Employment Generation': {
    term_equivalent: 'Jobs created',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Water Loss Reduction': {
    term_equivalent: 'Non-revenue water loss reduction',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Resource Efficiency': {
    term_equivalent: 'Sustainable water use efficiency',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Service Reliability': {
    term_equivalent: 'Supply continuity rate',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Sustainability Index': {
    term_equivalent: 'National sustainability performance',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Environmental Compliance Rate': {
    term_equivalent: 'Environmental governance compliance',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Waste Reduction': {
    term_equivalent: 'Waste minimization KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Processing Time Reduction': {
    term_equivalent: 'Regulatory cycle-time reduction KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Compliance Rate': {
    term_equivalent: 'Policy/regulatory compliance KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Licensing Coverage': {
    term_equivalent: 'Licensing scope KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Customer Satisfaction Rate': {
    term_equivalent: 'Stakeholder experience KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Stakeholder Engagement Rate': {
    term_equivalent: 'Engagement KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPerformance::Complaint Resolution Rate': {
    term_equivalent: 'Operational service quality KPI',
    value_source: 'db_label_equivalent',
  },
  'SectorPolicyTool::Policy Tool for GDP Contribution Rate': {
    term_equivalent: 'NIS/NIDLP-style GDP contribution policy instrument',
    value_source: 'text_overlay',
  },
  'SectorPolicyTool::Policy Tool for Investment Agreement Value': {
    term_equivalent: 'Investment and FDI attraction policy instrument',
    value_source: 'text_overlay',
  },
  'SectorPolicyTool::Ras Al-Khair Industrial City': {
    term_equivalent: 'Physical industrial asset contributing to GDP objective',
    value_source: 'db_label_equivalent',
  },
};

function keyFor(label: string, name: string): string {
  return `${label}::${name}`;
}

export function enrichOntologyNode<T extends Record<string, any>>(node: T): T {
  const label = (node._labels || node.labels || [])[0];
  const name = node.name;
  if (!label || !name) return node;

  const overlay = OVERLAY[keyFor(label, name)];
  if (!overlay) return node;

  return {
    ...node,
    term_equivalent: node.term_equivalent || overlay.term_equivalent,
    target: node.target || overlay.target,
    baseline: node.baseline || overlay.baseline,
    actual_value: node.actual_value || overlay.actual_value,
    unit: node.unit || overlay.unit,
    value_source: node.value_source || overlay.value_source,
  };
}

export function findOntologyEquivalent(term: string): Array<{ key: string; value: OverlayValue }> {
  const q = term.toLowerCase().trim();
  if (!q) return [];
  return Object.entries(OVERLAY)
    .filter(([key, value]) => key.toLowerCase().includes(q) || (value.term_equivalent || '').toLowerCase().includes(q))
    .map(([key, value]) => ({ key, value }));
}
