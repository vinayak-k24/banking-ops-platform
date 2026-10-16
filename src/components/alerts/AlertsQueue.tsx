'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import type { Incident, IncidentSeverity } from '@/lib/types';
import { useDashboard } from '@/context/DashboardContext';
import {
  SEVERITY_STYLE, STATUS_STYLE, formatTimestamp, isActive, sortIncidents, useIncidents, workflowFor,
} from '@/lib/incidents';

const PANEL_LIMIT = 3;
const SEVERITIES: IncidentSeverity[] = ['P1', 'P2', 'P3', 'P4'];

// Acknowledge/resolve an incident and tell every page to refetch shared data.
function useIncidentActions() {
  const { actor, notifyDataChanged } = useDashboard();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (incident: Incident, action: 'acknowledge' | 'resolve') => {
    setPending(`${incident.incident_id}:${action}`);
    setError(null);
    try {
      await api.updateIncident(incident.incident_id, action, actor);
      notifyDataChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  };
  return { run, pending, error };
}

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${SEVERITY_STYLE[severity].badge}`}>{SEVERITY_STYLE[severity].label}</span>;
}

function StatusBadge({ status }: { status: Incident['status'] }) {
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[status].badge}`}>{STATUS_STYLE[status].label}</span>;
}

// Fixed-height card on the overview page: shows at most three active alerts.
export function AlertsPanel() {
  const { switchPage } = useDashboard();
  const { incidents, error } = useIncidents();
  const [modal, setModal] = useState<{ open: boolean; selected: string | null }>({ open: false, selected: null });

  const active = useMemo(() => sortIncidents((incidents ?? []).filter(isActive)), [incidents]);
  const closeModal = useCallback(() => setModal({ open: false, selected: null }), []);

  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center h-6 mb-1.5 shrink-0">
        <h3 className="text-xs font-bold text-slate-900">
          Critical Alerts & Incident Queue
          {incidents && <span className="ml-1.5 text-[9px] font-bold text-slate-400">{active.length} active</span>}
        </h3>
        <button onClick={() => setModal({ open: true, selected: null })} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">See Details</button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
        {error && <p className="text-[10px] text-coralRed">Could not load alerts: {error}</p>}
        {!error && !incidents && <p className="text-[10px] text-slate-400">Loading alerts...</p>}
        {incidents && active.length === 0 && <p className="text-[10px] text-slate-400">No active alerts.</p>}
        {active.slice(0, PANEL_LIMIT).map((i) => {
          const wf = workflowFor(i);
          return (
            <div
              key={i.incident_id}
              role="button"
              tabIndex={0}
              onClick={() => setModal({ open: true, selected: i.incident_id })}
              onKeyDown={(e) => e.key === 'Enter' && setModal({ open: true, selected: i.incident_id })}
              className={`border rounded-xl px-2 py-1.5 cursor-pointer hover:shadow-sm transition-shadow shrink-0 ${SEVERITY_STYLE[i.severity].card}`}
            >
              <div className="flex justify-between items-center gap-2">
                <span className={`font-bold text-xs truncate ${SEVERITY_STYLE[i.severity].title}`}>{i.title}</span>
                <SeverityBadge severity={i.severity} />
              </div>
              <p className="text-[10px] text-slate-600 leading-tight truncate">{i.description ?? i.evidence.join('; ')}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] text-slate-400">{formatTimestamp(i.created_at)} · {STATUS_STYLE[i.status].label}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); switchPage(wf.page); }}
                  className="action-btn-black text-[9px] font-bold px-2.5 py-0.5 rounded-lg"
                >
                  {wf.label}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <AlertsModal
          incidents={incidents ?? []}
          initialSelected={modal.selected}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function AlertsModal({ incidents, initialSelected, onClose }: {
  incidents: Incident[];
  initialSelected: string | null;
  onClose: () => void;
}) {
  const { switchPage } = useDashboard();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity | 'ALL'>('ALL');
  const [showResolved, setShowResolved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const { run, pending, error } = useIncidentActions();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortIncidents(incidents).filter((i) =>
      (showResolved || isActive(i))
      && (severity === 'ALL' || i.severity === severity)
      && (!q || [i.title, i.incident_id, i.service_id, i.description ?? ''].some((f) => f.toLowerCase().includes(q))));
  }, [incidents, query, severity, showResolved]);

  const activeCount = incidents.filter(isActive).length;
  const selected = incidents.find((i) => i.incident_id === selectedId) ?? null;

  // Portal keeps the overlay out of the dashboard grid so opening it never changes layout.
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alerts-modal-title"
        className="bg-white rounded-2xl w-full max-w-2xl h-[min(640px,85vh)] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {selected && (
              <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-700 text-xs" aria-label="Back to all alerts">
                <i className="fa-solid fa-arrow-left" />
              </button>
            )}
            <h3 id="alerts-modal-title" className="text-xs font-bold text-slate-900">
              {selected ? selected.incident_id : 'All Alerts & Incidents'}
            </h3>
            {!selected && <span className="text-[10px] font-bold text-slate-400">{activeCount} active · {incidents.length} total</span>}
          </div>
          <button ref={closeRef} onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs" aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {error && <div className="px-5 py-2 text-[10px] text-coralRed bg-rose-50 border-b border-rose-100 shrink-0">{error}</div>}

        {selected ? (
          <AlertDetail
            incident={selected}
            pending={pending}
            onAction={(action) => run(selected, action)}
            onOpenWorkflow={() => { onClose(); switchPage(workflowFor(selected).page); }}
          />
        ) : (
          <>
            <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative flex-1 min-w-[180px]">
                <i className="fa-solid fa-magnifying-glass text-[10px] text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, ID or service"
                  maxLength={80}
                  className="w-full text-[11px] bg-slate-50 border border-slate-100 rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-slate-300"
                />
              </div>
              {(['ALL', ...SEVERITIES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-full ${severity === s ? 'bg-slateDark text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                >
                  {s === 'ALL' ? 'All' : s}
                </button>
              ))}
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 cursor-pointer">
                <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
                Show resolved
              </label>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
              {filtered.length === 0 && <p className="text-[11px] text-slate-400 text-center py-6">No alerts match the current filters.</p>}
              {filtered.map((i) => (
                <button
                  key={i.incident_id}
                  onClick={() => setSelectedId(i.incident_id)}
                  className={`w-full text-left border rounded-xl p-2.5 hover:shadow-sm transition-shadow ${SEVERITY_STYLE[i.severity].card} ${isActive(i) ? '' : 'opacity-60'}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className={`font-bold text-xs truncate ${SEVERITY_STYLE[i.severity].title}`}>{i.title}</span>
                    <span className="flex gap-1">
                      <StatusBadge status={i.status} />
                      <SeverityBadge severity={i.severity} />
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{i.description ?? i.evidence.join('; ')}</p>
                  <div className="text-[9px] text-slate-400 mt-1">{i.incident_id} · {i.service_id} · {formatTimestamp(i.created_at)}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function AlertDetail({ incident: i, pending, onAction, onOpenWorkflow }: {
  incident: Incident;
  pending: string | null;
  onAction: (action: 'acknowledge' | 'resolve') => void;
  onOpenWorkflow: () => void;
}) {
  const busy = pending?.startsWith(i.incident_id) ?? false;
  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900">{i.title}</h4>
          <SeverityBadge severity={i.severity} />
          <StatusBadge status={i.status} />
        </div>
        {i.description && <p className="leading-relaxed">{i.description}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <dt className="text-slate-400">Service</dt><dd className="font-semibold text-slate-800">{i.service_id}</dd>
          <dt className="text-slate-400">Owner</dt><dd className="font-semibold text-slate-800">{i.owner ?? 'Unassigned'}</dd>
          <dt className="text-slate-400">Raised</dt><dd className="font-semibold text-slate-800">{formatTimestamp(i.created_at)}</dd>
          <dt className="text-slate-400">Last update</dt><dd className="font-semibold text-slate-800">{formatTimestamp(i.updated_at)}</dd>
        </dl>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Evidence</div>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
            {i.evidence.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 shrink-0">
        {i.status === 'OPEN' && (
          <button disabled={busy} onClick={() => onAction('acknowledge')} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50">
            {pending === `${i.incident_id}:acknowledge` ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        )}
        {i.status !== 'RESOLVED' && (
          <button disabled={busy} onClick={() => onAction('resolve')} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50">
            {pending === `${i.incident_id}:resolve` ? 'Resolving...' : 'Mark Resolved'}
          </button>
        )}
        <button onClick={onOpenWorkflow} className="action-btn-black px-3 py-1.5 text-xs font-bold rounded-xl">{workflowFor(i).label}</button>
      </div>
    </>
  );
}
