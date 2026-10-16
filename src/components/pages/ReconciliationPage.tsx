'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function ReconciliationPage() {
  const { openModal } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed Txns</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">1,420,500</div>
                <div className="text-[9px] text-emerald-600">Settled Today</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched Records</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">1,418,200</div>
                <div className="text-[9px] text-emerald-600">99.83% Match Rate</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unmatched Records</div>
                <div className="text-xl font-black text-coralRed mt-0.5">2,300</div>
                <div className="text-[9px] text-rose-600 font-bold">$42,850 Discrepancy</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duplicate Flags</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">14 Records</div>
                <div className="text-[9px] text-amber-600">Pending Review</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Speed</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">1.2 sec</div>
                <div className="text-[9px] text-slate-400">Core to SWIFT</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Clear Rate</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">99.8%</div>
                <div className="text-[9px] text-emerald-600">Rule Clearance</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 mb-2">Reconciliation Exception Queue & Discrepancies</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Reference ID</th>
                                <th className="p-2">Source vs Target</th>
                                <th className="p-2">Expected Amount</th>
                                <th className="p-2">Actual Amount</th>
                                <th className="p-2">Reason</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">TXN-EX-9012</td>
                                <td className="p-2">Core Ledger ➔ SWIFT Wire</td>
                                <td className="p-2">$10,000.00</td>
                                <td className="p-2 font-bold text-rose-600">$9,950.00</td>
                                <td className="p-2"><span className="bg-rose-100 text-coralRed text-[9px] font-bold px-2 py-0.5 rounded-full">Fee Mismatch</span></td>
                                <td className="p-2"><button onClick={() => openModal('TXN-EX-9012', 'Intermediary bank fee deduction of $50 auto-verified.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Resolve</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">TXN-EX-9015</td>
                                <td className="p-2">Mobile Gateway ➔ Core Ledger</td>
                                <td className="p-2">$1,250.00</td>
                                <td className="p-2 font-bold text-rose-600">$0.00</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Pending Settlement</span></td>
                                <td className="p-2"><button onClick={() => openModal('TXN-EX-9015', 'Pending batch settlement job execution at 12:00 PM.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Resolve</button></td>
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
                            <h3 className="text-xs font-bold text-slate-900">Gemini Reconciliation Agent</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-2 text-slate-700">
                            <div className="font-bold text-slate-900">Pattern Analysis</div>
                            <p className="text-[9.5px] leading-relaxed">84% of unmatched wire exceptions are driven by correspondent intermediary routing fees ($25 - $50 variance).</p>
                            <div className="font-bold text-slate-900 pt-1">Recommended Resolution</div>
                            <p className="text-[9.5px] text-slate-600">Apply auto-clearance rule for fee variations under $50.00 with verified SWIFT field 71F tag.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal('Rule Applied', 'Applied automated fee variance tolerance rule.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Apply AI Auto-Match Rule</button>
                </div>
            </div>
        </div>
    </section>
  );
}
