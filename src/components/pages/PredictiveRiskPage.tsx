'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function PredictiveRiskPage() {
  const { openModal, switchPage } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Risk Signals</div>
                <div className="text-xl font-black text-coralRed mt-0.5">4 High Risk</div>
                <div className="text-[9px] text-rose-600 font-bold">Predictive Alerts</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Crossing</div>
                <div className="text-xl font-black text-coralRed mt-0.5">14.2 Hours</div>
                <div className="text-[9px] text-slate-400">To 90% Threshold</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Queue Buildup</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">+18% / hr</div>
                <div className="text-[9px] text-amber-600">SWIFT Outbound</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Breach Risk</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">2 Jobs</div>
                <div className="text-[9px] text-amber-600 font-bold">End-of-Day Settlement</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regression Likelihood</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">12% Low</div>
                <div className="text-[9px] text-emerald-600">Post-Release Model</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preventive Tasks</div>
                <div className="text-xl font-black text-indigo-600 mt-0.5">3 Actions</div>
                <div className="text-[9px] text-indigo-600">Auto-Drafted</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 mb-2">Predictive Early Warning Matrix & Anomaly Detection</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Risk Category</th>
                                <th className="p-2">Target Component</th>
                                <th className="p-2">Likelihood</th>
                                <th className="p-2">Est. Crossing Window</th>
                                <th className="p-2">Severity</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">Database Storage Exhaustion</td>
                                <td className="p-2">Db2 Mainframe Cluster</td>
                                <td className="p-2 font-bold text-rose-600">92% High</td>
                                <td className="p-2">14.2 Hours</td>
                                <td className="p-2"><span className="bg-rose-100 text-coralRed text-[9px] font-bold px-2 py-0.5 rounded-full">HIGH RISK</span></td>
                                <td className="p-2"><button onClick={() => switchPage('dba')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Trigger Swap</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">Batch SLA Breach</td>
                                <td className="p-2">EOD Interest Calculator</td>
                                <td className="p-2 font-bold text-amber-600">68% Medium</td>
                                <td className="p-2">3.5 Hours</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">MEDIUM RISK</span></td>
                                <td className="p-2"><button onClick={() => openModal('Risk Action', 'Allocated 4 extra compute nodes to batch processing queue.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Add Nodes</button></td>
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
                            <h3 className="text-xs font-bold text-slate-900">Gemini Predictive Agent</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-2 text-slate-700">
                            <div className="font-bold text-slate-900">Early Warning Forecast</div>
                            <p className="text-[9.5px] leading-relaxed">Based on 30-day historical transaction volume velocity (+120 GB/day), storage exhaustion will coincide with peak batch processing at 11:30 PM.</p>
                            <div className="font-bold text-slate-900 pt-1">Preventive Task Recommendation</div>
                            <p className="text-[9.5px] text-slate-600">Schedule automated offline table purge at 08:00 PM prior to batch execution.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal('Task Scheduled', 'Preventive archival task scheduled for 08:00 PM.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Schedule Preventive Task</button>
                </div>
            </div>
        </div>
    </section>
  );
}
