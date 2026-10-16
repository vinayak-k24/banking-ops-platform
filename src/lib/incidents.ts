'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Incident, IncidentSeverity, TelemetrySummary } from '@/lib/types';
import type { ModuleId } from '@/lib/modules';
import { useDashboard } from '@/context/DashboardContext';

// Shared incident data: refetched whenever DashboardContext.dataVersion changes,
// so an acknowledge/resolve updates the alert panel, KPI cards and SRE page together.
export function useIncidents() {
  const { dataVersion } = useDashboard();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.listIncidents()
      .then((d) => { if (alive) { setIncidents(d); setError(null); } })
      .catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [dataVersion]);

  return { incidents, error };
}

export function useTelemetry() {
  const { dataVersion } = useDashboard();
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);

  useEffect(() => {
    let alive = true;
    api.telemetry().then((d) => alive && setTelemetry(d)).catch(() => alive && setTelemetry(null));
    return () => { alive = false; };
  }, [dataVersion]);

  return telemetry;
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

export const isActive = (i: Incident) => i.status !== 'RESOLVED';

// Active first, then by severity, then newest first.
export function sortIncidents(list: Incident[]): Incident[] {
  return [...list].sort((a, b) =>
    Number(!isActive(a)) - Number(!isActive(b))
    || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    || b.created_at.localeCompare(a.created_at));
}

export const SEVERITY_STYLE: Record<IncidentSeverity, { label: string; badge: string; card: string; title: string }> = {
  P1: { label: 'P1 CRITICAL', badge: 'bg-rose-100 text-coralRed', card: 'bg-rose-50/50 border-rose-100', title: 'text-rose-900' },
  P2: { label: 'P2 HIGH', badge: 'bg-amber-100 text-amber-800', card: 'bg-amber-50/40 border-amber-100', title: 'text-slate-900' },
  P3: { label: 'P3 MEDIUM', badge: 'bg-blue-100 text-accentBlue', card: 'bg-slate-50 border-slate-100', title: 'text-slate-900' },
  P4: { label: 'P4 LOW', badge: 'bg-slate-200 text-slate-600', card: 'bg-slate-50 border-slate-100', title: 'text-slate-900' },
};

export const STATUS_STYLE: Record<Incident['status'], { label: string; badge: string }> = {
  OPEN: { label: 'Open', badge: 'bg-rose-100 text-coralRed' },
  INVESTIGATING: { label: 'Investigating', badge: 'bg-amber-100 text-amber-800' },
  RESOLVED: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700' },
};

// Page that owns the workflow for an affected service.
export function workflowFor(i: Incident): { page: ModuleId; label: string } {
  switch (i.service_id) {
    case 'DB2_MAIN': return { page: 'dba', label: 'Investigate DB' };
    case 'CORE_LEDGER': return { page: 'reconcile', label: 'Open Reconciliation' };
    case 'COMPLIANCE': return { page: 'audit', label: 'Review Control' };
    default: return { page: 'sre', label: 'Triage Incident' };
  }
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
