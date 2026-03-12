# Bad SETS_PRIORITIES Links — L2-to-L2 Matching Task

The graph has wrong SETS_PRIORITIES links between SectorPolicyTool L1 nodes and EntityCapability L1/L3 nodes.
They should be L2-to-L2. Your job: resolve each bad link to the correct L2 pol → L2 cap pair.

## Rules
1. **Cap side resolution is known:**
   - If bad link points to cap L3 (e.g. 6.2.6), the correct cap L2 = parent (6.2)
   - If bad link points to cap L1 (e.g. 3.0), the correct cap L2 = one of its children (3.1, 3.2, or 3.3)
2. **Pol side:** pick the pol L2 child whose name best matches the resolved cap L2 name
3. Output a JSON array of `{polL2Id, polL2Name, capL2Id, capL2Name}` objects

---

## Reference: Cap L2 options

### Cap L1 "1.0" (Sector Strategies, Policies) → children:
- 1.1: National Water Strategy Definition and Oversight
- 1.2: Long term Supply and Demand Planning
- 1.3: S/D Plans integration
- 1.4: Budgeting process management
- 1.5: Sector Policy Development
- 1.6: Water Balancing Account

### Cap L1 "3.0" (Security management/planning) → children:
- 3.1: Water supply security management
- 3.2: Infrastructure planning
- 3.3: Water security asset supervision

### Cap L1 "4.0" (Water sector regulation) → children:
- 4.1: Incentives & Financial Tools
- 4.2: Localization & Local Content
- 4.3: SMEs' Development
- 4.4: Industrial Sustainability
- 4.5: Economic regulation
- 4.6: Quality of water and services
- 4.7: Issuing licenses and permits
- 4.8: Consumer Protection

### Cap L2 "6.2": Water sector analysis and reporting

---

## Bad Links to Resolve

### Pol L1 1.0 — Saudi Water Twin Program
Bad links: cap L1 3.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 1.1: Saaudi Water Observatory (SWO) [already linked to: 3.3, 6.1]
- 1.2: Saaudi Water Twin (Digital Twin) [already linked to: 3.3, 4.4, 5.4]
- 1.3: Mumtathil Platform Integration [already linked to: 1.3]
- 1.4: Imdad Platform [already linked to: 3.2]
- 1.5: Rapid Solutions Office [already linked to: 3.2]
- 1.1: Policy Tool for Processing Time Reduction - Sub KPI 1 [no links]
- 1.2: Policy Tool for Processing Time Reduction - Sub KPI 2 [no links]

### Pol L1 2.0 — Specialized Entity Governance (NWC/WTTCO/SIO/SWPC)
Bad links: cap L1 4.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 2.1: The Water Academy [already linked to: 3.3, 1.6, 2.7]
- 2.2: Tamkeen Program (4th Edition) [already linked to: 4.1, 4.7, 2.2, 1.4, 2.7]
- 2.3: Leadership Development Program [already linked to: 3.2, 4.3, 2.3, 2.1, 1.5, 4.1, 2.7]
- 2.4: Ajyal Academy [already linked to: 3.2, 2.7]
- 2.1: Policy Tool for Compliance Rate - Sub KPI 1 [no links]
- 2.2: Policy Tool for Compliance Rate - Sub KPI 2 [no links]

### Pol L1 3.0 — Transmission Network Program
Bad links: cap L1 4.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 3.1: Yanbu Logistics Platform [already linked to: 1.3]
- 3.2: Mobile Water Systems [already linked to: 3.3, 3.1, 6.4, 4.6, 3.2, 5.4, 5.3, 5.2, 5.1, 4.8, 2.6]
- 3.1: Policy Tool for Licensing Coverage - Sub KPI 1 [no links]
- 3.2: Policy Tool for Licensing Coverage - Sub KPI 2 [no links]

### Pol L1 4.0 — Saudi Water Observatory Program / Water Oasis Research Cluster Program
Bad links: cap L1 4.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 4.1: Global Water Innovation Platform [already linked to: 1.1, 6.2, 5.4, 4.4]
- 4.1: Policy Tool for Customer Satisfaction Rate - Sub KPI 1 [no links]
- 4.2: Policy Tool for Customer Satisfaction Rate - Sub KPI 2 [no links]

### Pol L1 5.0 — WATERA R&D Program
Bad links: cap L1 4.0, cap L3 6.2.4 (→ cap L2 6.2)
L2 children:
- 5.1: Zeta Technology [already linked to: 3.2]
- 5.2: Miyahthon (Water Hackathon) [already linked to: 3.1, 3.2, 2.7]
- 5.1: Policy Tool for Stakeholder Engagement Rate - Sub KPI 1 [no links]
- 5.2: Policy Tool for Stakeholder Engagement Rate - Sub KPI 2 [no links]

### Pol L1 6.0 — Smart Automation Program (Robotics + Mumtathil)
Bad links: cap L1 4.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 6.1: Smart Robot for Tank Inspection [already linked to: 3.3, 3.2]
- 6.2: Kashif Program [already linked to: 3.2]
- 6.1: Policy Tool for Complaint Resolution Rate - Sub KPI 1 [no links]
- 6.2: Policy Tool for Complaint Resolution Rate - Sub KPI 2 [no links]

### Pol L1 7.0 — SWCC → SWA Regulator Transition
Bad links: cap L1 1.0, cap L1 3.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 7.1: Environmental Monitoring Program [already linked to: 6.3, 6.1, 4.5, 3.3]
- 7.2: Circular Economy Roadmap [already linked to: 4.4]
- 7.3: Green Supply Chain Initiative [already linked to: 1.2, 4.4, 2.4, 1.3]
- 7.1: Policy Tool for GDP Contribution Rate - Sub KPI 1 [no links]
- 7.2: Policy Tool for GDP Contribution Rate - Sub KPI 2 [no links]

### Pol L1 8.0 — Specialized Entity Governance (NWC/WTTCO/SIO/SWPC)
Bad links: cap L1 3.0
L2 children:
- 8.1: Policy Tool for Investment Agreement Value - Sub KPI 1 [no links]
- 8.2: Policy Tool for Investment Agreement Value - Sub KPI 2 [no links]

### Pol L1 9.0 — Water Oasis Research Cluster Program
Bad links: cap L1 1.0, cap L1 3.0
L2 children:
- 9.1: Policy Tool for Employment Generation - Sub KPI 1 [no links]
- 9.2: Policy Tool for Employment Generation - Sub KPI 2 [no links]

### Pol L1 10.0 — Policy Tool for Water Loss Reduction / Non-Renewable Groundwater Reduction Program
Bad links: cap L1 3.0, cap L1 4.0
L2 children:
- 10.1: Policy Tool for Water Loss Reduction - Sub KPI 1 [no links]
- 10.2: Policy Tool for Water Loss Reduction - Sub KPI 2 [no links]

### Pol L1 11.0 — Policy Tool for Resource Efficiency / Treated Wastewater Reuse Program
Bad links: cap L1 3.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 11.1: Policy Tool for Resource Efficiency - Sub KPI 1 [no links]
- 11.2: Policy Tool for Resource Efficiency - Sub KPI 2 [no links]

### Pol L1 12.0 — Policy Tool for Service Reliability / Desalination Capacity Expansion Program
Bad links: cap L1 3.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 12.1: Policy Tool for Service Reliability - Sub KPI 1 [no links]
- 12.2: Policy Tool for Service Reliability - Sub KPI 2 [no links]

### Pol L1 13.0 — Carbon Neutrality 2045 Roadmap Program
Bad links: cap L1 3.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 13.1: Policy Tool for Sustainability Index - Sub KPI 1 [no links]
- 13.2: Policy Tool for Sustainability Index - Sub KPI 2 [no links]

### Pol L1 14.0 — Policy Tool for Environmental Compliance Rate / Carbon Neutrality 2045 Roadmap Program
Bad links: cap L1 3.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 14.1: Policy Tool for Environmental Compliance Rate - Sub KPI 1 [no links]
- 14.2: Policy Tool for Environmental Compliance Rate - Sub KPI 2 [no links]

### Pol L1 15.0 — Treated Wastewater Reuse Program (70% by 2030)
Bad links: cap L1 1.0, cap L3 6.2.6 (→ cap L2 6.2)
L2 children:
- 15.1: Policy Tool for Waste Reduction - Sub KPI 1 [no links]
- 15.2: Policy Tool for Waste Reduction - Sub KPI 2 [no links]
