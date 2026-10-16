'use client';

import { useDashboard } from '@/context/DashboardContext';
import { FraudDetectionChart, CashFlowBarChart, ComplianceDonutChart, ReconcileWaveChart } from '@/components/charts/OverviewCharts';
import CoreHealthGauge from '@/components/charts/CoreHealthGauge';

export default function OperationsOverviewPage() {
  const { openModal, switchPage } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
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

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal('Active Incidents', '3 active P1/P2 incidents currently in SRE triage.')}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Incidents</div>
                <div className="text-xl font-black text-coralRed mt-0.5">3 P1/P2</div>
                <div className="text-[9px] font-semibold text-coralRed mt-0.5">1 DB Pool Degraded</div>
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

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                        <div>
                            <h3 className="text-xs font-bold text-slate-900">Transaction Volume & AI Fraud Prediction</h3>
                            <p className="text-[9px] text-slate-400">Simulated real-time volume vs flagged anomalies</p>
                        </div>
                        <button onClick={() => openModal('Volume Detail', 'Detailed breakdown of prediction vs detected fraud metrics.')} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">See Detail</button>
                    </div>
                    <div className="flex-1 relative w-full min-h-[130px] mt-1">
                        <FraudDetectionChart />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 h-[48%]">
                    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-900">Cash Flow Analytics</h3>
                            <button onClick={() => openModal('Cash Flow Details', 'Inflow: $25.4M | Outflow: $18.2M')} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">See Detail</button>
                        </div>
                        <div className="flex justify-end space-x-3 text-[9px] font-bold my-0.5">
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-coralRed mr-1"></span>Inflow <strong>$25.4M</strong></span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slateDark mr-1"></span>Outflow <strong>$18.2M</strong></span>
                        </div>
                        <div className="flex-1 relative w-full max-h-[85px]">
                            <CashFlowBarChart />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-xs font-bold text-slate-900">Compliance Status Tracker</h3>
                            <button onClick={() => openModal('Compliance Details', 'Overall Compliance Rate: 87%. AML: 65%, KYC: 80%, GDPR: 70%')} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">See Detail</button>
                        </div>
                        <div className="flex items-center justify-between flex-1">
                            <div className="relative w-20 h-20 flex items-center justify-center mx-auto">
                                <ComplianceDonutChart />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-lg font-black text-slate-900">87%</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-[9px] pr-2">
                                <div><span className="text-slate-400">AML</span> <strong className="text-slate-800 text-xs block">65%</strong></div>
                                <div><span className="text-slate-400">KYC</span> <strong className="text-slate-800 text-xs block">80%</strong></div>
                                <div><span className="text-slate-400">GDPR</span> <strong className="text-slate-800 text-xs block">70%</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-4 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col items-center justify-between shrink-0">
                    <h3 className="text-xs font-bold text-slate-900 w-full text-left">Core Banking Health</h3>
                    <div className="relative w-full h-24 mt-1 flex items-center justify-center">
                        <CoreHealthGauge value={0.93} />
                        <div className="absolute bottom-1 flex flex-col items-center">
                            <span className="text-xl font-black text-slate-900">93%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-bold text-slate-900">Critical Alerts & Incident Queue</h3>
                        <button onClick={() => openModal('All Alerts', '12 critical operational alerts logged.')} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">See Detail</button>
                    </div>
                    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2 space-y-0.5">
                            <div className="font-bold text-xs text-rose-900 flex justify-between">
                                <span>Database Capacity Warning</span>
                                <span className="text-[9px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded">HIGH</span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-tight">Mainframe Db2 storage at 84.8% capacity. Est 14.2h to threshold.</p>
                            <button onClick={() => switchPage('dba')} className="action-btn-black text-[9px] font-bold px-2.5 py-0.5 rounded-lg mt-1">Investigate DB</button>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-0.5">
                            <div className="font-bold text-xs text-slate-900">SWIFT Outbound Delay</div>
                            <p className="text-[10px] text-slate-500 leading-tight">Queue time exceeding 180s on correspondent wire pipeline.</p>
                            <button onClick={() => openModal('Action: SWIFT Queue', 'Rerouted outbound queue to secondary gateway.')} className="action-btn-black text-[9px] font-bold px-2.5 py-0.5 rounded-lg mt-1">Take Action</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm h-28 flex flex-col justify-between shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-900">Reconciliation Accuracy Trend</h3>
                        <button onClick={() => openModal('Reconcile Trend', 'Monthly accuracy peak: 83%.')} className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">See Detail</button>
                    </div>
                    <div className="flex-1 relative w-full max-h-[50px]">
                        <ReconcileWaveChart />
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
