// Shapes returned by the Python backend (backend/models/schemas.py).

export interface ChartSeries {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export interface CashFlowSeries extends ChartSeries {
  dates: string[];
  totals: { inflow: number; outflow: number };
}

export interface ReconcileObservation {
  date: string;
  accuracy_pct: number;
  matched: number;
  total: number;
}

export interface ReconcileTrend {
  observations: ReconcileObservation[];
  target_pct: number;
  latest: { date: string; accuracy_pct: number; change_pct: number | null; meets_target: boolean } | null;
}

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface CoreHealth {
  value: number;
  status: HealthStatus;
  thresholds: { healthy: number; warning: number };
}

export interface OverviewCharts {
  fraud: ChartSeries;
  cashFlow: CashFlowSeries;
  compliance: ChartSeries;
  reconcile: ReconcileTrend;
  coreHealth: CoreHealth;
  timeframe: string;
}

export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';

export interface Incident {
  incident_id: string;
  title: string;
  severity: IncidentSeverity;
  service_id: string;
  status: IncidentStatus;
  owner: string | null;
  description?: string;
  evidence: string[];
  created_at: string;
  updated_at: string;
}

export interface TelemetrySummary {
  coreBankingHealth: number | null;
  dbHoursToThreshold: number | null;
  activeCriticalIncidents: number;
  reconciliationDiscrepancyUsd: number;
  compliancePassedPct: number | null;
  modernizationJavaPct: number | null;
  commandTasksRunning: number;
  earlyWarningSignals: number;
  governancePending: number;
}

export type DecisionKind = 'governance' | 'dba';

export interface DecisionInput {
  kind: DecisionKind;
  requestId: string;
  approved: boolean;
  actor: string;
  note?: string;
}

export interface AuditEvent {
  event_id: string;
  actor: string;
  action: string;
  target: string;
  outcome: string;
  related_task_id: string | null;
  details: Record<string, unknown>;
  timestamp: string;
}

export type TaskStatus =
  | 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'APPROVED' | 'REJECTED'
  | 'VERIFYING' | 'SUCCEEDED' | 'FAILED' | 'NEEDS_INVESTIGATION' | 'CANCELLED';

export interface TaskStep {
  step_id: string;
  name: string;
  agent_id: string;
  tool: string | null;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED';
  output: Record<string, unknown> | null;
  error: string | null;
  retries: number;
  started_at: string | null;
  finished_at: string | null;
}

export interface AgentTask {
  task_id: string;
  workflow: string;
  source_page: string;
  description: string;
  priority: string;
  status: TaskStatus;
  steps: TaskStep[];
  current_step: number;
  result: Record<string, unknown> | null;
  approval_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  approval_id: string;
  task_id: string;
  action: string;
  target_system: string;
  parameters: Record<string, unknown>;
  justification: string;
  evidence: string[];
  required_role: string;
  requested_by: string;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer: string | null;
  comment: string | null;
  created_at: string;
  decided_at: string | null;
}

// ---- Migration planner (backend/api/migration.py) ----

export type MigrationSourceType = 'document' | 'codebase_summary';
export type MigrationComponentType =
  | 'infrastructure' | 'database' | 'data' | 'query' | 'application' | 'integration' | 'batch';

export interface MigrationDocument {
  document_id: string;
  file_name: string;
  source_type: MigrationSourceType;
  size_bytes: number;
  status: string;
  uploaded_by: string;
  uploaded_at: string;
  page_count?: number;
  plan_id?: string;
}

export interface MigrationUploadResponse {
  document: MigrationDocument;
  task: AgentTask;
}

export interface MigrationComponent {
  id: string;
  name: string;
  type: MigrationComponentType;
  size: 'S' | 'M' | 'L' | 'XL';
  complexity: 'low' | 'medium' | 'high';
  depends_on: string[];
  source_refs: string[];
  notes: string;
}

export interface MigrationPhase {
  key: string;
  title: string;
  sequence: number;
  components: string[];
  effort_person_weeks: number;
  duration_weeks: number;
  start_week: number;
  end_week: number;
}

export interface MigrationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface MigrationPlan {
  plan_id: string;
  task_id: string;
  document_id: string;
  file_name: string;
  source_type: MigrationSourceType;
  target_platform: string;
  page_count: number;
  status: TaskStatus;
  extraction_method: 'keyword' | 'gemini' | 'codebase_inventory';
  narrative_source: 'template' | 'gemini';
  components: MigrationComponent[];
  plan: {
    phases: MigrationPhase[];
    component_order: string[];
    dependencies: Record<string, string[]>;
    total_weeks: number;
    total_effort_person_weeks: number;
    team_size: number;
    risk_buffer_pct: number;
    warnings: string[];
  };
  narrative: {
    summary: string;
    phase_notes: Record<string, { rationale: string; risks: string[] }>;
    assumptions: string[];
  };
  checks: MigrationCheck[];
  warnings: string[];
  created_by: string;
  created_at: string;
}
