'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function ComplianceAuditPage() {
  const { openModal } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-5 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Control Completion</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">94.2%</div>
                <div className="text-[9px] text-slate-400">142 / 150 Controls Met</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Tasks</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">8 Tasks</div>
                <div className="text-[9px] text-amber-600 font-bold">Review Required</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Reviews</div>
                <div className="text-xl font-black text-coralRed mt-0.5">2 Overdue</div>
                <div className="text-[9px] text-rose-600 font-bold">AML & Sanctions</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missing Evidence</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">3 Items</div>
                <div className="text-[9px] text-slate-400">Audit Prep Queue</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Control Gaps</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">0 Gaps</div>
                <div className="text-[9px] text-emerald-600">Fully Mapped</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 mb-2">Compliance Control & Evidence Mapping Matrix</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Control ID & Name</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Owner</th>
                                <th className="p-2">Evidence Reference</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">CTRL-AML-01: Cross-Border Wire AML</td>
                                <td className="p-2">AML / Sanctions</td>
                                <td className="p-2">Compliance Lead</td>
                                <td className="p-2 text-indigo-600 font-semibold">DOC-2026-AML-89.pdf</td>
                                <td className="p-2"><span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Verified Passed</span></td>
                                <td className="p-2"><button onClick={() => openModal('CTRL-AML-01', 'Evidence verified on Oct 12 by Auditor.')} className="text-slate-500 hover:text-slate-900 font-semibold">Inspect</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">CTRL-KYC-04: High-Net-Worth Verification</td>
                                <td className="p-2">KYC / Onboarding</td>
                                <td className="p-2">Risk Officer</td>
                                <td className="p-2 text-rose-500 font-semibold">MISSING EVIDENCE</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Pending Evidence</span></td>
                                <td className="p-2"><button onClick={() => openModal('CTRL-KYC-04', 'Flagged missing high-risk customer proof document.')} className="text-slate-500 hover:text-slate-900 font-semibold">Request Doc</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="col-span-4 flex flex-col space-y-3 overflow-hidden">
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-1.5 mb-2">
                            <i className="fa-solid fa-wand-magic-sparkles text-indigo-600 text-xs"></i>
                            <h3 className="text-xs font-bold text-slate-900">Gemini Audit Agent</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-2 text-slate-700">
                            <span className="bg-indigo-100 text-indigo-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded">AI DRAFT OBSERVATION</span>
                            <p className="text-[9.5px] leading-relaxed">Drafted finding for <code>CTRL-KYC-04</code>: Missing secondary proof of residence for international accounts opened in Q3.</p>
                            <div className="font-bold text-slate-900 pt-1">Traceability Status</div>
                            <p className="text-[9.5px] text-slate-500">Awaiting human auditor approval prior to committing to regulatory file.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal('Observation Approved', 'Draft committed to audit log by authorized user.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Approve Audit Finding</button>
                </div>
            </div>
        </div>
    </section>
  );
}
