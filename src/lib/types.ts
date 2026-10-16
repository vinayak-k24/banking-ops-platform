// Shapes returned by the Python backend (backend/models/schemas.py).

export interface ChartSeries {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export interface OverviewCharts {
  fraud: ChartSeries;
  cashFlow: ChartSeries;
  compliance: ChartSeries;
  reconcile: ChartSeries;
  coreHealth: number;
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
