import type { TFunction } from 'i18next';

export type WaterL3Item = { id: string; title: string; value: string };
export type WaterProgramFamilyId =
  | 'governance'
  | 'infrastructure_desalination'
  | 'circular_reuse'
  | 'digital_ai'
  | 'innovation_climate';

export type WaterProgramId = WaterProgramFamilyId;

export type WaterExecutionProgram = {
  id: string;
  familyId: WaterProgramFamilyId;
  label: string;
  team: string;
  output: string;
  kpi: string;
  capability: string;
};

export type WaterProgram = {
  id: string;
  groupId: WaterProgramId;
  title: string;
  team: string;
  output: string;
  kpi: string;
  capability: string;
};

export const WATER_PROGRAM_GRAPH_MATCHERS: Record<string, { exactNames: string[]; keywords: string[] }> = {
  'swa-regulator-transition': {
    exactNames: ['Water Monitoring & Regulation'],
    keywords: ['regulator', 'governance', 'compliance', 'oversight']
  },
  'specialized-entity-governance': {
    exactNames: ['Policy Tool for Compliance Rate'],
    keywords: ['entity', 'governance', 'service', 'coordination']
  },
  'desal-capacity-expansion': {
    exactNames: ['Policy Tool for Service Reliability'],
    keywords: ['desal', 'capacity', 'production', 'plant']
  },
  'transmission-network-program': {
    exactNames: ['Water Logistics & Service Delivery'],
    keywords: ['transmission', 'network', 'delivery', 'distribution']
  },
  'treated-wastewater-reuse-program': {
    exactNames: ['Policy Tool for Resource Efficiency'],
    keywords: ['reuse', 'treated', 'wastewater', 'recycling']
  },
  'groundwater-reduction-program': {
    exactNames: ['Policy Tool for Water Loss Reduction'],
    keywords: ['groundwater', 'conservation', 'sustainability', 'reduction']
  },
  'saudi-water-twin-program': {
    exactNames: ['Water Digital Platforms'],
    keywords: ['digital twin', 'digital', 'model', 'planning']
  },
  'water-observatory-program': {
    exactNames: ['Policy Tool for Customer Satisfaction Rate'],
    keywords: ['observatory', 'monitoring', 'analytics', 'intelligence']
  },
  'smart-automation-program': {
    exactNames: ['Water Inspection & Compliance'],
    keywords: ['automation', 'inspection', 'smart', 'compliance']
  },
  'carbon-neutrality-roadmap': {
    exactNames: ['Policy Tool for Environmental Compliance Rate'],
    keywords: ['carbon', 'emissions', 'climate', 'decarbonization']
  },
  'water-oasis-program': {
    exactNames: ['Water Innovation Ecosystem'],
    keywords: ['research', 'innovation', 'pilot', 'technology']
  },
  'watera-rd-program': {
    exactNames: ['Water Innovation & R&D'],
    keywords: ['r&d', 'innovation', 'technology', 'applied']
  }
};

export type WaterVisionL3 = {
  id: string;
  title: string;
  value: string;
  l3: WaterL3Item[];
  linkedPrograms?: string[];
};

export function buildWaterPrograms(): WaterProgram[] {
  return [
    {
      id: 'swcc-to-swa',
      groupId: 'governance',
      title: 'From Operator to Regulator (SWCC → SWA)',
      team: 'SWA',
      output: 'Sector-wide regulatory and supervisory model',
      kpi: 'Regulatory compliance and oversight coverage',
      capability: 'Policy & Regulation Capability'
    },
    {
      id: 'specialized-entities',
      groupId: 'governance',
      title: 'Privatization & Specialized Entities',
      team: 'WSM / NWC / WTTCO / SIO / SWPC',
      output: 'Specialized value-chain operating model',
      kpi: 'PPP pipeline and service performance by entity',
      capability: 'Integrated Water Management Capability'
    },
    {
      id: 'record-desal-capacity',
      groupId: 'infrastructure_desalination',
      title: 'Record Desalination Capacity',
      team: 'SWA + desalination operators',
      output: 'Production capacity above 16.6M m³/day',
      kpi: 'Daily desalinated production capacity',
      capability: 'Supply Reliability Capability'
    },
    {
      id: 'transmission-networks',
      groupId: 'infrastructure_desalination',
      title: 'Transmission Network Expansion',
      team: 'WTTCO',
      output: 'National transmission network above 14,000 km',
      kpi: 'Network length and daily delivery capacity',
      capability: 'Network Operations Capability'
    },
    {
      id: 'continuity-storage',
      groupId: 'infrastructure_desalination',
      title: 'Supply Continuity & Strategic Storage',
      team: 'NWC + SWA',
      output: 'Improved continuity hours and storage resilience',
      kpi: 'Supply continuity (hrs/day) and storage duration (days)',
      capability: 'Service Reliability Capability'
    },
    {
      id: 'treated-wastewater-2030',
      groupId: 'circular_reuse',
      title: 'Treated Wastewater Reuse 2030',
      team: 'NWC + SIO',
      output: 'Reuse trajectory toward 70% by 2030',
      kpi: 'Treated wastewater reuse rate (%)',
      capability: 'Circular Water Management Capability'
    },
    {
      id: 'agri-reuse-2026',
      groupId: 'circular_reuse',
      title: 'Agricultural Reuse Program (2026)',
      team: 'SIO',
      output: 'Expanded reuse for agricultural/industrial/urban use',
      kpi: 'Reuse share and non-renewable groundwater reduction',
      capability: 'Resource Sustainability Capability'
    },
    {
      id: 'saudi-water-twin',
      groupId: 'digital_ai',
      title: 'Saudi Water Twin Project',
      team: 'SWA + digital partners',
      output: 'Virtual models for planning and optimization',
      kpi: 'Coverage of network digital twin models',
      capability: 'Digital Planning Capability'
    },
    {
      id: 'saudi-water-observatory',
      groupId: 'digital_ai',
      title: 'Saudi Water Observatory',
      team: 'SWA',
      output: 'AI analytics for real-time sector intelligence',
      kpi: 'Response time to service challenges and issue detection rate',
      capability: 'AI Monitoring Capability'
    },
    {
      id: 'smart-automation',
      groupId: 'digital_ai',
      title: 'Smart Automation & Mumtathil',
      team: 'SWA + field operations',
      output: 'Automated inspection and compliance monitoring',
      kpi: 'Inspection automation rate and violation response speed',
      capability: 'Smart Operations Capability'
    },
    {
      id: 'carbon-neutrality-2045',
      groupId: 'innovation_climate',
      title: 'Carbon Neutrality by 2045',
      team: 'SWA',
      output: 'Decarbonization roadmap for water services',
      kpi: 'Emissions intensity reduction vs roadmap',
      capability: 'Climate Transition Capability'
    },
    {
      id: 'water-oasis',
      groupId: 'innovation_climate',
      title: 'Water Oasis',
      team: 'SWA + research ecosystem',
      output: 'Large-scale green research cluster for water tech',
      kpi: 'Pilot projects and technology commercialization throughput',
      capability: 'R&D Translation Capability'
    },
    {
      id: 'watera',
      groupId: 'innovation_climate',
      title: 'WATERA R&D Engine',
      team: 'WATERA',
      output: 'Advanced water technologies and localized innovation',
      kpi: 'R&D output, patents, and deployable innovations',
      capability: 'Applied Innovation Capability'
    }
  ];
}
export type WaterVisionL2 = { id: string; title: string; value: string; l2: WaterVisionL3[] };
export type WaterPillar = { id: string; title: string; value: string; l1: WaterVisionL2[] };

export function getWaterProgramFamilies(t: TFunction): Array<{ id: WaterProgramFamilyId; label: string }> {
  return [
    { id: 'governance', label: t('josoor.sector.waterPrograms.governance', 'Institutional Restructuring & Governance') },
    { id: 'infrastructure_desalination', label: t('josoor.sector.waterPrograms.infrastructure_desalination', 'Infrastructure & Desalination') },
    { id: 'circular_reuse', label: t('josoor.sector.waterPrograms.circular_reuse', 'Circular Economy & Reuse') },
    { id: 'digital_ai', label: t('josoor.sector.waterPrograms.digital_ai', 'Digital Transformation & AI') },
    { id: 'innovation_climate', label: t('josoor.sector.waterPrograms.innovation_climate', 'Innovation & Climate Action') }
  ];
}

export function getWaterExecutionPrograms(t: TFunction): WaterExecutionProgram[] {
  return [
    {
      id: 'swa-regulator-transition',
      familyId: 'governance',
      label: t('josoor.sector.waterExec.swaRegulator.title', 'SWCC → SWA Regulator Transition'),
      team: t('josoor.sector.waterExec.swaRegulator.team', 'SWA Transformation Office'),
      output: t('josoor.sector.waterExec.swaRegulator.output', 'Regulatory operating model and sector supervision framework'),
      kpi: t('josoor.sector.waterExec.swaRegulator.kpi', 'Regulatory mandate coverage and compliance adoption'),
      capability: t('josoor.sector.waterExec.swaRegulator.cap', 'Policy & Regulation Capability')
    },
    {
      id: 'specialized-entity-governance',
      familyId: 'governance',
      label: t('josoor.sector.waterExec.specializedEntities.title', 'Specialized Entity Governance (NWC/WTTCO/SIO/SWPC)'),
      team: t('josoor.sector.waterExec.specializedEntities.team', 'SWA + NWC + WTTCO + SIO + SWPC'),
      output: t('josoor.sector.waterExec.specializedEntities.output', 'Clear value-chain roles and coordinated governance model'),
      kpi: t('josoor.sector.waterExec.specializedEntities.kpi', 'Service accountability and inter-entity handoff performance'),
      capability: t('josoor.sector.waterExec.specializedEntities.cap', 'Integrated Water Management Capability')
    },
    {
      id: 'desal-capacity-expansion',
      familyId: 'infrastructure_desalination',
      label: t('josoor.sector.waterExec.desalCapacity.title', 'Desalination Capacity Expansion Program'),
      team: t('josoor.sector.waterExec.desalCapacity.team', 'WSM + SWPC + Delivery Partners'),
      output: t('josoor.sector.waterExec.desalCapacity.output', 'New/expanded plants delivering >16.6M m³/day capacity'),
      kpi: t('josoor.sector.waterExec.desalCapacity.kpi', 'Installed desalinated production capacity'),
      capability: t('josoor.sector.waterExec.desalCapacity.cap', 'Supply Reliability Capability')
    },
    {
      id: 'transmission-network-program',
      familyId: 'infrastructure_desalination',
      label: t('josoor.sector.waterExec.transmission.title', 'Transmission Network Program'),
      team: t('josoor.sector.waterExec.transmission.team', 'WTTCO Network Operations'),
      output: t('josoor.sector.waterExec.transmission.output', '14,000+ km transmission backbone with higher delivery resilience'),
      kpi: t('josoor.sector.waterExec.transmission.kpi', 'Daily transmission throughput and continuity hours'),
      capability: t('josoor.sector.waterExec.transmission.cap', 'Network Operations Capability')
    },
    {
      id: 'treated-wastewater-reuse-program',
      familyId: 'circular_reuse',
      label: t('josoor.sector.waterExec.reuse70.title', 'Treated Wastewater Reuse Program (70% by 2030)'),
      team: t('josoor.sector.waterExec.reuse70.team', 'NWC Reuse Programs + SIO Integration'),
      output: t('josoor.sector.waterExec.reuse70.output', 'Scaled treated effluent reuse across municipal/industrial/agricultural demand'),
      kpi: t('josoor.sector.waterExec.reuse70.kpi', 'Treated wastewater reuse rate'),
      capability: t('josoor.sector.waterExec.reuse70.cap', 'Circular Water Management Capability')
    },
    {
      id: 'groundwater-reduction-program',
      familyId: 'circular_reuse',
      label: t('josoor.sector.waterExec.groundwater.title', 'Non-Renewable Groundwater Reduction Program'),
      team: t('josoor.sector.waterExec.groundwater.team', 'SIO + Agricultural Water Management Teams'),
      output: t('josoor.sector.waterExec.groundwater.output', 'Reduced groundwater dependency through reuse substitution'),
      kpi: t('josoor.sector.waterExec.groundwater.kpi', 'Groundwater consumption reduction rate'),
      capability: t('josoor.sector.waterExec.groundwater.cap', 'Resource Sustainability Capability')
    },
    {
      id: 'saudi-water-twin-program',
      familyId: 'digital_ai',
      label: t('josoor.sector.waterExec.twin.title', 'Saudi Water Twin Program'),
      team: t('josoor.sector.waterExec.twin.team', 'SWA Digital Engineering + Data Teams'),
      output: t('josoor.sector.waterExec.twin.output', 'National digital twin for water network planning and optimization'),
      kpi: t('josoor.sector.waterExec.twin.kpi', 'Twin model coverage and planning-cycle impact'),
      capability: t('josoor.sector.waterExec.twin.cap', 'Digital Planning Capability')
    },
    {
      id: 'water-observatory-program',
      familyId: 'digital_ai',
      label: t('josoor.sector.waterExec.observatory.title', 'Saudi Water Observatory Program'),
      team: t('josoor.sector.waterExec.observatory.team', 'SWA AI Analytics + Service Intelligence Teams'),
      output: t('josoor.sector.waterExec.observatory.output', 'Real-time analytics for complaints, discourse, and service risk signals'),
      kpi: t('josoor.sector.waterExec.observatory.kpi', 'Issue detection lead-time and response acceleration'),
      capability: t('josoor.sector.waterExec.observatory.cap', 'AI Monitoring Capability')
    },
    {
      id: 'smart-automation-program',
      familyId: 'digital_ai',
      label: t('josoor.sector.waterExec.automation.title', 'Smart Automation Program (Robotics + Mumtathil)'),
      team: t('josoor.sector.waterExec.automation.team', 'Operational Automation & Inspection Teams'),
      output: t('josoor.sector.waterExec.automation.output', 'Automated inspections and AI-assisted compliance monitoring'),
      kpi: t('josoor.sector.waterExec.automation.kpi', 'Inspection productivity and violation resolution cycle time'),
      capability: t('josoor.sector.waterExec.automation.cap', 'Smart Operations Capability')
    },
    {
      id: 'carbon-neutrality-roadmap',
      familyId: 'innovation_climate',
      label: t('josoor.sector.waterExec.carbon2045.title', 'Carbon Neutrality 2045 Roadmap Program'),
      team: t('josoor.sector.waterExec.carbon2045.team', 'SWA Sustainability & Energy Transition Office'),
      output: t('josoor.sector.waterExec.carbon2045.output', 'Decarbonization pathways for desalination and water services'),
      kpi: t('josoor.sector.waterExec.carbon2045.kpi', 'Emissions intensity reduction trajectory'),
      capability: t('josoor.sector.waterExec.carbon2045.cap', 'Climate Transition Capability')
    },
    {
      id: 'water-oasis-program',
      familyId: 'innovation_climate',
      label: t('josoor.sector.waterExec.oasis.title', 'Water Oasis Research Cluster Program'),
      team: t('josoor.sector.waterExec.oasis.team', 'Water Oasis Innovation Cluster'),
      output: t('josoor.sector.waterExec.oasis.output', 'Pilot plants and labs for scalable water-tech innovation'),
      kpi: t('josoor.sector.waterExec.oasis.kpi', 'Pilot-to-deployment conversion rate'),
      capability: t('josoor.sector.waterExec.oasis.cap', 'R&D Translation Capability')
    },
    {
      id: 'watera-rd-program',
      familyId: 'innovation_climate',
      label: t('josoor.sector.waterExec.watera.title', 'WATERA R&D Program'),
      team: t('josoor.sector.waterExec.watera.team', 'WATERA Research & Technology Teams'),
      output: t('josoor.sector.waterExec.watera.output', 'Advanced technologies (e.g., Zeta) and brine-to-energy solutions'),
      kpi: t('josoor.sector.waterExec.watera.kpi', 'Commercialized innovations and technology adoption index'),
      capability: t('josoor.sector.waterExec.watera.cap', 'Applied Innovation Capability')
    }
  ];
}

export function buildWaterHighLevelHierarchy(t: TFunction): WaterPillar[] {
  return [
    {
      id: 'vibrant',
      title: t('josoor.sector.cascade.water.pillars.vibrant.title'),
      value: t('josoor.sector.cascade.water.pillars.vibrant.value'),
      l1: [
        {
          id: 'sustainable-use',
          title: t('josoor.sector.cascade.water.l1.sustainableUse.title', 'Ensure sustainable use of water resources'),
          value: t('josoor.sector.cascade.water.l1.sustainableUse.value', 'Primary water sector objective under Vision 2030'),
          l2: [
            {
              id: 'reuse',
              title: t('josoor.sector.cascade.water.l2.reuse.title', 'Maximize renewable water and treated wastewater reuse'),
              value: t('josoor.sector.cascade.water.l2.reuse.value', '70% reuse by 2030'),
              linkedPrograms: ['treated-wastewater-reuse-program', 'groundwater-reduction-program', 'specialized-entity-governance'],
              l3: [
                { id: 'process-leakage', title: t('josoor.sector.cascade.water.l3.processLeakage.title'), value: t('josoor.sector.cascade.water.l3.processLeakage.value') },
                { id: 'asset-pipelines', title: t('josoor.sector.cascade.water.l3.assetPipelines.title'), value: t('josoor.sector.cascade.water.l3.assetPipelines.value') }
              ]
            },
            {
              id: 'desal',
              title: t('josoor.sector.cascade.water.l2.desal.title', 'Enhance desalinated water resources'),
              value: t('josoor.sector.cascade.water.l2.desal.value', '>16.6M m³/day'),
              linkedPrograms: ['desal-capacity-expansion', 'transmission-network-program', 'specialized-entity-governance'],
              l3: [
                { id: 'asset-rasalkhair', title: t('josoor.sector.cascade.water.l3.assetRasAlKhair.title'), value: t('josoor.sector.cascade.water.l3.assetRasAlKhair.value') },
                { id: 'asset-tabukjazan', title: t('josoor.sector.cascade.water.l3.assetTabukJazan.title'), value: t('josoor.sector.cascade.water.l3.assetTabukJazan.value') }
              ]
            }
          ]
        },
        {
          id: 'integrated-management',
          title: t('josoor.sector.cascade.water.l1.integratedManagement.title', 'Integrated water management for beneficiaries'),
          value: t('josoor.sector.cascade.water.l1.integratedManagement.value', 'Reliable and equitable supply for all consumers'),
          l2: [
            {
              id: 'continuity-storage',
              title: t('josoor.sector.cascade.water.l2.continuityStorage.title', 'Improve continuity, pressure, and strategic storage'),
              value: t('josoor.sector.cascade.water.l2.continuityStorage.value', 'Operational reliability and service quality'),
              linkedPrograms: ['transmission-network-program', 'desal-capacity-expansion', 'specialized-entity-governance'],
              l3: [
                { id: 'process-delivery', title: t('josoor.sector.cascade.water.l3.processDelivery.title'), value: t('josoor.sector.cascade.water.l3.processDelivery.value') },
                { id: 'asset-storage', title: t('josoor.sector.cascade.water.l3.assetStorage.title'), value: t('josoor.sector.cascade.water.l3.assetStorage.value') }
              ]
            },
            {
              id: 'beneficiary-protection',
              title: t('josoor.sector.cascade.water.l2.beneficiaryProtection.title', 'Protect beneficiaries and improve service trust'),
              value: t('josoor.sector.cascade.water.l2.beneficiaryProtection.value', 'Faster complaint handling and service responsiveness'),
              linkedPrograms: ['swa-regulator-transition', 'specialized-entity-governance'],
              l3: [
                { id: 'beneficiary-complaints', title: t('josoor.sector.cascade.water.l3.beneficiaryComplaints.title', 'Process: complaint monitoring'), value: t('josoor.sector.cascade.water.l3.beneficiaryComplaints.value', 'Public feedback and beneficiary safeguards') },
                { id: 'beneficiary-compliance', title: t('josoor.sector.cascade.water.l3.beneficiaryCompliance.title', 'Process: compliance follow-up'), value: t('josoor.sector.cascade.water.l3.beneficiaryCompliance.value', 'Service-level and quality compliance') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'thriving',
      title: t('josoor.sector.cascade.water.pillars.thriving.title'),
      value: t('josoor.sector.cascade.water.pillars.thriving.value'),
      l1: [
        {
          id: 'economic-contribution',
          title: t('josoor.sector.cascade.water.l1.economicContribution.title', 'Enable water-sector economic contribution'),
          value: t('josoor.sector.cascade.water.l1.economicContribution.value', 'GDP impact, local content, and private participation'),
          l2: [
            {
              id: 'gdp-local-content',
              title: t('josoor.sector.cascade.water.l2.gdpLocalContent.title', 'Increase GDP contribution and local content'),
              value: t('josoor.sector.cascade.water.l2.gdpLocalContent.value', 'Economic value creation from water services'),
              linkedPrograms: ['swa-regulator-transition', 'watera-rd-program', 'water-oasis-program'],
              l3: [
                { id: 'gdp-metric', title: t('josoor.sector.cascade.water.l3.gdpMetric.title', 'Performance: GDP contribution rate'), value: t('josoor.sector.cascade.water.l3.gdpMetric.value', 'Economic contribution KPI') },
                { id: 'investment-metric', title: t('josoor.sector.cascade.water.l3.investmentMetric.title', 'Performance: investment agreement value'), value: t('josoor.sector.cascade.water.l3.investmentMetric.value', 'Attracting private and strategic investment') }
              ]
            },
            {
              id: 'industrial-reliability',
              title: t('josoor.sector.cascade.water.l2.industrialReliability.title', 'Support industrial reliability and supply continuity'),
              value: t('josoor.sector.cascade.water.l2.industrialReliability.value', 'Reliable water for growth sectors'),
              linkedPrograms: ['transmission-network-program', 'desal-capacity-expansion'],
              l3: [
                { id: 'continuity-kpi', title: t('josoor.sector.cascade.water.l3.continuityKpi.title', 'Performance: supply continuity'), value: t('josoor.sector.cascade.water.l3.continuityKpi.value', 'Hours/day continuity and pressure stability') },
                { id: 'loss-kpi', title: t('josoor.sector.cascade.water.l3.lossKpi.title', 'Performance: water loss reduction'), value: t('josoor.sector.cascade.water.l3.lossKpi.value', 'Lower non-revenue water and leakage losses') }
              ]
            }
          ]
        },
        {
          id: 'innovation-digitization',
          title: t('josoor.sector.cascade.water.l1.innovationDigitization.title', 'Advance innovation and digitization capabilities'),
          value: t('josoor.sector.cascade.water.l1.innovationDigitization.value', 'Technology-enabled operations and ecosystem capability'),
          l2: [
            {
              id: 'twin-observatory',
              title: t('josoor.sector.cascade.water.l2.twinObservatory.title'),
              value: t('josoor.sector.cascade.water.l2.twinObservatory.value'),
              linkedPrograms: ['saudi-water-twin-program', 'water-observatory-program', 'smart-automation-program', 'watera-rd-program'],
              l3: [
                { id: 'asset-twin', title: t('josoor.sector.cascade.water.l3.assetTwin.title'), value: t('josoor.sector.cascade.water.l3.assetTwin.value') },
                { id: 'process-alerting', title: t('josoor.sector.cascade.water.l3.processAlerting.title'), value: t('josoor.sector.cascade.water.l3.processAlerting.value') }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'ambitious',
      title: t('josoor.sector.cascade.water.pillars.ambitious.title'),
      value: t('josoor.sector.cascade.water.pillars.ambitious.value'),
      l1: []
    }
  ];
}
