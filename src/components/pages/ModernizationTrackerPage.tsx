'use client';

import MigrationPlanner from '@/components/migration/MigrationPlanner';
import { useDashboard } from '@/context/DashboardContext';

export default function ModernizationTrackerPage() {
  const { openModal } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">COBOL Modules</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">1,240</div>
                <div className="text-[9px] text-slate-400">Legacy Core Inventory</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Java Converted</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">850</div>
                <div className="text-[9px] text-emerald-600">68.5% Completion</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Testing</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">140</div>
                <div className="text-[9px] text-amber-600">Parity Suite Queue</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Validated Passed</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">710</div>
                <div className="text-[9px] text-emerald-600">100% Rule Match</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Defects</div>
                <div className="text-xl font-black text-coralRed mt-0.5">12 Bugs</div>
                <div className="text-[9px] text-rose-600">Precision Mismatch</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPU Reduction</div>
                <div className="text-xl font-black text-indigo-600 mt-0.5">-38.2%</div>
                <div className="text-[9px] text-indigo-600 font-bold">MIPS Saved</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 h-72 shrink-0 overflow-hidden">
            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 mb-2">COBOL to Spring Boot Service Conversion Matrix</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Legacy COBOL Program</th>
                                <th className="p-2">Modernized Microservice</th>
                                <th className="p-2">Stage</th>
                                <th className="p-2">Rule Equivalence</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">CBL_ACC_BAL.cbl</td>
                                <td className="p-2">account-ledger-service</td>
                                <td className="p-2">Validation</td>
                                <td className="p-2 font-bold text-emerald-600">100% Match</td>
                                <td className="p-2"><span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Validated</span></td>
                                <td className="p-2"><button onClick={() => openModal('CBL_ACC_BAL.cbl', '100% equivalence passed against 10,000 synthetic test vectors.')} className="text-slate-500 hover:text-slate-900 font-semibold">Inspect</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">CBL_INTEREST_CALC.cbl</td>
                                <td className="p-2">interest-calculator-service</td>
                                <td className="p-2">Conversion</td>
                                <td className="p-2 font-bold text-amber-600">99.2% Match</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Rounding Fix</span></td>
                                <td className="p-2"><button onClick={() => openModal('CBL_INTEREST_CALC.cbl', 'Float rounding difference detected on 7th decimal place.')} className="text-slate-500 hover:text-slate-900 font-semibold">Inspect</button></td>
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
                            <h3 className="text-xs font-bold text-slate-900">Gemini Migration Agent</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-2 text-slate-700">
                            <div className="font-bold text-slate-900">Dependency Insight</div>
                            <p className="text-[9.5px] leading-relaxed"><code>CBL_INTEREST_CALC.cbl</code> accesses Db2 table <code>VAL_RATES_HIST</code>. Generated Spring Data JPA repo mapping.</p>
                            <div className="font-bold text-slate-900 pt-1">Code Sandbox Draft</div>
                            <p className="text-[9.5px] text-slate-500">Draft Java code auto-generated for review. Requires developer signature before commit.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal('Boilerplate Exported', 'Exported Spring Boot service boilerplate code for review.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Export Spring Boot Boilerplate</button>
                </div>
            </div>
        </div>

        <MigrationPlanner />
    </section>
  );
}
