# Josoor Transformation Intelligence Platform — Feature Glossary

**Purpose:** Plain-language definitions of every user-facing term, mode, button, status, and concept visible in the Josoor platform UI. Intended for AI-assisted user support and onboarding.

**Audience:** Government executives, transformation office staff, and sector analysts.

---

## Section 1 — Desks (Main Views)

### Architecture (Arabic: الهندسة المعمارية)
Where: Main navigation (home)
What: The entry view showing the full SST Ontology — the conceptual map of how sectors, capabilities, risks, and policies are connected. It gives a bird's-eye view of the entire transformation model before drilling into any specific desk.
Example: A new user lands here to understand how "Sector Objectives" link to "Policy Tools" and then to "Entity Capabilities" before navigating to their workspace.

---

### Observation Desk (Arabic: مكتب الرصد)
Where: Left navigation sidebar, labelled "Observation Desk — Strategic Impact"
What: The sector-level view. Displays Saudi Vision 2030 sectors on a geographic map of the Kingdom, with sector objectives, policy tools, and performance KPIs. Decision-makers use this desk to see the external strategic picture — how sector goals are performing and which programs are active.
Example: Selecting the Water sector shows active desalination programs, wastewater reuse targets, and regional infrastructure assets on the map.

---

### Decisions Desk (Arabic: مكتب القرارات)
Where: Left navigation sidebar, labelled "Decisions Desk — Capability Matrix"
What: The enterprise-level view. Displays the full three-level Capability Matrix showing every business capability the organization owns, its current mode (Build or Operate), maturity level, and risk exposure. This is where executives identify which capabilities are under stress and decide whether to intervene.
Example: An executive sees that the "Quality Control" capability is flagged Red and clicks "Intervene" to open a risk intervention plan.

---

### Delivery Desk (Arabic: مكتب التنفيذ)
Where: Left navigation sidebar, labelled "Delivery Desk — Intervention Planning"
What: The planning and execution view. Used to design intervention plans for at-risk capabilities, run strategic resets, and simulate what-if scenarios. The output is a committed intervention plan with tasks, owners, timelines, and deliverables.
Example: After identifying a Red risk in the Decisions Desk, a planner opens the Delivery Desk to generate an AI-assisted intervention plan and commit it with a Gantt timeline.

---

### Control Signals (Arabic: إشارات التحكم)
Where: Left navigation sidebar, labelled "Control Signals — Signal Ribbons"
What: A system-integration health check view. Shows four ribbons of signals — Steering, Risk, Delivery, and Integrity — that indicate whether strategic intent is flowing end-to-end from objectives through to outcomes without leakage or bottlenecks.
Example: The Risk Signals ribbon shows which Policy Tools are threatened by capability delays in BUILD mode.

---

### Reporting Hub (Arabic: مركز التقارير)
Where: Left navigation sidebar, labelled "Reporting Hub — AI Insights"
What: The reporting and output view. Generates standard reports (Performance, Risk Assessment, Portfolio Status, Ministerial Briefs), tracks control outcomes with before/after comparisons, and archives decisions with evidence trails.
Example: A ministerial brief is generated summarizing capability stabilization rates, average risk exposure, and key recommendations for the quarter.

---

### Graph Explorer (Arabic: مستكشف الرسم البياني)
Where: Left navigation sidebar
What: An interactive visual exploration tool that renders the knowledge graph as a 3D force diagram, Sankey flow chart, or data table. Users select a Business Chain or custom node/relationship combinations to visualize how data flows through the ontology.
Example: Selecting "Sector Value Chain" renders an animated flow from Sector Objectives through Policy Tools, Admin Records, Stakeholders, Data Transactions, and back to Performance.

---

## Section 2 — Business Chains

### Sector Value Chain (Arabic: سلسلة قيمة القطاع)
Where: Graph Explorer — Business Chains selector
What: Traces the complete external influence loop of a sector. Starting from a strategic objective, it follows the path through policy tools, administrative rules, stakeholder groups (citizens, businesses, government entities), data transactions, and performance measurements — showing how a policy goal eventually becomes a measured outcome.
Example: A water sector objective to "improve supply continuity" is realized via a desalination policy tool, applied on water consumers, generating transactions measured by daily supply hours KPIs.

---

### Setting Strategic Initiatives (Arabic: تحديد المبادرات الاستراتيجية)
Where: Graph Explorer — Business Chains selector
What: Shows how national strategic objectives drive policy programs that set capability-building priorities within the organization. It maps the path from objective to policy tool to the capability being built, and then into the projects and change-adoption plans needed to close capability gaps.
Example: An objective to "increase private sector participation" sets priorities on the "Investment Management" capability, which has role and process gaps currently being closed by three active projects.

---

### Setting Strategic Priorities (Arabic: تحديد الأولويات الاستراتيجية)
Where: Graph Explorer — Business Chains selector
What: Shows how KPI targets cascade downward from strategic performance goals into specific capabilities and their operational footprint (people, processes, IT). Used to confirm that the organization's capability portfolio is aligned to the right performance targets.
Example: A target of "70% wastewater reuse by 2030" cascades to the "Circular Water Management" capability and reveals gaps in the treatment process and automation systems.

---

### Capability to Policy (Arabic: القدرة إلى السياسة)
Where: Graph Explorer — Business Chains selector
What: The BUILD oversight chain. In Build Mode, this chain shows which policy tools are at risk of delayed delivery because the capabilities needed to execute them are behind schedule. It surfaces the risk exposure percentage and which projects are causing the delay.
Example: "Licensing Reform" policy tool is shown as threatened because the "Regulatory Technology" capability has an 80% build exposure with a 45-day expected delay.

---

### Capability to Performance (Arabic: القدرة إلى الأداء)
Where: Graph Explorer — Business Chains selector
What: The OPERATE oversight chain. In Operate Mode, this chain shows which performance targets (KPIs) are threatened by deteriorating operational health within capabilities. It links people, process, and tools health scores to the sector KPIs they support.
Example: A declining "Process Score" in the distribution capability is linked to missed supply-continuity targets through the Operate oversight chain.

---

### Change to Capability (Arabic: التغيير إلى القدرة)
Where: Graph Explorer — Business Chains selector
What: Traces how change-adoption plans accelerate project delivery which in turn closes capability gaps. Used to understand the readiness of an organization to absorb and sustain the outputs of transformation projects.
Example: A low adoption score on a new workforce management system is shown blocking the closure of a role gap in the "Customer Service" capability.

---

### Sustainable Operations (Arabic: العمليات المستدامة)
Where: Graph Explorer — Business Chains selector
What: The execution spine chain. Maps how organizational units apply processes, which processes are automated by IT systems, and which IT systems depend on external vendors. Used to identify fragility in the operational backbone — where a vendor failure or process gap could cascade into capability degradation.
Example: The "Water Quality Testing" process is automated by a LIMS system that depends on a single vendor, making it a single point of failure visible in this chain.

---

## Section 3 — Query Modes

### Narrative Mode (Arabic: سردي)
Where: Graph Explorer — Query Mode toggle
What: Shows the canonical, fully-connected flow of a business chain as it is designed to work. Nodes appear only when they are connected according to the chain's intended path. Best used to verify that data has been properly loaded and linked.
Example: In Narrative Mode, the Sector Value Chain shows only objectives with complete policy tool → admin record → stakeholder → transaction → performance paths.

---

### Diagnostic Mode (Arabic: تشخيصي)
Where: Graph Explorer — Query Mode toggle
What: Shows all nodes of the relevant types regardless of whether they are connected. Orphaned or isolated nodes appear, revealing data gaps and missing relationships. Best used to audit data completeness and find what is broken or missing.
Example: In Diagnostic Mode, three policy tools appear that have no linked admin records, surfacing a data-entry gap.

---

## Section 4 — Entity Types

### Sector Objective (Arabic: الأهداف القطاعية)
Where: Observation Desk, Graph Explorer (Sector Layer)
What: A strategic goal at the sector level, organized in three levels. L1 is a lagging outcome (e.g., GDP contribution). L2 is a leading outcome that drives L1 (e.g., number of jobs created). L3 is an operational output needed to achieve L2 (e.g., number of investment licenses issued). Together they form the objective hierarchy of a sector.
Example: L1 "Thriving Economy" → L2 "Enable sustainable industrial water supply" → L3 "Increase industrial water agreements by 15%."

---

### Policy Tool / Delivery Program (Arabic: البرامج التنفيذية / أداة السياسة)
Where: Observation Desk, Decisions Desk (Upward Chain panel), Graph Explorer
What: A program, regulation, service, or asset that the government uses to achieve a sector objective. Categories include public services, regulations, fiscal incentives, awareness campaigns, and infrastructure assets. Each policy tool is linked to the capability that executes it and the administrative rules that govern it.
Example: "Treated Wastewater Reuse Program" is a Policy Tool with the National Water Company as responsible entity, targeting 70% reuse by 2030.

---

### Sector Performance (Arabic: الأداء القطاعي)
Where: Observation Desk, Graph Explorer (Sector Layer)
What: A measured KPI at the sector level. L1 is a strategic goal actual value (e.g., GDP). L2 is a leading indicator actual value (e.g., investment inflows). L3 is an operational output metric. Performance nodes show target, baseline, and actual values along with measurement frequency.
Example: "Daily Water Supply Continuity" is an L3 performance node with a target of 22 hours/day and an actual of 19.5 hours/day.

---

### Admin Record (Arabic: السجل الإداري)
Where: Graph Explorer (Sector Layer)
What: The regulatory and administrative data layer. Includes licenses, tariffs, fees, violations, and compliance records. Admin records are applied to citizens, businesses, or government entities, and link policy tools to real-world regulatory enforcement.
Example: A water tariff schedule is an Admin Record applied to both residential consumers and industrial users.

---

### Government Entity (Arabic: جهة حكومية)
Where: Graph Explorer (Sector Layer)
What: A government organization that is affected by or participates in sector policy. Categorized by type (Central, Policy, or Execution) and domain (Economy, Regulation, Operations). Government entities trigger data transactions when they take administrative actions.
Example: The Saudi Water Authority (SWA) is a Policy-type Government Entity in the Water sector.

---

### Business (Arabic: أعمال)
Where: Graph Explorer (Sector Layer)
What: A private sector company or business actor affected by sector policy. Categorized by size (Strategic, SME) and specialization. Business entities trigger data transactions such as license applications or investment registrations.
Example: A large desalination plant operator is a Strategic-size Business entity in the Water sector.

---

### Citizen (Arabic: مواطن)
Where: Graph Explorer (Sector Layer)
What: An individual beneficiary or consumer of sector services. Categorized by type (Beneficiary or Consumer), region, and district. Citizens trigger service-request transactions and are the ultimate end-beneficiaries of sector performance improvements.
Example: A residential water consumer in Riyadh Region is a Citizen node whose service quality is measured by continuity hours.

---

### Data Transaction (Arabic: معاملات البيانات)
Where: Graph Explorer (Sector Layer)
What: A recorded interaction between a stakeholder (citizen, business, or government entity) and the sector — such as a license application, a complaint, a service delivery event, or a compliance check. Transactions are the raw signal that feeds sector performance measurement.
Example: A water leakage complaint submitted through the NWC mobile app is a Data Transaction that feeds the "Complaint Resolution Time" performance KPI.

---

### Capability (Arabic: القدرة)
Where: Decisions Desk (Capability Matrix), Graph Explorer (Enterprise Layer)
What: An organizational ability required to execute a policy tool or meet a performance target. Organized in a three-level hierarchy: L1 Business Domain, L2 Functional Area, L3 Specific Competency. Each capability has a mode (Build or Operate), a maturity level (1–5), and a linked risk record. Capabilities are the central unit of transformation management.
Example: L1 "Water Operations" → L2 "Treatment & Quality" → L3 "Effluent Quality Monitoring" is a specific capability at the operational level.

---

### Risk (Arabic: المخاطر)
Where: Decisions Desk (Risk Profile panel), Graph Explorer (Enterprise Layer)
What: An enterprise risk record automatically linked 1-to-1 with each capability. In Build Mode, the risk measures the probability and expected delay of capability delivery. In Operate Mode, it measures the health of the capability across people, process, and tools dimensions. The risk score determines whether the capability is in the Green, Amber, or Red band.
Example: The risk linked to "Effluent Quality Monitoring" capability shows a people score of 2/5 and a process score of 3/5, giving an Operate Exposure of 55% (Amber band).

---

### Organization Unit (Arabic: الوحدة التنظيمية)
Where: Decisions Desk (Operational Footprint), Graph Explorer (Enterprise Layer)
What: A structural unit of the organization — Department (L1), Sub-Department (L2), or Team (L3). Organization units operate capabilities and are linked to capability gaps when headcount, skills, or budget are insufficient. Projects are scoped to close these gaps.
Example: The "Water Quality Lab Team" is an L3 Organization Unit linked to the "Effluent Quality Monitoring" capability through a Role Gap.

---

### Process (Arabic: العمليات)
Where: Decisions Desk (Operational Footprint), Graph Explorer (Enterprise Layer)
What: A business process that an organization unit applies to operate a capability. At L3, each process has measurable metrics: an actual value, a target, a baseline, a unit of measure, and a trend (improving/stable/declining). Process gaps signal that the capability lacks a documented or efficient procedure.
Example: "License Issuance Process" has an actual cycle time of 18 days against a target of 5 days, with a "declining" trend — a Knowledge Gap linked to the "Regulatory Processing" capability.

---

### IT System (Arabic: الأنظمة التقنية)
Where: Decisions Desk (Operational Footprint), Graph Explorer (Enterprise Layer)
What: A technology platform, module, or feature that automates a process or supports capability operation. IT Systems are linked to capabilities through Automation Gaps when the right system is missing or under-built. They in turn depend on external vendors.
Example: A SCADA system automating the "Plant Operations" process is an L3 IT System. If it is missing, an Automation Gap links back to the "Plant Management" capability.

---

### Project (Arabic: المشاريع)
Where: Decisions Desk (Project Deliverables panel), Delivery Desk
What: A transformation initiative scoped to close one or more capability gaps (role, knowledge, or automation). Projects have a progress percentage, start and end dates, and a status. Overdue projects directly drive up the Build Exposure score of the linked capability.
Example: "HR Competency Framework Implementation" is an L3 Project closing a Role Gap in the "Human Capital" capability, currently 60% complete and 15 days overdue.

---

### Change Adoption (Arabic: تبنّي التغيير)
Where: Graph Explorer (Enterprise Layer), Delivery Desk
What: A record measuring how smoothly a change initiative (typically a project output) is being absorbed into operations. Tracks adoption score and resistance score. Low adoption scores act as a bottleneck — even if a project is complete, poor adoption means the capability gap is not truly closed.
Example: A new digital inspection system was delivered on time, but a Change Adoption record shows a resistance score of 4/5, indicating field teams are not using it — delaying the capability's transition to Operate Mode.

---

### Culture Health (Arabic: صحة الثقافة المؤسسية)
Where: Graph Explorer (Enterprise Layer)
What: An organizational health index (OHI) measurement for a department, sub-department, or team. Tracks survey scores, participation rates, and trends over time. Culture Health monitors organizational units and feeds into the Sustainable Operations chain.
Example: The "Water Operations Department" has a Culture Health survey score of 62% with a declining trend, flagging a potential risk to long-term capability sustainability.

---

### Vendor (Arabic: المورّدين)
Where: Graph Explorer (Enterprise Layer), Sustainable Operations chain
What: An external supplier of a service or technology that an IT System depends upon. Vendor dependencies reveal single points of failure in the operational backbone.
Example: A cloud infrastructure vendor supporting the Saudi Water Twin platform is a Vendor node, and its risk profile feeds into system criticality assessments.

---

## Section 5 — Status and Bands

### Build Mode (Arabic: وضع البناء)
Where: Decisions Desk (capability cards), Control Signals
What: A capability is in Build Mode when it is being constructed for the first time — it has a status of "planned" or "in progress." In this mode, the risk engine measures delivery risk: how likely is it that the capability will be delayed, and by how many days?
Example: "Digital Permit System" capability is in Build Mode because it was approved in Q1 2025 and is currently 40% complete.

---

### Operate Mode (Arabic: وضع التشغيل)
Where: Decisions Desk (capability cards), Control Signals
What: A capability is in Operate Mode when it is active and running. In this mode, the risk engine measures operational health: how well are the people, processes, and tools performing? A declining health score in Operate Mode is an early warning before the capability regresses.
Example: "Customer Complaints Handling" moved from Build to Operate Mode after its new system went live, and is now monitored by people, process, and tools health scores.

---

### Green Band (Arabic: النطاق الأخضر)
Where: Decisions Desk (capability cards and risk badges), Control Signals legend
What: Risk exposure is below 35%. The capability is on track (Build Mode) or operationally healthy (Operate Mode). No intervention is required.
Example: A capability with a Build Exposure of 20% shows a green badge meaning projects are on schedule.

---

### Amber Band (Arabic: النطاق البرتقالي)
Where: Decisions Desk (capability cards and risk badges), Control Signals legend
What: Risk exposure is between 35% and 65%. The capability is experiencing moderate delays or health degradation. Monitoring is recommended and early intervention may be appropriate.
Example: A capability with an Operate Exposure of 50% shows amber because the process score has been declining for two consecutive quarters.

---

### Red Band (Arabic: النطاق الأحمر)
Where: Decisions Desk (capability cards and risk badges), Control Signals legend
What: Risk exposure exceeds 65%. The capability is in critical condition — either severely delayed in Build Mode or significantly degraded in Operate Mode. Immediate intervention is required.
Example: A capability with a Build Exposure of 78% and 45-day expected delay is flagged Red, prompting the Decisions Desk to show an "Intervene" button.

---

### Trend Warning (Arabic: إنذار الاتجاه)
Where: Decisions Desk (capability cards, Trend Early Warning overlay)
What: A special early-warning flag triggered when a capability's operational health has declined for two consecutive measurement cycles, even if the current score is still in the Green band. The system proactively upgrades the band to Amber so the decline is not missed.
Example: A capability with a health score of 30% (technically Green) that dropped from 45% then 38% then 30% over three quarters receives a Trend Warning and is shown as Amber.

---

### Maturity Level 1 (Arabic: مستوى النضج الأول)
Where: Decisions Desk (Maturity Assessment panel)
What: Initial / Ad Hoc. The capability exists only informally — activities are unpredictable and poorly controlled. There are no documented processes, and outcomes depend entirely on individual effort.
Example: A new sustainability reporting function with no defined process, no assigned team, and no systems is at Maturity Level 1.

---

### Maturity Level 2 (Arabic: مستوى النضج الثاني)
Where: Decisions Desk (Maturity Assessment panel)
What: Repeatable / Managed. Basic processes are established and results are consistent but informal. The capability is managed at the project level and depends on key individuals.
Example: Budget preparation follows a consistent annual pattern but relies on one experienced finance officer rather than a documented procedure.

---

### Maturity Level 3 (Arabic: مستوى النضج الثالث)
Where: Decisions Desk (Maturity Assessment panel)
What: Defined / Standardized. Processes are formally documented, standardized across the organization, and consistently followed. There is a process owner and training in place.
Example: License issuance follows a documented 5-step process with assigned roles and a service-level agreement of 5 working days.

---

### Maturity Level 4 (Arabic: مستوى النضج الرابع)
Where: Decisions Desk (Maturity Assessment panel)
What: Managed / Measured. The capability is quantitatively measured and controlled. Data-driven decision-making is used to manage performance and reduce variation.
Example: Water quality testing has automated daily measurements, control charts, and alert thresholds, with managers using dashboards to spot deviations before they become violations.

---

### Maturity Level 5 (Arabic: مستوى النضج الخامس)
Where: Decisions Desk (Maturity Assessment panel)
What: Optimizing / Innovative. The capability continuously improves through systematic experimentation, AI-assisted optimization, and adoption of best practices. It is a recognized center of excellence.
Example: A predictive maintenance capability using machine learning to pre-empt equipment failures before they occur is at Maturity Level 5.

---

## Section 6 — Capability Matrix

### L1 Domain (Arabic: المجال الرئيسي)
Where: Decisions Desk (Capability Matrix — top-level grouping)
What: The highest-level grouping of capabilities — a business domain that represents a major area of organizational activity. L1 groups multiple L2 functional areas that are related in function.
Example: "Water Operations" or "Governance & Regulation" are L1 Domains.

---

### L2 Area (Arabic: المنطقة الوظيفية)
Where: Decisions Desk (Capability Matrix — mid-level grouping)
What: A functional knowledge area within an L1 Domain. L2 groups the specific L3 competencies that collectively deliver a distinct organizational function.
Example: "Treatment & Quality Management" is an L2 Area within the "Water Operations" L1 Domain.

---

### L3 Capability (Arabic: القدرة التفصيلية)
Where: Decisions Desk (Capability Matrix — individual cards)
What: The smallest working unit — a specific competency or activity. Each L3 Capability has its own mode (Build/Operate), maturity score, risk record, and links to projects and operational entities. This is the level at which risk scoring and intervention planning happens.
Example: "Effluent Quality Monitoring" is an L3 Capability within "Treatment & Quality Management" (L2) within "Water Operations" (L1).

---

### Operational Footprint (Arabic: البصمة التشغيلية)
Where: Decisions Desk (Capability Detail Panel)
What: The three types of organizational entities that operate a capability: Organization Units (who does the work), Processes (how the work is done), and IT Systems (what tools automate the work). An imbalanced footprint — for example a well-staffed team with no process documentation and no systems — indicates Footprint Stress.
Example: "Invoice Processing" capability has 12 staff (Organization Unit) but only a manual Excel-based process and no IT system, flagging an Automation Gap.

---

### Role Gap (Arabic: فجوة أدوار)
Where: Decisions Desk (Capability Detail Panel), Graph Explorer
What: A gap between a capability and its supporting Organization Unit — meaning the capability lacks sufficient headcount, the right skills, or budget to be properly staffed.
Example: "Data Analytics" capability has a Role Gap linked to the Analytics Team because the team is 3 FTEs short of the required headcount.

---

### Knowledge Gap (Arabic: فجوة معرفية)
Where: Decisions Desk (Capability Detail Panel), Graph Explorer
What: A gap between a capability and its supporting Processes — meaning the capability lacks documented, standardized, or effective procedures.
Example: "Contract Management" capability has a Knowledge Gap because the procurement process has never been formally documented.

---

### Automation Gap (Arabic: فجوة أتمتة)
Where: Decisions Desk (Capability Detail Panel), Graph Explorer
What: A gap between a capability and its supporting IT Systems — meaning the capability lacks the technology needed to operate efficiently at scale.
Example: "Asset Tracking" capability has an Automation Gap because no asset management system is in place and tracking is done manually.

---

### Strategic Chain (Arabic: السلسلة الاستراتيجية)
Where: Decisions Desk (Capability Detail Panel — Upward Chain section)
What: The upward linkage from an L3 Capability to the Policy Tool and Sector Performance targets it supports, and then up to the Sector Objective. This panel shows the executive "why this capability matters" — connecting day-to-day operational work back to national strategic goals.
Example: "Water Loss Detection" capability links upward to the "Non-Revenue Water Reduction Program" policy tool and the "Water Loss Reduction" KPI, which aggregates to the "Ensure Sustainable Use" sector objective.

---

## Section 7 — Risk Analysis

### Build Exposure (Arabic: تعرض البناء)
Where: Decisions Desk (Risk Profile panel, tooltip), Control Signals
What: In Build Mode, a percentage (0–100%) measuring how much of the maximum tolerable delay window (72 days) has been consumed by overdue projects linked to this capability. A score of 100% means delays have exceeded the acceptable threshold.
Example: Build Exposure of 60% means the capability's projects are 43 days behind schedule out of a 72-day tolerance.

---

### Operate Exposure (Arabic: تعرض التشغيل)
Where: Decisions Desk (Risk Profile panel)
What: In Operate Mode, a percentage calculated as 100% minus the average health score across people, process, and tools dimensions. High Operate Exposure means the capability is degrading in operation.
Example: People Score 2/5, Process Score 3/5, Tools Score 4/5 gives an average health of 60% and an Operate Exposure of 40% (Amber).

---

### Likelihood of Delay (Arabic: احتمالية التأخير)
Where: Decisions Desk (Risk Profile panel)
What: In Build Mode, a probability (0 to 1) that the capability will be delivered late, based on how overdue the linked projects are and how long the delay has persisted across consecutive measurement cycles.
Example: A capability whose projects have been overdue for three consecutive quarters has a Likelihood of Delay of 0.75 (75%).

---

### Delay Days (Arabic: أيام التأخير)
Where: Decisions Desk (Risk Profile panel, tooltip)
What: In Build Mode, the maximum number of days by which the capability's critical project path is behind schedule. Calculated from the worst-overdue project across role, knowledge, and automation gap paths.
Example: A Role Gap project that was due March 1 but is still running on April 15 gives Delay Days of 45.

---

### Operational Health Score (Arabic: درجة الصحة التشغيلية)
Where: Decisions Desk (Risk Profile panel)
What: In Operate Mode, the average of three 1–5 ratings: People Score (staff capability and capacity), Process Score (process quality and adherence), and Tools Score (system performance and coverage). A score of 1 is critically weak; 5 is excellent.
Example: A capability with People 4/5, Process 2/5, Tools 3/5 has an Operational Health of 60%, with Process being the weakest and the primary driver of regression risk.

---

### People Score (Arabic: درجة الكوادر)
Where: Decisions Desk (Risk Profile — Regression Risk Dimensions)
What: A 1–5 rating of the human capital health supporting this capability — including staff numbers, competency levels, and retention. The weakest of the three dimensions drives overall regression risk.
Example: A score of 1 means critically understaffed or undertrained; a score of 5 means the team is fully capable and stable.

---

### Process Score (Arabic: درجة العمليات)
Where: Decisions Desk (Risk Profile — Regression Risk Dimensions)
What: A 1–5 rating of the process maturity supporting this capability — how well-documented, consistent, and efficient the operational processes are.
Example: A score of 2 means processes exist but are largely undocumented and inconsistent across the team.

---

### Tools Score (Arabic: درجة الأدوات)
Where: Decisions Desk (Risk Profile — Regression Risk Dimensions)
What: A 1–5 rating of the IT system health supporting this capability — including system availability, automation coverage, and data quality.
Example: A score of 5 means the capability has full automation coverage with reliable, well-integrated systems.

---

### Risk Status (Arabic: حالة المخاطر)
Where: Decisions Desk (Risk Profile panel)
What: The administrative lifecycle status of a risk record. Can be Open (active and being monitored), Closed (the risk no longer applies), or Mitigated (a mitigation plan has been successfully executed). Closed and Mitigated risks are excluded from the risk scoring engine.
Example: A risk record showing "Mitigated" means the intervention plan was completed and the capability no longer carries that risk in scoring.

---

### Risk Category (Arabic: تصنيف المخاطر)
Where: Decisions Desk (Risk Profile panel)
What: The type of risk the record represents — for example, Delivery Risk (delay in building), Operational Risk (degradation in running), Regulatory Risk, Financial Risk. Categories help filter and prioritize risk portfolios.
Example: "Schedule Delay — Contractor Dependency" is a Delivery Risk category.

---

## Section 8 — Intervention Planning

### Intervention Planning (Arabic: تخطيط التدخلات)
Where: Delivery Desk
What: The workflow for designing a structured response to a Red-band capability. The user selects an intervention strategy, and the AI generates a plan narrative, a set of deliverables, tasks with owners and timelines, and a Gantt chart. Once reviewed and edited, the plan is committed to the system.
Example: A Red capability triggers the Intervention Planning workflow. The planner selects "Mitigate" strategy, reviews the AI-generated 90-day plan, adjusts task owners, and clicks "Commit Plan."

---

### Intervention Strategy (Arabic: استراتيجية التدخل)
Where: Delivery Desk — Choose an Intervention Strategy panel
What: The high-level approach selected to address a risk. Options typically include Mitigate (take action to reduce the risk), Transfer (assign responsibility to another party), and Accept (acknowledge and tolerate the risk within defined limits). The selected strategy shapes the type of plan the AI generates.
Example: Selecting "Mitigate" on a capability with a Role Gap generates tasks for a hiring plan and competency training program.

---

### Commit Plan (Arabic: اعتماد الخطة)
Where: Delivery Desk — Gantt timeline editor
What: The final confirmation button that saves the intervention plan to the system. Once committed, the plan becomes the official record of what will be done, by whom, and by when. It feeds into the Reporting Hub as evidence of a decision.
Example: After reviewing and editing the AI-generated Gantt chart, the planner clicks "Commit Plan" and receives confirmation: "Plan committed successfully."

---

### Deliverable (Arabic: المخرج)
Where: Delivery Desk — intervention plan
What: A specific, tangible output produced as part of an intervention plan. Deliverables are the milestones that mark measurable progress. Each deliverable may contain multiple tasks.
Example: "Approved Staffing Plan" is a deliverable in an intervention plan for a capability with a Role Gap.

---

### Gantt Timeline (Arabic: الجدول الزمني)
Where: Delivery Desk — Edit Timeline view
What: A visual bar chart showing tasks, their owners, start dates, and durations laid out against a calendar. The Gantt view allows planners to edit task sequences and identify schedule conflicts before committing the plan.
Example: The Gantt shows three parallel tasks: "Hire 2 Data Engineers" (8 weeks), "Procure Analytics Platform" (6 weeks), and "Training Program" (4 weeks), all with named owners.

---

### Strategic Reset (Arabic: إعادة التوجيه الاستراتيجي)
Where: Delivery Desk — top-level tabs
What: The annual direction-setting function. Used to review whether objectives should be merged, dropped, or elevated; whether policy tools should be added or retired; and whether capability modes should be changed. It provides AI-generated recommendations for the next planning cycle.
Example: The Strategic Reset analysis recommends merging two overlapping objectives and retiring a policy tool that has shown no measurable impact over two years.

---

### Scenario Simulation (Arabic: محاكاة السيناريوهات)
Where: Delivery Desk — top-level tabs
What: A what-if analysis tool that lets planners inject constraints (e.g., a 15% budget cut, a 6-month schedule delay, a new regulation) and immediately see the impact on risk exposure, load saturation, leakage rates, and capabilities entering the Red band. Scenarios are exploratory only — there is no commit button in the scenario tool.
Example: Injecting "Schedule Delay +6 Months" shows that 3 additional capabilities enter the Red band, helping the team decide whether to accept the delay or accelerate funding.

---

### In-Year Tactical Adjustments (Arabic: تعديلات تكتيكية خلال السنة)
Where: Delivery Desk — Intervention Planning sub-tab
What: Short-term course corrections made within the current year to address emerging risks or execution problems, without waiting for the next annual planning cycle. Distinct from the Strategic Reset, which covers full annual direction-setting.
Example: A mid-year spike in demand for water connections triggers an In-Year Tactical Adjustment to fast-track the "Network Expansion" project.

---

## Section 9 — Performance Terms

### KPI (Arabic: مؤشر الأداء الرئيسي)
Where: Observation Desk (KPI gauges), Decisions Desk (KPI Performance panel)
What: A Key Performance Indicator — a quantified measure of progress toward a strategic target. In Josoor, KPIs exist at sector level and are cascaded to capabilities. Each KPI has a target, a baseline (starting point), and an actual value.
Example: "Treated Wastewater Reuse Rate" is a KPI with a baseline of 45%, a target of 70% by 2030, and a current actual of 52%.

---

### Target (Arabic: المستهدف)
Where: Throughout all desks
What: The desired value of a KPI or performance metric that must be achieved within a defined time period. Targets are set at the sector level and cascade to enterprise capabilities.
Example: Desalinated water production target: more than 16.6 million cubic meters per day by 2030.

---

### Actual (Arabic: الفعلي)
Where: Throughout all desks
What: The real, measured value of a KPI or metric at the current point in time. Compared against the target to calculate variance and determine whether performance is on track.
Example: Actual daily desalinated water production: 14.2 million cubic meters per day as of Q1 2025.

---

### Variance (Arabic: الانحراف)
Where: Delivery Desk, Reporting Hub
What: The difference between the target and the actual value, expressed as a number or percentage. A negative variance means the target is not being met; a positive variance means it is being exceeded.
Example: Reuse Rate target 70%, Actual 52%, Variance -18 percentage points.

---

### Trend (Arabic: الاتجاه)
Where: Throughout all desks (tooltips, risk profiles, process metrics)
What: The direction of change in a metric over successive measurement periods. Can be Improving (moving toward target), Stable (unchanged), or Declining (moving away from target). A declining trend in a metric that is still within acceptable range triggers a Trend Warning.
Example: Supply continuity hours: 19.2 in Q2, 19.0 in Q3, 18.7 in Q4 — a declining trend flagged for early warning.

---

### Process Metric (Arabic: مقياس العملية)
Where: Decisions Desk (Process Metrics section)
What: A specific measurement attached to an L3 Process entity, indicating how well the process performs. Each process metric has a type (cycle time, throughput, volume, quality, or cost), an indicator type (leading, lagging, or coincident), and a trend direction.
Example: "Average Days to Issue License" is a cycle-time process metric with an actual of 18 days, a target of 5 days, and a "declining" trend.

---

### Achievement % (Arabic: نسبة الإنجاز)
Where: Reporting Hub (Key Metrics table)
What: The percentage of a target that has been achieved so far, calculated as (Actual / Target) × 100. Used to quickly scan performance across multiple KPIs in a report.
Example: Reuse Rate actual 52%, target 70% → Achievement of 74%.

---

## Section 10 — UI Controls

### Year / Quarter Selector (Arabic: اختيار السنة / الربع)
Where: Top of all desks (global context bar)
What: A pair of dropdown controls that set the time period for all data displayed across the platform. Changing the year or quarter refreshes the capability matrix, risk scores, KPI actuals, and chain queries to show data for that period.
Example: Selecting "2025 / Q2" shows all capability statuses, risk bands, and KPI actuals as recorded in the second quarter of 2025.

---

### Export (Arabic: تصدير)
Where: Multiple desks (reports, charts)
What: A button that downloads the current view or report as a PDF or structured data file. Used to produce official reports for circulation to leadership or stakeholder briefings.
Example: Clicking "Export PDF" on the Reporting Hub generates a formatted ministerial brief with executive summary, key metrics, and evidence audit trail.

---

### Fetch Live Graph (Arabic: جلب الرسم البياني المباشر)
Where: Graph Explorer — filter panel
What: The button that executes the selected chain query or custom node/relationship query against the live database and renders the result in the chosen visualization format. Pressing this button is required after changing any filter settings.
Example: After selecting "Sector Value Chain" and the year "2025", the user clicks "Fetch Live Graph" to load the actual data.

---

### 3D Force Graph (Arabic: رسم بياني ثلاثي الأبعاد)
Where: Graph Explorer — visualization selector
What: A three-dimensional interactive visualization where nodes are represented as spheres connected by lines. The graph can be rotated, zoomed, and explored spatially. Node color indicates entity type.
Example: The Sector Value Chain rendered in 3D Force Graph shows blue Sector Objective spheres connected to purple Policy Tool spheres, with the user able to rotate the view to trace a specific chain path.

---

### Sankey Flow (Arabic: تدفق سانكي)
Where: Graph Explorer — visualization selector
What: A flow diagram that shows the canonical path of a business chain as a series of ranked columns, with connections (flows) between them proportional to the number of relationships. The Sankey view makes it easy to see where connections are dense or sparse. Gaps in the chain appear as missing flows.
Example: The Setting Strategic Initiatives chain in Sankey view highlights that 12 capabilities receive priority signals from policy tools but only 4 have linked projects, revealing 8 capabilities with unplanned gaps.

---

### Node Limit (Arabic: حد العقد)
Where: Graph Explorer — filter panel
What: A numerical control that limits how many nodes are loaded into the visualization. Reducing the node limit improves performance when working with large datasets; increasing it reveals more of the graph at once.
Example: Setting Node Limit to 50 loads only 50 nodes, making the graph faster to explore on large chains.

---

### Overlay (Arabic: طبقة تحليلية)
Where: Decisions Desk — top filter bar
What: An analytical lens applied on top of the Capability Matrix to highlight a specific dimension of interest. Available overlays include Risk Exposure, External Pressure, Footprint Stress, Change Saturation, and Trend Early Warning. Each overlay recolors the capability cards to show the selected dimension.
Example: Selecting the "Change Saturation" overlay colors all capabilities with 5 or more active concurrent projects in red, immediately showing which capabilities are overloaded with simultaneous change.

---

### External Pressure (Arabic: الضغط الخارجي)
Where: Decisions Desk — Overlay selector and tooltip
What: An overlay and metric that highlights capabilities under heavy regulatory or performance mandate load from external stakeholders. High External Pressure means a capability is constrained by many policy tools or KPI targets simultaneously, leaving little room for operational flexibility.
Example: A capability linked to 6 active policy tools and 4 performance targets shows high External Pressure, indicating it is a critical dependency for multiple strategic outcomes.

---

### Footprint Stress (Arabic: ضغط البصمة التشغيلية)
Where: Decisions Desk — Overlay selector and tooltip
What: An overlay that surfaces capabilities with significant imbalances across their three operational dimensions (Organization, Process, IT). High Footprint Stress means one dimension is dramatically weaker than the others, creating a bottleneck.
Example: A capability with a large, well-trained team but no IT system and undocumented processes has Footprint Stress driven by an Automation Gap and Knowledge Gap.

---

### Change Saturation (Arabic: تشبع التغيير)
Where: Decisions Desk — Overlay selector and tooltip
What: An overlay that identifies capabilities with too many active projects running simultaneously. Excessive change velocity can overload teams, compromise adoption quality, and make it harder to isolate what is working.
Example: A capability running 7 concurrent projects is flagged for Change Saturation — the platform recommends sequencing or pausing lower-priority projects.

---

### AI Risk Analysis (Arabic: تحليل المخاطر بالذكاء الاصطناعي)
Where: Decisions Desk — capability detail panel
What: An on-demand AI narrative that explains the risk situation for a selected capability in plain language. It interprets the build/operate exposure, maturity gap, project status, and external pressure into a concise assessment with recommended actions.
Example: Clicking "AI Risk Analysis" on a Red capability generates a paragraph explaining that the capability is 45 days behind due to a contractor delay in the IT systems project, with a recommendation to escalate to the steering committee.

---

### AI Strategy Brief (Arabic: موجز الاستراتيجية بالذكاء الاصطناعي)
Where: Observation Desk — sector panel
What: An on-demand AI-generated narrative summarizing a sector's strategic situation — its objectives, active policy tools, performance against KPIs, and key risks. Used by executives to get a quick read on a sector before a briefing or meeting.
Example: Clicking "Generate AI Strategy Brief" on the Water sector produces a two-page summary of Vision 2030 objectives, current KPI performance, top risks, and recommended focus areas.

---

### Explain Concept (Arabic: شرح المفهوم)
Where: Available throughout the platform (help panel)
What: A contextual help tool where users type any platform term or concept and receive a plain-language explanation. Designed to help users who encounter unfamiliar terminology while working in the platform.
Example: Typing "Build Exposure" in the Explain Concept box returns a definition explaining it as the percentage of the 72-day delay tolerance consumed by overdue projects.

---

### Intervene (Arabic: تدخل)
Where: Decisions Desk — capability detail panel (visible when capability is Red)
What: A button that appears on a Red-band capability and initiates the Intervention Planning workflow in the Delivery Desk. Clicking it carries the full context of the at-risk capability — its mode, exposure, band, and risk profile — into the planning view.
Example: A Red capability with 78% Build Exposure shows an "Intervene" button. Clicking it opens the Delivery Desk pre-loaded with the capability's risk context.

---

### Signal Ribbons (Arabic: شرائط الإشارات)
Where: Control Signals desk
What: The four diagnostic strips displayed in the Control Signals desk, each measuring a different dimension of system health: (1) Steering Signals — where governance pressure concentrates; (2) Risk Signals — which policy tools or KPIs are threatened; (3) Delivery Signals — where build demand is overloading the system; (4) Integrity Signals — where strategic intent leaks and is lost.
Example: The Integrity Signal ribbon shows "Distribution Capability" with 35% leakage — meaning 35% of the strategic intent flowing through that node is not reaching the next step in the chain.

---

### Leakage (Arabic: التسرب)
Where: Control Signals (Integrity Signals), Reporting Hub
What: A measure of how much strategic intent or governance signal is lost as it flows through a node in the chain. High leakage at a capability or policy tool means that upstream pressure (from objectives and KPIs) is not translating into downstream action or outcomes.
Example: 30% leakage at "Service Quality Objective" means only 70% of the governance signal flowing in is being passed on to the capabilities and policy tools downstream.

---

### Confidence Level (Arabic: مستوى الثقة)
Where: Reporting Hub — Evidence & Audit panel
What: A percentage score indicating how reliable a generated report is, based on data freshness (how recently data was updated), data completeness (whether all required fields are filled), and cross-source validation (whether data from different sources is consistent).
Example: A report with Confidence Level of 72% flags that 3 capabilities are missing maturity scores and that policy tool adoption data is more than 30 days old.

---

### Ministerial Brief (Arabic: الإيجاز الوزاري)
Where: Reporting Hub — Report Type selector
What: A concise, executive-level report format designed for presentation to a minister or senior decision-maker. It summarizes the sector's strategic performance, key risk areas, intervention decisions taken, and recommended next steps — written in plain, non-technical language.
Example: The Q1 Ministerial Brief for the Water sector covers KPI achievement rates, capability stabilization progress, and three escalation items requiring leadership decisions.

---

*Glossary version: 2026-03-15 | Source: Josoor platform UI, SST Ontology v1.2, i18n files (en/ar)*
