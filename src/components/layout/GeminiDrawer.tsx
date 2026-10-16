'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { TelemetrySummary } from '@/lib/types';
import { useDashboard } from '@/context/DashboardContext';

export default function GeminiDrawer() {
  const { drawerOpen, toggleGeminiDrawer, openModal } = useDashboard();
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (drawerOpen) api.telemetry().then(setTelemetry).catch(() => setTelemetry(null));
  }, [drawerOpen]);

  async function runQuery() {
    if (!query.trim()) {
      openModal('Copilot', 'Type a question for the Gemini Banking Agent first.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.askCopilot(query);
      openModal('Copilot Executed', res.answer);
    } catch (e) {
      openModal('Copilot Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!drawerOpen) return null;
  const t = telemetry;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white text-slate-800 shadow-2xl z-50 p-4 border-l border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-wand-magic-sparkles text-indigo-600 text-base" />
            <h3 className="text-sm font-bold text-slate-900">Gemini Intelligence Hub</h3>
          </div>
          <button onClick={toggleGeminiDrawer} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <span className="text-indigo-600 font-bold block mb-1">Live Multi-Module Telemetry</span>
            {t ? (
              <ul className="text-slate-600 text-[11px] leading-relaxed">
                <li>Connected across all 9 banking modules:</li>
                <li>• Core Banking Health: {t.coreBankingHealth}%</li>
                <li>• DB Storage Time to Threshold: {t.dbHoursToThreshold}h</li>
                <li>• SRE Active Incidents: {t.activeCriticalIncidents} Critical</li>
                <li>• Reconciliation Discrepancy: ${t.reconciliationDiscrepancyUsd.toLocaleString('en-US')}</li>
                <li>• Compliance Controls: {t.compliancePassedPct}% Passed</li>
                <li>• Modernization Progress: {t.modernizationJavaPct}% Java</li>
                <li>• Command Center: {t.commandTasksRunning} Tasks Running</li>
                <li>• Predictive Early Warnings: {t.earlyWarningSignals} Active Signals</li>
                <li>• Governance Queue: {t.governancePending} Approvals Pending</li>
              </ul>
            ) : (
              <p className="text-slate-400 text-[11px]">Loading telemetry...</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Query Gemini Banking Agent</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runQuery()}
              placeholder="e.g., Explain database connection pool spike..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
        </div>
      </div>

      <button onClick={runQuery} disabled={loading} className="action-btn-black font-bold text-xs py-2.5 rounded-xl w-full disabled:opacity-60">
        {loading ? 'Running...' : 'Execute AI Telemetry Query'}
      </button>
    </div>
  );
}
