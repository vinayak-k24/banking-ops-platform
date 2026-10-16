'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function DatabaseArchivalPage() {
  const { openModal, recordDbaDecision } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocated Space</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">10.0 TB</div>
                <div className="text-[9px] text-slate-400">Db2 Mainframe Cluster</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used Space</div>
                <div className="text-xl font-black text-coralRed mt-0.5">8.48 TB</div>
                <div className="text-[9px] font-bold text-coralRed">84.8% Utilized</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Space</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">1.52 TB</div>
                <div className="text-[9px] text-slate-400">Emergency Buffer</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Growth</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">+120 GB/day</div>
                <div className="text-[9px] text-slate-400">30-day historical trend</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time to Threshold</div>
                <div className="text-xl font-black text-coralRed mt-0.5">14.2 Hours</div>
                <div className="text-[9px] font-bold text-rose-600">Action Required</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Queue Age</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">42.5 min</div>
                <div className="text-[9px] text-amber-600 font-bold">Queue Delay</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-slate-900">Archival Job Execution Queue & History</h3>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Db2 Telemetry Feed</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-[11px] text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                                <tr>
                                    <th className="p-2">Job ID</th>
                                    <th className="p-2">Target Table</th>
                                    <th className="p-2">Last Run</th>
                                    <th className="p-2">Duration</th>
                                    <th className="p-2">Records</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2 font-bold text-slate-900">ARC_FIN_901</td>
                                    <td className="p-2">HIST_TRANS_2025</td>
                                    <td className="p-2">10:14:02 AM</td>
                                    <td className="p-2">14m 20s</td>
                                    <td className="p-2 font-semibold">450,000</td>
                                    <td className="p-2"><span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Completed</span></td>
                                    <td className="p-2"><button onClick={() => openModal('ARC_FIN_901', 'Job completed without locks. Reclaimed 450 GB.')} className="text-slate-500 hover:text-slate-900 font-semibold">Inspect</button></td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2 font-bold text-slate-900">ARC_SWIFT_2026</td>
                                    <td className="p-2">SWIFT_OUTBOUND_QUEUE</td>
                                    <td className="p-2">09:30:00 AM</td>
                                    <td className="p-2">42m 10s (Delay)</td>
                                    <td className="p-2 font-semibold">14,200</td>
                                    <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Lock Delay</span></td>
                                    <td className="p-2"><button onClick={() => openModal('ARC_SWIFT_2026', 'Lock contention on SWIFT index. DBA triage suggested.')} className="text-slate-500 hover:text-slate-900 font-semibold">Inspect</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm h-36 flex flex-col justify-between">
                    <h3 className="text-xs font-bold text-slate-900">Processing Queue & Latency Pressure</h3>
                    <div className="grid grid-cols-4 gap-2 text-[11px] my-auto">
                        <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block">Pending Requests</span>
                            <strong className="text-sm font-bold text-slate-900">12,450</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block">Avg Waiting Time</span>
                            <strong className="text-sm font-bold text-amber-600">3.8 sec</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block">Queue Throughput</span>
                            <strong className="text-sm font-bold text-emerald-600">2,800 ops/s</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[9px] text-slate-400 block">Oldest Request Age</span>
                            <strong className="text-sm font-bold text-rose-600">42.5 min</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-4 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-1.5 mb-2">
                            <i className="fa-solid fa-wand-magic-sparkles text-indigo-600 text-xs"></i>
                            <h3 className="text-xs font-bold text-slate-900">Gemini Capacity Agent</h3>
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 text-[10px] space-y-1.5 text-slate-700">
                            <span className="font-bold text-indigo-900 block">Observation</span>
                            <p className="leading-relaxed">Storage pressure on <code>HIST_TRANS_2025</code> directly correlates with the 42m archival lock delay on <code>SWIFT_OUTBOUND_QUEUE</code>.</p>
                            <span className="font-bold text-indigo-900 block pt-1">Recommended DBA Action</span>
                            <ul className="list-disc pl-3 space-y-0.5 text-[9.5px]">
                                <li>Inspect Db2 lock contention on table spaces.</li>
                                <li>Trigger partition swap for historical ledger tables.</li>
                                <li>Evaluate off-peak offline processing.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button onClick={() => recordDbaDecision()} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Execute Partition Archival Swap</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
