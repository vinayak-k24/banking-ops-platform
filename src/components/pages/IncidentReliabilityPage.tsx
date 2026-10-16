'use client';

import { useDashboard } from '@/context/DashboardContext';

export default function IncidentReliabilityPage() {
  const { openModal } = useDashboard();

  return (
    <section className="h-full flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Incidents</div>
                <div className="text-xl font-black text-rose-600 mt-0.5">3 Critical</div>
                <div className="text-[9px] text-slate-400">1 P1, 2 P2</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Error Rate</div>
                <div className="text-xl font-black text-amber-500 mt-0.5">0.04%</div>
                <div className="text-[9px] text-emerald-600">Within SLA</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">p99 Latency</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">142 ms</div>
                <div className="text-[9px] text-slate-400">API Gateway Edge</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Uptime</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">99.98%</div>
                <div className="text-[9px] text-slate-400">Rolling 30 days</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MTTR Target</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">18.4 min</div>
                <div className="text-[9px] text-emerald-600">Goal: &lt; 20 min</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DB Conn Pool</div>
                <div className="text-xl font-black text-coralRed mt-0.5">88% Saturation</div>
                <div className="text-[9px] text-rose-600 font-bold">Near Limit</div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
            <div className="col-span-8 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 mb-2">Active Service Reliability Incident Queue</h3>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-[11px] text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-2">Incident ID</th>
                                <th className="p-2">Title & Service</th>
                                <th className="p-2">Severity</th>
                                <th className="p-2">Assigned Team</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">SLA Left</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">INC-8921</td>
                                <td className="p-2">
                                    <div className="font-bold text-slate-900">DB Conn Pool Saturation</div>
                                    <div className="text-[9px] text-slate-400">Core Ledger DB</div>
                                </td>
                                <td className="p-2"><span className="bg-rose-100 text-coralRed text-[9px] font-extrabold px-2 py-0.5 rounded-full">P1 CRITICAL</span></td>
                                <td className="p-2">SRE Core Team</td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Investigating</span></td>
                                <td className="p-2 font-bold text-coralRed">14 min</td>
                                <td className="p-2"><button onClick={() => openModal('INC-8921', 'Assigned SRE: Sarah Jenkins. Connection pool saturation on Db2 node 4.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Triage</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">INC-8925</td>
                                <td className="p-2">
                                    <div className="font-bold text-slate-900">Latency Spike on OAuth API</div>
                                    <div className="text-[9px] text-slate-400">Identity Service</div>
                                </td>
                                <td className="p-2"><span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">P2 HIGH</span></td>
                                <td className="p-2">Identity Pod</td>
                                <td className="p-2"><span className="bg-blue-100 text-accentBlue text-[9px] font-bold px-2 py-0.5 rounded-full">Identified</span></td>
                                <td className="p-2 font-bold text-slate-700">42 min</td>
                                <td className="p-2"><button onClick={() => openModal('INC-8925', 'Restarting auth caching pod instances.')} className="action-btn-black text-[10px] font-bold px-2.5 py-1 rounded-lg">Triage</button></td>
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
                            <h3 className="text-xs font-bold text-slate-900">Gemini SRE Incident Agent</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] space-y-2 text-slate-700">
                            <div className="font-bold text-slate-900">Event Timeline</div>
                            <p className="text-[9.5px] leading-relaxed">09:12 AM - Deployment of <code>v2.4.1-ledger</code><br />09:14 AM - DB connection waits +340%<br />09:15 AM - API Latency spiked to 142ms</p>
                            <div className="font-bold text-slate-900 pt-1">Suggested Diagnostic</div>
                            <p className="text-[9.5px] text-slate-600">Check unindexed queries on <code>ACCOUNT_BALANCES</code> table prior to executing pod rollback.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal('SRE Summary', 'Generated SRE Incident Report PDF.')} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full">Generate Incident Report</button>
                </div>
            </div>
        </div>
    </section>
  );
}
