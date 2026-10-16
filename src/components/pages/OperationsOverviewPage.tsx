'use client';

import { useDashboard } from '@/context/DashboardContext';
import {
  CASH_FLOW_COLORS, COMPLIANCE_COLORS, CashFlowBarChart, ComplianceDonutChart, FraudDetectionChart,
  ReconcileTrendChart, formatUsdCompact, useOverviewCharts,
} from '@/components/charts/OverviewCharts';
import CoreHealthGauge from '@/components/charts/CoreHealthGauge';
import { AlertsPanel } from '@/components/alerts/AlertsQueue';
import { isActive, useIncidents, useTelemetry } from '@/lib/incidents';
import type { HealthStatus } from '@/lib/types';

// Shared card shell and header row so titles and See Details controls line up across cards.
const CARD = 'bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col min-h-0 overflow-hidden';
const CARD_HEADER = 'flex justify-between items-center min-h-[24px] shrink-0';
const DETAIL_BTN = 'text-[10px] font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full shrink-0';

const HEALTH_BADGE: Record<HealthStatus, string> = {
  HEALTHY: 'bg-teal-50 text-teal-700',
  WARNING: 'bg-amber-100 text-amber-800',
  CRITICAL: 'bg-rose-100 text-coralRed',
};
const HEALTH_LABEL: Record<HealthStatus, string> = { HEALTHY: 'Healthy', WARNING: 'Degraded', CRITICAL: 'Critical' };

export default function OperationsOverviewPage() {
  const { openModal } = useDashboard();
  const charts = useOverviewCharts();
  const telemetry = useTelemetry();
  const { incidents } = useIncidents();

  const cash = charts?.cashFlow;
  const compliance = charts?.compliance;
  const health = charts?.coreHealth;
  const reconcile = charts?.reconcile;
  const latest = reconcile?.latest ?? null;

  const active = (incidents ?? []).filter(isActive);
  const p1 = active.filter((i) => i.severity === 'P1').length;
  const p2 = active.filter((i) => i.severity === 'P2').length;

  const cashFlowDetail = cash
    ? `Last 7 days. Inflow: ${formatUsdCompact(cash.totals.inflow)} | Outflow: ${formatUsdCompact(cash.totals.outflow)} | Net: ${formatUsdCompact(cash.totals.inflow - cash.totals.outflow)}`
    : 'Cash flow data unavailable.';
  const complianceDetail = compliance
    ? compliance.labels.map((l, i) => `${l}: ${compliance.datasets[0].data[i]}%`).join(' | ')
    : 'Compliance data unavailable.';
  const reconcileDetail = reconcile?.latest
    ? `Latest run ${reconcile.latest.date}: ${reconcile.latest.accuracy_pct.toFixed(2)}% matched (target ${reconcile.target_pct}%).\n`
      + `Lowest in period: ${Math.min(...reconcile.observations.map((o) => o.accuracy_pct)).toFixed(2)}% across ${reconcile.observations.length} run(s).`
    : 'No reconciliation runs recorded.';

  return (
    <section className="h-full flex flex-col gap-3 min-h-0">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Total Volume', '1,420,500 transactions processed in selected period.')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">1.42M</div>
                <div className="text-[9px] font-semibold text-emerald-600 mt-0.5">+4.2% vs last month</div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Success / Failed', 'Successful: 1,418,200 | Failed: 2,300 (0.16% failure rate).')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success / Failed</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">99.84%</div>
                <div className="text-[9px] font-semibold text-rose-500 mt-0.5">2,300 failed txns</div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Active Incidents', telemetry ? `${telemetry.activeCriticalIncidents} active P1/P2 incidents (${p1} P1, ${p2} P2); ${active.length} active alerts in total.` : 'Incident data unavailable.')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Incidents</div>
                <div className="text-xl font-black text-coralRed mt-0.5">{telemetry ? `${telemetry.activeCriticalIncidents} P1/P2` : '—'}</div>
                <div className="text-[9px] font-semibold text-coralRed mt-0.5">{incidents ? `${p1} P1 · ${p2} P2 · ${active.length} total active` : 'Loading...'}</div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Service Availability', 'Core Ledger: 99.99% | SWIFT Gate: 99.95% | Mobile API: 99.89%.')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">99.94%</div>
                <div className="text-[9px] font-semibold text-slate-400 mt-0.5">SLA Target: 99.90%</div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Processing Speed', 'Average latency per transaction: 142ms. Processing throughput: 8,400 tps.')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Txn Speed</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">142 ms</div>
                <div className="text-[9px] font-semibold text-emerald-600 mt-0.5">8,400 tps peak</div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Pending Operational Tasks', '152 pending loan queues, 12 compliance reviews, 80 fraud holds.')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">244 Tasks</div>
                <div className="text-[9px] font-semibold text-amber-600 mt-0.5">Requires Action</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
            <div className="col-span-8 flex flex-col gap-3 min-h-0 overflow-hidden">
                <div className={`${CARD} flex-1 min-h-[150px] relative`}>
                    <div className={CARD_HEADER}>
                        <div>
                            <h3 className="text-xs font-bold text-slate-900">Transaction Volume & AI Fraud Prediction</h3>
                            <p className="text-[9px] text-slate-400">Simulated real-time volume vs flagged anomalies</p>
                        </div>
                        <button onClick={() => openModal('Volume Detail', 'Detailed breakdown of prediction vs detected fraud metrics.')} className={DETAIL_BTN}>See Details</button>
                    </div>
                    <div className="flex-1 relative w-full min-h-[110px] mt-1">
                        <FraudDetectionChart />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 h-[48%] min-h-[250px] max-h-[380px] shrink-0">
                    <div className={CARD}>
                        <div className={CARD_HEADER}>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900">Cash Flow Analytics</h3>
                                <p className="text-[9px] text-slate-400">Daily totals, last 7 days</p>
                            </div>
                            <button onClick={() => openModal('Cash Flow Details', cashFlowDetail)} className={DETAIL_BTN}>See Details</button>
                        </div>
                        {cash ? (
                            <>
                                <div className="flex justify-end gap-4 text-[9px] font-bold text-slate-500 mt-1 shrink-0">
                                    <span className="flex items-center"><span className="w-2 h-2 rounded-sm mr-1" style={{ background: CASH_FLOW_COLORS.inflow }} />Inflow <strong className="ml-1 text-slate-900">{formatUsdCompact(cash.totals.inflow)}</strong></span>
                                    <span className="flex items-center"><span className="w-2 h-2 rounded-sm mr-1" style={{ background: CASH_FLOW_COLORS.outflow }} />Outflow <strong className="ml-1 text-slate-900">{formatUsdCompact(cash.totals.outflow)}</strong></span>
                                </div>
                                <div className="flex-1 relative w-full min-h-[160px] mt-1">
                                    <CashFlowBarChart series={cash} />
                                </div>
                            </>
                        ) : <ChartPlaceholder loaded={!!charts} />}
                    </div>

                    <div className={CARD}>
                        <div className={CARD_HEADER}>
                            <h3 className="text-xs font-bold text-slate-900">Compliance Status Tracker</h3>
                            <button onClick={() => openModal('Compliance Details', complianceDetail)} className={DETAIL_BTN}>See Details</button>
                        </div>
                        {compliance ? (
                            <div className="flex items-center justify-center gap-8 flex-1 min-h-0">
                                <div className="relative w-[180px] h-[180px] min-w-[150px] min-h-[150px] max-w-full max-h-full shrink">
                                    <ComplianceDonutChart series={compliance} />
                                </div>
                                <ul className="space-y-3 text-[10px] shrink-0">
                                    {compliance.labels.map((label, idx) => (
                                        <li key={label} className="flex items-start">
                                            <span className="w-2.5 h-2.5 rounded-full mr-2 mt-0.5" style={{ background: COMPLIANCE_COLORS[idx] }} />
                                            <span>
                                                <span className="text-slate-400 block leading-none">{label}</span>
                                                <strong className="text-slate-800 text-sm">{compliance.datasets[0].data[idx]}%</strong>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : <ChartPlaceholder loaded={!!charts} />}
                    </div>
                </div>
            </div>

            <div className="col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
                <div className={`${CARD} shrink-0`}>
                    <div className={CARD_HEADER}>
                        <h3 className="text-xs font-bold text-slate-900">Core Banking Health</h3>
                        {health && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${HEALTH_BADGE[health.status]}`}>{health.status}</span>}
                    </div>
                    {health ? (
                        // Gauge and label share one grid cell so the value sits inside the arc without absolute positioning.
                        <div className="grid place-items-center mt-1">
                            <div className="[grid-area:1/1] w-full max-w-[210px] h-[112px]">
                                <CoreHealthGauge value={health.value} status={health.status} />
                            </div>
                            <div className="[grid-area:1/1] self-end flex flex-col items-center">
                                <span className="text-2xl font-black text-slate-900 leading-none">{Math.round(health.value * 100)}%</span>
                                <span className="text-[9px] font-semibold text-slate-400 mt-1">
                                    {HEALTH_LABEL[health.status]} · target ≥ {Math.round(health.thresholds.healthy * 100)}%
                                </span>
                            </div>
                        </div>
                    ) : <div className="h-[112px]"><ChartPlaceholder loaded={!!charts} /></div>}
                </div>

                <AlertsPanel />

                <div className={`${CARD} shrink-0`}>
                    <div className={CARD_HEADER}>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-xs font-bold text-slate-900">Reconciliation Accuracy Trend</h3>
                            {latest && (
                                <>
                                    <span className={`text-sm font-black ${latest.meets_target ? 'text-slate-900' : 'text-coralRed'}`}>{latest.accuracy_pct.toFixed(2)}%</span>
                                    {latest.change_pct !== null && (
                                        <span className={`text-[9px] font-bold ${latest.change_pct >= 0 ? 'text-emerald-600' : 'text-coralRed'}`}>
                                            {latest.change_pct >= 0 ? '+' : ''}{latest.change_pct.toFixed(2)} pts
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                        <button onClick={() => openModal('Reconcile Trend', reconcileDetail)} className={DETAIL_BTN}>See Details</button>
                    </div>
                    {reconcile && (
                        <div className="flex gap-3 text-[9px] font-semibold text-slate-400 shrink-0">
                            <span className="flex items-center"><span className="w-2.5 h-0.5 bg-accentBlue mr-1" />Daily accuracy</span>
                            <span className="flex items-center"><span className="w-2.5 border-t border-dashed border-teal-500 mr-1" />Target {reconcile.target_pct}%</span>
                        </div>
                    )}
                    <div className="relative w-full h-[115px] mt-1">
                        {reconcile && reconcile.observations.length > 0
                            ? <ReconcileTrendChart trend={reconcile} />
                            : <ChartPlaceholder loaded={!!charts} empty="No reconciliation runs recorded for this period." />}
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}

function ChartPlaceholder({ loaded, empty = 'Chart data unavailable.' }: { loaded: boolean; empty?: string }) {
  return (
    <div className="flex-1 h-full flex items-center justify-center text-[10px] text-slate-400">
      {loaded ? empty : 'Loading...'}
    </div>
  );
}
