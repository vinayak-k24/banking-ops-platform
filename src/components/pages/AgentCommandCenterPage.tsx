'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function AgentCommandCenterPage() {
  const { openModal } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Agents</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">8 Agents</div>
                <div className="text-[9px] text-emerald-600">100% Operational</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Tasks</div>
                <div className="text-xl font-black text-indigo-600 mt-0.5">14 Running</div>
                <div className="text-[9px] text-slate-400">Multi-Step Execution</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Today</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">412 Tasks</div>
                <div className="text-[9px] text-emerald-600">99.2% Success Rate</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Approval</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">3 Actions</div>
                <div className="text-[9px] text-amber-600 font-bold">Human-in-the-Loop</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tool Invocations</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">1,840 Calls</div>
                <div className="text-[9px] text-slate-400">Validated API Inputs</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed / Retried</div>
                <div className="text-xl font-black text-coralRed mt-0.5">2 Retried</div>
                <div className="text-[9px] text-slate-400">Auto-recovered</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">

            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-900">Agent Multi-Step Task Execution Queue</h3>
                    <button onClick={() => openModal('New Workflow', 'Dispatched synthetic multi-step agent workflow.')} className="action-btn-black text-[10px] font-bold px-3 py-1 rounded-lg">+ Launch Agent Task</button>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Task ID</th>
                                <th className="p-2">Origin Page</th>
                                <th className="p-2">Assigned Agent</th>
                                <th className="p-2">Current Step</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">TSK-8841</td>
                                <td className="p-2">DB & Archival</td>
                                <td className="p-2 font-semibold text-indigo-600">Capacity Monitoring Agent</td>
                                <td className="p-2">Inspect Db2 Table Lock Contention</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">WAITING_FOR_APPROVAL</span></td>
                                <td className="p-2"><button onClick={() => openModal('TSK-8841 Inspector', 'Tool Call: db2_inspect_locks()\nResult: Lock on SWIFT_OUTBOUND_QUEUE index space.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Inspect Tool</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">TSK-8842</td>
                                <td className="p-2">Incident Reliability</td>
                                <td className="p-2 font-semibold text-indigo-600">Investigation Agent</td>
                                <td className="p-2">Correlate Deployment Logs vs API Latency</td>
                                <td className="p-2"><span className="bg-blue-100 text-accentBlue text-[9px] font-bold px-2 py-0.5 rounded-full">EXECUTING_STEP_3</span></td>
                                <td className="p-2"><button onClick={() => openModal('TSK-8842 Inspector', 'Tool Call: fetch_k8s_logs(service=oauth-api)\nResult: Connection timeouts recorded.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Inspect Tool</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">TSK-8843</td>
                                <td className="p-2">Reconciliation</td>
                                <td className="p-2 font-semibold text-indigo-600">Reconciliation Agent</td>
                                <td className="p-2">Auto-Match Fee Variance &lt; $50</td>
                                <td className="p-2"><span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">VERIFIED_SUCCESS</span></td>
                                <td className="p-2"><button onClick={() => openModal('TSK-8843 Inspector', 'Tool Call: verify_reconcile_match()\nResult: 2,300 exception records auto-cleared.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Inspect Tool</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>


            <div className="col-span-4 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-1.5 mb-2">
                            <i className="fa-solid fa-code text-indigo-600 text-xs"></i>
                            <h3 className="text-xs font-bold text-slate-900">Tool Invocation Inspector</h3>
                        </div>
                        <div className="bg-slate-900 text-slate-200 font-mono rounded-xl p-2.5 text-[9.5px] space-y-1.5 overflow-x-auto">
                            <span className="text-emerald-400">// Invoking DB Storage Tool</span>
                            <div><span className="text-indigo-400">TOOL:</span> db2_capacity_check()</div>
                            <div><span className="text-indigo-400">PARAMS:</span> {'{'} "cluster": "DB2_MAIN", "target": "HIST_TRANS_2025" {'}'}</div>
                            <div><span className="text-amber-400">STATUS:</span> 200 OK (Execution Time: 142ms)</div>
                            <div><span className="text-indigo-400">OUTPUT:</span> {'{'} "used_tb": 8.48, "growth_rate_gb": 120, "time_to_90_hrs": 14.2 {'}'}</div>
                        </div>
                        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-1">
                            <span className="font-bold text-slate-900">User-Facing Reasoning Summary</span>
                            <p className="text-slate-600 text-[9.5px] leading-relaxed">Agent selected <code>db2_capacity_check</code> because storage metrics breached the 80% threshold. The tool output confirmed storage pressure is expanding by 120 GB/day.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal('Tool Policy Configured', 'Updated tool invocation permissions for SRE and DBA agent roles.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Configure Tool Permissions</button>
                </div>
            </div>
        </div>
    </section>
  );
}
