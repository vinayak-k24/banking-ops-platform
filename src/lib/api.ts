import type {
  AgentTask, Approval, AuditEvent, DecisionInput, MigrationPlan, MigrationSourceType, MigrationUploadResponse,
  OverviewCharts, TelemetrySummary,
} from '@/lib/types';

// Browser-side client. /api/* is proxied by Next.js to the Python backend (see next.config.mjs).
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  // Multipart uploads must let the browser set the boundary header.
  const jsonHeader: Record<string, string> = init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  const res = await fetch(url, {
    ...init,
    headers: { ...jsonHeader, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : data?.error;
    throw new Error(detail ?? `Request failed (${res.status})`);
  }
  return data as T;
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  overviewCharts: (timeframe: string) =>
    request<OverviewCharts>(`/api/charts/overview?timeframe=${encodeURIComponent(timeframe)}`),
  telemetry: () => request<TelemetrySummary>('/api/telemetry'),
  recordDecision: (input: DecisionInput) => request<AuditEvent>('/api/decisions', post(input)),
  askCopilot: (query: string) => request<{ answer: string; source: string }>('/api/copilot', post({ query })),
  exportReport: (type: string) => request<{ status: string; fileName: string }>('/api/export', post({ type })),

  // Agent task lifecycle
  listTasks: () => request<AgentTask[]>('/api/tasks'),
  getTask: (taskId: string) => request<AgentTask>(`/api/tasks/${encodeURIComponent(taskId)}`),
  startTask: (workflow: string, params: Record<string, unknown>, actor: string, sourcePage?: string) =>
    request<AgentTask>('/api/tasks', post({ workflow, params, actor, source_page: sourcePage })),

  // Approvals
  listApprovals: (decision?: Approval['decision']) =>
    request<Approval[]>(`/api/approvals${decision ? `?decision=${decision}` : ''}`),
  decideApproval: (approvalId: string, approved: boolean, reviewer: string, reviewerRole: string, comment?: string) =>
    request<{ approval: Approval; task: AgentTask | null }>(
      `/api/approvals/${encodeURIComponent(approvalId)}/decision`,
      post({ approved, reviewer, reviewer_role: reviewerRole, comment }),
    ),

  // Migration planner
  migrationCodebasePrompt: () => request<{ prompt: string; file_name: string }>('/api/migration/codebase-prompt'),
  uploadMigrationDocument: (file: File, sourceType: MigrationSourceType, targetPlatform: string, teamSize: number, actor: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('source_type', sourceType);
    form.append('target_platform', targetPlatform);
    form.append('team_size', String(teamSize));
    form.append('actor', actor);
    return request<MigrationUploadResponse>('/api/migration/documents', { method: 'POST', body: form });
  },
  getMigrationPlan: (planId: string) => request<MigrationPlan>(`/api/migration/plans/${encodeURIComponent(planId)}`),
  migrationReportUrl: (planId: string, format: 'md' | 'pdf') =>
    `/api/migration/plans/${encodeURIComponent(planId)}/report?format=${format}`,
};
