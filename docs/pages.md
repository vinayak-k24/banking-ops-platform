# UI Pages

Each page is its own route and component (`src/app/(dashboard)/<id>/page.tsx` → `src/components/pages/*Page.tsx`). Metadata (title, subtitle, icon) is in `src/lib/modules.ts`.

| # | Route | Component | Purpose | Agents | Backend wiring |
|---|---|---|---|---|---|
| 1 | `/ops` | OperationsOverviewPage | Single view of operations health | operations_agent | Charts from `/api/charts/overview` (cash flow and reconciliation trend from the store; fraud/compliance static); alert panel + modal (`components/alerts/AlertsQueue.tsx`) and Active Incidents KPI from `/api/incidents` and `/api/telemetry`; other KPI cards still static |
| 2 | `/dba` | DatabaseArchivalPage | Capacity, archival jobs, queue, DBA decision | database_agent | DBA decision button → `/api/decisions`; data still static |
| 3 | `/sre` | IncidentReliabilityPage | Incident triage and reliability | incident_agent | Incident table and Active Incidents KPI from `/api/incidents`; other cards static |
| 4 | `/reconcile` | ReconciliationPage | Reconciliation exceptions | reconciliation_agent | Static |
| 5 | `/audit` | ComplianceAuditPage | Controls, evidence, audit trail | compliance_agent | Static |
| 6 | `/mainframe` | ModernizationTrackerPage | COBOL→Java migration tracking; Migration Planner (`components/migration/MigrationPlanner.tsx`) | migration_agent | Tracker static; planner → `/api/migration/*` + task polling |
| 7 | `/command` | AgentCommandCenterPage | Agent tasks, steps, tool calls | orchestrator | Static |
| 8 | `/risk` | PredictiveRiskPage | Early warnings and forecasts | risk_agent | Static |
| 9 | `/governance` | HumanGovernancePage | Approval queue and decisions (spec: "Action & Decision Management") | verification_agent | Approve/Reject → `/api/decisions` (legacy) |

## Shared UI

| Component | File | Backend |
|---|---|---|
| Sidebar | `components/layout/Sidebar.tsx` | — |
| Header (persona, timeframe, export) | `components/layout/Header.tsx` | `/api/export` |
| Gemini drawer | `components/layout/GeminiDrawer.tsx` | `/api/telemetry`, `/api/copilot` |
| Modal | `components/layout/UniversalModal.tsx` | — |
| State and actions | `context/DashboardContext.tsx` | `/api/decisions`, `/api/export` |

Wiring the static pages to backend data is tracked in [todo.md](todo.md).
