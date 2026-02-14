import { useState } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Users, 
  Plus, 
  Save, 
  X,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Link2
} from 'lucide-react';
import './PlanningLab.css';

// ==================== TYPES ====================

type PlanningMode = 'intervention' | 'annual' | 'scenario';
type AnnualSubMode = 'refresh' | 'reset';

interface ProblemNode {
  capabilityId: string;
  capabilityName: string;
  kpiName: string;
  currentValue: number;
  targetValue: number;
  gap: number;
  status: 'red' | 'amber' | 'green';
}

interface InterventionOption {
  id: string;
  title: string;
  description: string;
  estimatedImpact: string;
  timeline: string;
  confidence: 'high' | 'medium' | 'low';
}

interface PlanFormData {
  stakeholderOwner: string;
  deliverables: string[];
  startDate: string;
  endDate: string;
  hardEndDate: string;
  dependencies: string[];
  newRisks: string;
}

interface ExistingPlan extends PlanFormData {
  id: string;
  createdAt: string;
  lastUpdated: string;
}

interface ScenarioMatrixData {
  outcomes: string[];  // L1 strategic goals
  outputs: string[];   // L2 tactical deliverables
  currentValues: { [key: string]: string };  // outcome-output pairs
}

// ==================== SKELETON GRAPH INTEGRATION ====================

/**
 * Fetch the problem node (EntityCapability + gap info)
 * @param capabilityId - The capability identifier
 * @returns Problem node data with KPI gap information
 * TODO: Implement graph query via Neo4j MCP or backend API
 */
async function fetchProblemNode(capabilityId: string): Promise<ProblemNode | null> {
  // Skeleton implementation
  console.log(`[Graph] fetchProblemNode(${capabilityId})`);
  // TODO: Query Neo4j for EntityCapability node
  // TODO: Fetch attached KPI metrics and calculate gap
  // TODO: Determine status based on SST v1.2 thresholds (35/65)
  return null;
}

/**
 * Create or update a plan node and attach to EntityCapability
 * @param capabilityId - The capability to attach plan to
 * @param planData - The plan details
 * @returns Created/updated plan ID
 * TODO: Implement graph mutation via Neo4j MCP or backend API
 */
async function attachPlanToNode(capabilityId: string, planData: PlanFormData): Promise<string | null> {
  // Skeleton implementation
  console.log(`[Graph] attachPlanToNode(${capabilityId})`, planData);
  // TODO: Create Plan node in Neo4j
  // TODO: Create relationship EntityCapability -[:HAS_PLAN]-> Plan
  // TODO: Create relationships to dependencies (Plan -[:DEPENDS_ON]-> Plan)
  // TODO: Store deliverables, dates, risks as node properties
  // TODO: Link to stakeholder (Plan -[:OWNED_BY]-> Stakeholder)
  return null;
}

/**
 * Fetch existing plan attached to a capability (for Refresh/Annual mode)
 * @param capabilityId - The capability identifier
 * @returns Existing plan data if found
 * TODO: Implement graph query via Neo4j MCP or backend API
 */
async function fetchCurrentPlan(capabilityId: string): Promise<ExistingPlan | null> {
  // Skeleton implementation
  console.log(`[Graph] fetchCurrentPlan(${capabilityId})`);
  // TODO: Query Neo4j for Plan node attached to EntityCapability
  // TODO: Fetch plan properties, deliverables, dates, dependencies
  // TODO: Fetch stakeholder owner via relationship
  return null;
}

/**
 * Fetch L1 outcomes and L2 outputs for scenario matrix
 * @param capabilityId - The capability identifier
 * @returns Matrix structure with current plan values
 * TODO: Implement graph query via Neo4j MCP or backend API
 */
async function fetchScenarioMatrix(capabilityId: string): Promise<ScenarioMatrixData | null> {
  // Skeleton implementation
  console.log(`[Graph] fetchScenarioMatrix(${capabilityId})`);
  // TODO: Query L1 strategic goals (EntityObjective nodes)
  // TODO: Query L2 tactical deliverables (PolicyTool nodes)
  // TODO: Fetch current plan dates for each outcome-output pair
  return null;
}

// ==================== MAIN COMPONENT ====================

interface PlanningLabProps {
  initialCapabilityId?: string;
  initialMode?: PlanningMode;
  initialProblem?: ProblemNode;
}

export function PlanningLab({
  initialCapabilityId,
  initialMode = 'intervention',
  initialProblem
}: PlanningLabProps) {
  const [mode, setMode] = useState<PlanningMode>(initialMode);
  const [capabilityId, setCapabilityId] = useState<string>(initialCapabilityId || '');

  const modeConfig = [
    { 
      id: 'intervention' as PlanningMode, 
      label: 'Intervention Planning', 
      description: 'Address red KPIs with AI-generated options',
      color: '#EF4444'
    },
    { 
      id: 'annual' as PlanningMode, 
      label: 'Annual Planning', 
      description: 'Refresh or reset strategic plans',
      color: '#F59E0B'
    },
    { 
      id: 'scenario' as PlanningMode, 
      label: 'Scenario Simulation', 
      description: 'What-if analysis for outcome timing',
      color: '#10B981'
    },
  ];

  return (
    <div className="planning-lab-container">
      {/* Header */}
      <div className="planning-lab-header">
        <h1 className="planning-lab-title">Planning Lab</h1>
        <p className="planning-lab-subtitle">
          Design interventions, refresh strategic plans, and simulate scenarios
        </p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="planning-lab-mode-selector">
        {modeConfig.map((modeBtn) => (
          <button
            key={modeBtn.id}
            onClick={() => setMode(modeBtn.id)}
            className={`planning-lab-mode-btn ${mode === modeBtn.id ? 'active' : ''}`}
            data-mode={modeBtn.id}
            style={{
              '--mode-color': modeBtn.color
            } as React.CSSProperties}
          >
            <div className="mode-btn-label">{modeBtn.label}</div>
            <div className="mode-btn-description">{modeBtn.description}</div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="planning-lab-content">
        {mode === 'intervention' && (
          <InterventionMode 
            capabilityId={capabilityId} 
            initialProblem={initialProblem}
          />
        )}
        {mode === 'annual' && (
          <AnnualMode capabilityId={capabilityId} />
        )}
        {mode === 'scenario' && (
          <ScenarioMode capabilityId={capabilityId} />
        )}
      </div>
    </div>
  );
}

// ==================== PATH A: INTERVENTION PLANNING ====================

function InterventionMode({ 
  capabilityId, 
  initialProblem 
}: { 
  capabilityId: string;
  initialProblem?: ProblemNode;
}) {
  const [problem, setProblem] = useState<ProblemNode | null>(initialProblem || null);
  const [aiOptions, setAiOptions] = useState<InterventionOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>({
    stakeholderOwner: '',
    deliverables: [''],
    startDate: '',
    endDate: '',
    hardEndDate: '',
    dependencies: [],
    newRisks: ''
  });

  // Mock AI options (these would come from LLM later)
  const mockOptions: InterventionOption[] = [
    {
      id: 'opt1',
      title: 'Accelerate training program',
      description: 'Fast-track operator certification to close capability gap',
      estimatedImpact: 'Reduce gap by 30% in 3 months',
      timeline: '12 weeks',
      confidence: 'high'
    },
    {
      id: 'opt2',
      title: 'Pause non-critical projects',
      description: 'Reduce load saturation by deferring 2 low-priority initiatives',
      estimatedImpact: 'Free up 40% capacity',
      timeline: 'Immediate',
      confidence: 'high'
    },
    {
      id: 'opt3',
      title: 'Increase process automation',
      description: 'Deploy RPA for routine tasks to reduce manual workload',
      estimatedImpact: 'Improve efficiency by 25%',
      timeline: '16 weeks',
      confidence: 'medium'
    },
    {
      id: 'opt4',
      title: 'External consultant support',
      description: 'Bring in domain experts for knowledge transfer',
      estimatedImpact: 'Bridge knowledge gap in 6 weeks',
      timeline: '6-8 weeks',
      confidence: 'medium'
    },
    {
      id: 'opt5',
      title: 'Reorganize team structure',
      description: 'Realign roles to better match capability needs',
      estimatedImpact: 'Reduce org gap by 20%',
      timeline: '8 weeks',
      confidence: 'low'
    }
  ];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowPlanForm(true);
  };

  const handleAddDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, '']
    });
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const handleRemoveDeliverable = (index: number) => {
    const newDeliverables = formData.deliverables.filter((_, i) => i !== index);
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const handleSavePlan = async () => {
    if (!capabilityId) {
      alert('No capability ID provided');
      return;
    }

    // Validate required fields
    if (!formData.stakeholderOwner || !formData.startDate || !formData.endDate || !formData.hardEndDate) {
      alert('Please fill in all required fields');
      return;
    }

    const planId = await attachPlanToNode(capabilityId, formData);
    if (planId) {
      alert('Plan saved successfully!');
      setShowPlanForm(false);
      setSelectedOption(null);
    }
  };

  const handleCancel = () => {
    setShowPlanForm(false);
    setSelectedOption(null);
  };

  return (
    <div className="intervention-mode">
      {/* Red Problem Display */}
      <div className="problem-display glass-box red-accent">
        <div className="problem-header">
          <AlertTriangle className="problem-icon" />
          <h3>Red Problem Detected</h3>
        </div>
        <div className="problem-details">
          <div className="problem-field">
            <span className="label">Capability:</span>
            <span className="value">Plant Operations (L2)</span>
          </div>
          <div className="problem-field">
            <span className="label">KPI:</span>
            <span className="value">Risk Exposure</span>
          </div>
          <div className="problem-field">
            <span className="label">Current:</span>
            <span className="value red-text">68%</span>
          </div>
          <div className="problem-field">
            <span className="label">Target:</span>
            <span className="value">35%</span>
          </div>
          <div className="problem-field">
            <span className="label">Gap:</span>
            <span className="value red-text bold">33 points</span>
          </div>
        </div>
      </div>

      {/* AI Generated Options */}
      {!showPlanForm && (
        <div className="ai-options-section">
          <h3 className="section-title">AI-Generated Intervention Options</h3>
          <p className="section-subtitle">
            Select the option that best addresses the problem. You'll then define the execution plan.
          </p>
          <div className="options-grid">
            {mockOptions.map((option) => (
              <div
                key={option.id}
                className={`option-card glass-box ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="option-header">
                  <div className="option-title">{option.title}</div>
                  <div className={`confidence-badge ${option.confidence}`}>
                    {option.confidence} confidence
                  </div>
                </div>
                <div className="option-description">{option.description}</div>
                <div className="option-meta">
                  <div className="meta-item">
                    <Calendar className="meta-icon" />
                    <span>{option.timeline}</span>
                  </div>
                  <div className="meta-item impact">
                    <CheckCircle2 className="meta-icon" />
                    <span>{option.estimatedImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Detail Form */}
      {showPlanForm && (
        <div className="plan-form-section glass-box">
          <div className="form-header">
            <h3>Define Execution Plan</h3>
            <p className="selected-option-reminder">
              Selected: <strong>{mockOptions.find(o => o.id === selectedOption)?.title}</strong>
            </p>
          </div>

          <div className="form-grid">
            {/* Stakeholder Owner */}
            <div className="form-field full-width">
              <label htmlFor="stakeholder">
                Stakeholder Owner <span className="required">*</span>
              </label>
              <select
                id="stakeholder"
                value={formData.stakeholderOwner}
                onChange={(e) => setFormData({ ...formData, stakeholderOwner: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select stakeholder...</option>
                <option value="director-operations">Director of Operations</option>
                <option value="head-plant">Head of Plant Operations</option>
                <option value="chief-engineer">Chief Engineer</option>
                <option value="vp-delivery">VP Delivery</option>
              </select>
            </div>

            {/* Deliverables */}
            <div className="form-field full-width">
              <label>
                Clear Output Deliverables <span className="required">*</span>
              </label>
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="deliverable-row">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleDeliverableChange(index, e.target.value)}
                    placeholder={`Deliverable ${index + 1}`}
                    className="form-input"
                    required
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                      className="btn-icon"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="btn-secondary btn-sm"
              >
                <Plus size={16} />
                Add Deliverable
              </button>
            </div>

            {/* Dates */}
            <div className="form-field">
              <label htmlFor="startDate">
                Start Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="endDate">
                End Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="hardEndDate">
                Hard End Date (Non-Negotiable) <span className="required">*</span>
              </label>
              <input
                type="date"
                id="hardEndDate"
                value={formData.hardEndDate}
                onChange={(e) => setFormData({ ...formData, hardEndDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            {/* Dependencies */}
            <div className="form-field full-width">
              <label htmlFor="dependencies">
                Dependencies (Other Plans)
              </label>
              <input
                type="text"
                id="dependencies"
                placeholder="Search and select dependent plans..."
                className="form-input"
              />
              <p className="field-hint">
                <Link2 size={14} />
                Link to other plans that must complete before this one
              </p>
            </div>

            {/* New Risks/Issues */}
            <div className="form-field full-width">
              <label htmlFor="newRisks">
                New Risks / Issues
              </label>
              <textarea
                id="newRisks"
                value={formData.newRisks}
                onChange={(e) => setFormData({ ...formData, newRisks: e.target.value })}
                className="form-textarea"
                rows={4}
                placeholder="Describe any new risks or issues introduced by this plan..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button onClick={handleCancel} className="btn-secondary">
              <X size={16} />
              Cancel
            </button>
            <button onClick={handleSavePlan} className="btn-primary red">
              <Save size={16} />
              Save Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PATH B: ANNUAL PLANNING ====================

function AnnualMode({ capabilityId }: { capabilityId: string }) {
  const [subMode, setSubMode] = useState<AnnualSubMode>('refresh');
  const [existingPlan, setExistingPlan] = useState<ExistingPlan | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>({
    stakeholderOwner: '',
    deliverables: [''],
    startDate: '',
    endDate: '',
    hardEndDate: '',
    dependencies: [],
    newRisks: ''
  });

  const handleUpdatePlan = async () => {
    if (!capabilityId) {
      alert('No capability ID provided');
      return;
    }

    const planId = await attachPlanToNode(capabilityId, formData);
    if (planId) {
      alert('Plan updated successfully!');
    }
  };

  const handleResetPlan = async () => {
    if (!capabilityId) {
      alert('No capability ID provided');
      return;
    }

    const planId = await attachPlanToNode(capabilityId, formData);
    if (planId) {
      alert('New plan created successfully!');
      setShowResetConfirm(false);
    }
  };

  const handleAddDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, '']
    });
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const handleRemoveDeliverable = (index: number) => {
    const newDeliverables = formData.deliverables.filter((_, i) => i !== index);
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  return (
    <div className="annual-mode">
      {/* Sub-mode selector */}
      <div className="annual-submode-selector">
        <button
          onClick={() => setSubMode('refresh')}
          className={`submode-btn ${subMode === 'refresh' ? 'active' : ''}`}
        >
          <RefreshCw size={18} />
          <div>
            <div className="submode-label">Refresh Existing Plan</div>
            <div className="submode-desc">Update dates, deliverables, and resources</div>
          </div>
        </button>
        <button
          onClick={() => setSubMode('reset')}
          className={`submode-btn ${subMode === 'reset' ? 'active' : ''}`}
        >
          <Trash2 size={18} />
          <div>
            <div className="submode-label">Strategic Reset</div>
            <div className="submode-desc">Replace plan with new direction</div>
          </div>
        </button>
      </div>

      {/* Refresh Mode */}
      {subMode === 'refresh' && (
        <div className="refresh-mode glass-box amber-accent">
          <h3>Refresh Annual Plan</h3>
          <p className="mode-description">
            Update the existing plan for this capability. No AI assistance — just regular planning refresh.
          </p>

          <div className="form-grid">
            {/* Stakeholder Owner */}
            <div className="form-field full-width">
              <label htmlFor="stakeholder-refresh">
                Stakeholder Owner <span className="required">*</span>
              </label>
              <select
                id="stakeholder-refresh"
                value={formData.stakeholderOwner}
                onChange={(e) => setFormData({ ...formData, stakeholderOwner: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select stakeholder...</option>
                <option value="director-operations">Director of Operations</option>
                <option value="head-plant">Head of Plant Operations</option>
                <option value="chief-engineer">Chief Engineer</option>
                <option value="vp-delivery">VP Delivery</option>
              </select>
            </div>

            {/* Deliverables */}
            <div className="form-field full-width">
              <label>
                Output Deliverables <span className="required">*</span>
              </label>
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="deliverable-row">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleDeliverableChange(index, e.target.value)}
                    placeholder={`Deliverable ${index + 1}`}
                    className="form-input"
                    required
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                      className="btn-icon"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="btn-secondary btn-sm"
              >
                <Plus size={16} />
                Add Deliverable
              </button>
            </div>

            {/* Dates */}
            <div className="form-field">
              <label htmlFor="startDate-refresh">
                Start Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="startDate-refresh"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="endDate-refresh">
                End Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="endDate-refresh"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            {/* Dependencies */}
            <div className="form-field full-width">
              <label htmlFor="dependencies-refresh">
                Dependencies (Other Plans)
              </label>
              <input
                type="text"
                id="dependencies-refresh"
                placeholder="Search and select dependent plans..."
                className="form-input"
              />
            </div>

            {/* New Risks */}
            <div className="form-field full-width">
              <label htmlFor="newRisks-refresh">
                New Risks / Issues
              </label>
              <textarea
                id="newRisks-refresh"
                value={formData.newRisks}
                onChange={(e) => setFormData({ ...formData, newRisks: e.target.value })}
                className="form-textarea"
                rows={4}
                placeholder="Note any new risks or issues..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleUpdatePlan} className="btn-primary amber">
              <Save size={16} />
              Update Plan
            </button>
          </div>
        </div>
      )}

      {/* Reset Mode */}
      {subMode === 'reset' && (
        <div className="reset-mode glass-box amber-accent">
          <h3>Strategic Reset</h3>
          <p className="mode-description warning">
            ⚠️ This will replace the existing plan for this capability. Use this for major directional changes.
          </p>

          {!showResetConfirm ? (
            <>
              <div className="form-grid">
                {/* Same form fields as refresh */}
                <div className="form-field full-width">
                  <label htmlFor="stakeholder-reset">
                    Stakeholder Owner <span className="required">*</span>
                  </label>
                  <select
                    id="stakeholder-reset"
                    value={formData.stakeholderOwner}
                    onChange={(e) => setFormData({ ...formData, stakeholderOwner: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">Select stakeholder...</option>
                    <option value="director-operations">Director of Operations</option>
                    <option value="head-plant">Head of Plant Operations</option>
                    <option value="chief-engineer">Chief Engineer</option>
                    <option value="vp-delivery">VP Delivery</option>
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>
                    Output Deliverables <span className="required">*</span>
                  </label>
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={index} className="deliverable-row">
                      <input
                        type="text"
                        value={deliverable}
                        onChange={(e) => handleDeliverableChange(index, e.target.value)}
                        placeholder={`Deliverable ${index + 1}`}
                        className="form-input"
                        required
                      />
                      {formData.deliverables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(index)}
                          className="btn-icon"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="btn-secondary btn-sm"
                  >
                    <Plus size={16} />
                    Add Deliverable
                  </button>
                </div>

                <div className="form-field">
                  <label htmlFor="startDate-reset">
                    Start Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate-reset"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="endDate-reset">
                    End Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate-reset"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="dependencies-reset">
                    Dependencies (Other Plans)
                  </label>
                  <input
                    type="text"
                    id="dependencies-reset"
                    placeholder="Search and select dependent plans..."
                    className="form-input"
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="newRisks-reset">
                    New Risks / Issues
                  </label>
                  <textarea
                    id="newRisks-reset"
                    value={formData.newRisks}
                    onChange={(e) => setFormData({ ...formData, newRisks: e.target.value })}
                    className="form-textarea"
                    rows={4}
                    placeholder="Note any new risks or issues..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="btn-primary amber"
                >
                  <AlertTriangle size={16} />
                  Create New Plan
                </button>
              </div>
            </>
          ) : (
            <div className="confirm-modal">
              <div className="confirm-content glass-box">
                <AlertTriangle size={48} className="confirm-icon" />
                <h4>Are you sure?</h4>
                <p>This will replace the existing plan with a completely new one.</p>
                <div className="confirm-actions">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPlan}
                    className="btn-primary red"
                  >
                    Yes, Replace Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== PATH C: SCENARIO SIMULATION ====================

function ScenarioMode({ capabilityId }: { capabilityId: string }) {
  const [scenarioMatrix, setScenarioMatrix] = useState<ScenarioMatrixData>({
    outcomes: ['Water Security', 'Infrastructure Resilience', 'Sustainability Goals'],
    outputs: ['Network Upgrade', 'Quality Enhancement', 'Distribution Optimization'],
    currentValues: {
      'Water Security-Network Upgrade': 'Q4 2025',
      'Water Security-Quality Enhancement': 'Q2 2026',
      'Water Security-Distribution Optimization': 'Q3 2026',
      'Infrastructure Resilience-Network Upgrade': 'Q4 2025',
      'Infrastructure Resilience-Quality Enhancement': 'Q1 2026',
      'Infrastructure Resilience-Distribution Optimization': 'Q3 2026',
      'Sustainability Goals-Network Upgrade': 'Q2 2026',
      'Sustainability Goals-Quality Enhancement': 'Q2 2026',
      'Sustainability Goals-Distribution Optimization': 'Q4 2026',
    }
  });

  const [modifications, setModifications] = useState<{ [key: string]: string }>({});
  const [aiFeedback, setAiFeedback] = useState<string>('');

  const handleCellChange = (outcome: string, output: string, newValue: string) => {
    const key = `${outcome}-${output}`;
    setModifications({
      ...modifications,
      [key]: newValue
    });
  };

  const handleSimulate = () => {
    // Mock AI response
    setAiFeedback(
      `Based on your scenario changes:\n\n` +
      `✅ Feasible: Accelerating "Water Security → Network Upgrade" to Q2 2025\n` +
      `⚠️ Risk: This requires +2 FTE and may delay Quality Enhancement by 1 quarter\n` +
      `📊 Impact: Overall program risk increases from 35% to 48%\n\n` +
      `Recommendation: Consider phasing the acceleration to reduce resource strain.`
    );
  };

  return (
    <div className="scenario-mode">
      <div className="scenario-header glass-box green-accent">
        <h3>Scenario Simulation</h3>
        <p className="mode-description">
          Modify outcome delivery dates and see the ripple effects on feasibility, resources, and risk.
        </p>
      </div>

      {/* Matrix Table */}
      <div className="scenario-matrix-container glass-box">
        <h4>Outcomes × Outputs Matrix</h4>
        <p className="matrix-subtitle">
          Current plan values shown. Click cells to modify dates and see what-if scenarios.
        </p>

        <table className="scenario-matrix">
          <thead>
            <tr>
              <th className="matrix-corner">L1 Outcomes \ L2 Outputs</th>
              {scenarioMatrix.outputs.map((output) => (
                <th key={output} className="matrix-header">
                  {output}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarioMatrix.outcomes.map((outcome) => (
              <tr key={outcome}>
                <th className="matrix-row-header">{outcome}</th>
                {scenarioMatrix.outputs.map((output) => {
                  const key = `${outcome}-${output}`;
                  const currentValue = scenarioMatrix.currentValues[key];
                  const modifiedValue = modifications[key];
                  const displayValue = modifiedValue || currentValue;

                  return (
                    <td key={key} className="matrix-cell">
                      <input
                        type="text"
                        value={displayValue}
                        onChange={(e) => handleCellChange(outcome, output, e.target.value)}
                        className={`matrix-input ${modifiedValue ? 'modified' : ''}`}
                        placeholder="Q1 2026"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="matrix-actions">
          <button onClick={handleSimulate} className="btn-primary green">
            <CheckCircle2 size={16} />
            Run Scenario Analysis
          </button>
        </div>
      </div>

      {/* AI Feedback */}
      {aiFeedback && (
        <div className="ai-feedback glass-box green-accent">
          <h4>AI Feasibility Assessment</h4>
          <pre className="feedback-text">{aiFeedback}</pre>
        </div>
      )}
    </div>
  );
}

export default PlanningLab;
