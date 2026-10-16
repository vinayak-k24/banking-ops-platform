export type ModuleId =
  | 'ops'
  | 'dba'
  | 'sre'
  | 'reconcile'
  | 'audit'
  | 'mainframe'
  | 'command'
  | 'risk'
  | 'governance';

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  subtitle: string;
  navLabel: string;
  icon: string;
}

export const MODULES: ModuleMeta[] = [
  { id: 'ops', icon: 'fa-border-all', navLabel: '1. Operations Overview', title: 'Banking Operations Overview', subtitle: 'Centralized view of overall banking operations, transaction health, and operational performance' },
  { id: 'dba', icon: 'fa-database', navLabel: '2. DB & Archival', title: 'Database Capacity & Archival Intelligence', subtitle: 'Storage capacity monitoring, mainframe Db2 archival job queues, and predictive threshold intelligence' },
  { id: 'sre', icon: 'fa-circle-exclamation', navLabel: '3. Incident Reliability', title: 'Incident & Service Reliability Center', subtitle: 'SRE incident triage, system uptime SLA trackers, dependency health, and root-cause event timelines' },
  { id: 'reconcile', icon: 'fa-scale-balanced', navLabel: '4. Reconciliation', title: 'Transaction & Reconciliation Monitoring', subtitle: 'Inter-ledger discrepancy tracking, settlement throughput latency, and automated fee variance matching' },
  { id: 'audit', icon: 'fa-file-shield', navLabel: '5. Compliance & Audit', title: 'Compliance & Audit Center', subtitle: 'Regulatory control completion matrix, evidence management, searchable audit trails, and AI observations' },
  { id: 'mainframe', icon: 'fa-microchip', navLabel: '6. Modernization Tracker', title: 'Mainframe Modernization Tracker', subtitle: 'COBOL program inventory, Spring Boot microservice migration progress, and business-rule equivalence tests' },
  { id: 'command', icon: 'fa-robot', navLabel: '7. Gemini Command Center', title: 'Gemini Agent Command Center', subtitle: 'Central agent orchestration, multi-step execution logs, tool invocation inspector, and reasoning summaries' },
  { id: 'risk', icon: 'fa-triangle-exclamation', navLabel: '8. Predictive Risk Center', title: 'Predictive Risk & Early Warning Center', subtitle: 'Early warning signals, capacity breach projections, queue buildup forecasts, and preventive AI actions' },
  { id: 'governance', icon: 'fa-user-check', navLabel: '9. Human Governance', title: 'Human-in-the-Loop Governance Center', subtitle: 'Human authorization queue, approval signatures, risk guardrails, and audit traceability' },
];

export const MODULE_IDS = MODULES.map((m) => m.id);

export function getModule(id: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.id === id);
}

export const ACTORS = [
  { value: 'coo', label: 'COO Executive' },
  { value: 'dba', label: 'Database Admin (DBA)' },
  { value: 'sre', label: 'SRE Reliability Lead' },
  { value: 'reconciler', label: 'Reconciliation Lead' },
  { value: 'auditor', label: 'Compliance Auditor' },
  { value: 'migration', label: 'Modernization Director' },
] as const;

export type ActorRole = (typeof ACTORS)[number]['value'];
