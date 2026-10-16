'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function HumanGovernancePage() {
  const { openModal, approveGovernanceAction, actorLabel } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">3 Actions</div>
                <div className="text-[9px] text-amber-600 font-bold">Requires Sign-off</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Today</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">28 Actions</div>
                <div className="text-[9px] text-emerald-600">Audit Logged</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected Actions</div>
                <div className="text-xl font-black text-coralRed mt-0.5">1 Action</div>
                <div className="text-[9px] text-slate-400">Rolled back</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Sign-off Time</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">4.2 min</div>
                <div className="text-[9px] text-emerald-600">SLA: &lt; 15 min</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Permissions</div>
                <div className="text-xl font-black text-indigo-600 mt-0.5">Strict Tier 3</div>
                <div className="text-[9px] text-indigo-600 font-bold">4-Eye Principle</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Traceability</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">100%</div>
                <div className="text-[9px] text-slate-400">Signed Log</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 mb-2">Human Authorization & Approval Request Queue</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Request ID</th>
                                <th className="p-2">Proposed Action</th>
                                <th className="p-2">Originating Agent</th>
                                <th className="p-2">Risk Impact</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Authorization Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">REQ-APP-102</td>
                                <td className="p-2 font-semibold text-slate-900">Execute Db2 Table Partition Archival Swap</td>
                                <td className="p-2 text-indigo-600 font-medium">Capacity Monitoring Agent</td>
                                <td className="p-2"><span className="bg-rose-100 text-coralRed text-[9px] font-bold px-2 py-0.5 rounded-full">HIGH IMPACT</span></td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Awaiting Sign-off</span></td>
                                <td className="p-2 flex space-x-1.5">
                                    <button onClick={() => approveGovernanceAction('REQ-APP-102', true)} className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">Approve</button>
                                    <button onClick={() => approveGovernanceAction('REQ-APP-102', false)} className="bg-rose-500 text-white hover:bg-rose-600 text-[10px] font-bold px-2 py-1 rounded-lg">Reject</button>
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">REQ-APP-105</td>
                                <td className="p-2 font-semibold text-slate-900">Apply Auto-Clearance Tolerance Rule ($50)</td>
                                <td className="p-2 text-indigo-600 font-medium">Reconciliation Agent</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">MEDIUM IMPACT</span></td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Awaiting Sign-off</span></td>
                                <td className="p-2 flex space-x-1.5">
                                    <button onClick={() => approveGovernanceAction('REQ-APP-105', true)} className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">Approve</button>
                                    <button onClick={() => approveGovernanceAction('REQ-APP-105', false)} className="bg-rose-500 text-white hover:bg-rose-600 text-[10px] font-bold px-2 py-1 rounded-lg">Reject</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="col-span-4 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-1.5 mb-2">
                            <i className="fa-solid fa-shield-halved text-indigo-600 text-xs"></i>
                            <h3 className="text-xs font-bold text-slate-900">Governance & Audit Safety Guardrails</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-2 text-slate-700">
                            <div className="font-bold text-slate-900">Compliance & Regulatory Requirement</div>
                            <p className="text-[9.5px] leading-relaxed">No automated agent is authorized to mutate financial ledgers or alter core database table partitions without an explicit human sign-off signature.</p>
                            <div className="font-bold text-slate-900 pt-1">Active Persona Access</div>
                            <p className="text-[9.5px] text-slate-500">Currently operating under: <strong className="text-slate-900">{actorLabel}</strong></p>
                        </div>
                    </div>
                    <button onClick={() => openModal('Governance Audit Trail', 'Exported immutable sign-off log for external regulatory inspection.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Export Signed Governance Log</button>
                </div>
            </div>
        </div>
    </section>
  );
}
