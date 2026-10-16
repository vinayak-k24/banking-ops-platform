'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useDashboard } from '@/context/DashboardContext';
import { api } from '@/lib/api';
import type { AgentTask, MigrationPlan, MigrationSourceType } from '@/lib/types';

const TERMINAL: AgentTask['status'][] = ['SUCCEEDED', 'FAILED', 'NEEDS_INVESTIGATION', 'CANCELLED', 'REJECTED'];
const POLL_MS = 1500;
const ACCEPT = { document: '.pdf,.docx,.md,.markdown,.txt', codebase_summary: '.md,.markdown,.txt' };

const statusStyle: Record<string, string> = {
  SUCCEEDED: 'bg-emerald-100 text-emerald-800',
  NEEDS_INVESTIGATION: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-rose-100 text-rose-800',
};

export default function MigrationPlanner() {
  const { actor, openModal } = useDashboard();
  const [mode, setMode] = useState<MigrationSourceType>('document');
  const [file, setFile] = useState<File | null>(null);
  const [targetPlatform, setTargetPlatform] = useState('Google Cloud');
  const [teamSize, setTeamSize] = useState(5);
  const [prompt, setPrompt] = useState<{ prompt: string; file_name: string } | null>(null);
  const [task, setTask] = useState<AgentTask | null>(null);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (mode === 'codebase_summary' && !prompt) {
      api.migrationCodebasePrompt().then(setPrompt).catch((e: Error) => openModal('Prompt Unavailable', e.message));
    }
  }, [mode, prompt, openModal]);

  const poll = useCallback((taskId: string) => {
    api.getTask(taskId).then(async (t) => {
      setTask(t);
      if (!TERMINAL.includes(t.status)) {
        timer.current = setTimeout(() => poll(taskId), POLL_MS);
        return;
      }
      setBusy(false);
      const planId = t.result?.plan_id;
      if (typeof planId === 'string') setPlan(await api.getMigrationPlan(planId));
    }).catch((e: Error) => { setBusy(false); openModal('Planner Error', e.message); });
  }, [openModal]);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setPlan(null);
    try {
      const res = await api.uploadMigrationDocument(file, mode, targetPlatform, teamSize, actor);
      setTask(res.task);
      poll(res.task.task_id);
    } catch (e) {
      setBusy(false);
      openModal('Upload Failed', (e as Error).message);
    }
  };

  const copyPrompt = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt.prompt);
    openModal('Prompt Copied', `Paste it into your IDE agent (VS Code, Cursor, etc.). It will create ${prompt.file_name}; upload that file here.`);
  };

  const phases = plan?.plan.phases ?? [];
  const total = plan?.plan.total_weeks || 1;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1.5">
          <i className="fa-solid fa-route text-indigo-600 text-xs"></i>
          <h3 className="text-xs font-bold text-slate-900">Migration Planner</h3>
          <span className="text-[9px] text-slate-400">Upload a document or a codebase summary to get a phased, verified plan</span>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-0.5 text-[10px] font-bold">
          {([['document', 'Upload document'], ['codebase_summary', 'From your codebase']] as const).map(([id, label]) => (
            <button key={id} onClick={() => { setMode(id); setFile(null); }}
              className={`px-3 py-1 rounded-lg ${mode === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4 space-y-2 text-[10px] text-slate-600">
          {mode === 'codebase_summary' && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
              <div className="font-bold text-slate-900">1. Run this prompt in your IDE agent</div>
              <p className="text-[9.5px]">It writes <code>{prompt?.file_name ?? 'MIGRATION_CONTEXT.md'}</code> describing modules, databases, dependencies and a JSON inventory.</p>
              <button onClick={copyPrompt} disabled={!prompt} className="action-btn-black text-[10px] font-bold py-1.5 rounded-lg w-full disabled:opacity-50">
                <i className="fa-solid fa-copy mr-1"></i>Copy prompt
              </button>
              <div className="font-bold text-slate-900 pt-1">2. Upload the generated file below</div>
            </div>
          )}
          <label className="block border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-slate-400">
            <i className="fa-solid fa-cloud-arrow-up text-slate-400 text-base"></i>
            <div className="font-semibold text-slate-700 mt-1 truncate">{file ? file.name : 'Choose a file'}</div>
            <div className="text-[9px] text-slate-400">{mode === 'document' ? 'PDF, DOCX, Markdown or text, up to 50 MB' : 'Markdown file from your IDE agent'}</div>
            <input type="file" accept={ACCEPT[mode]} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">Target platform
              <input value={targetPlatform} maxLength={80} onChange={(e) => setTargetPlatform(e.target.value)}
                className="mt-0.5 w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-900" />
            </label>
            <label className="block">Team size
              <input type="number" min={1} max={50} value={teamSize}
                onChange={(e) => setTeamSize(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                className="mt-0.5 w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-900" />
            </label>
          </div>
          <button onClick={submit} disabled={!file || busy} className="action-btn-black text-xs font-bold py-2 rounded-xl w-full disabled:opacity-50">
            {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>Analysing…</> : 'Generate migration plan'}
          </button>
          {task && (
            <ul className="space-y-0.5 pt-1">
              {task.steps.map((s) => (
                <li key={s.step_id} className="flex items-center justify-between text-[9.5px]">
                  <span>{s.name.replace(/_/g, ' ')}</span>
                  <span className={s.status === 'DONE' ? 'text-emerald-600 font-bold' : s.status === 'FAILED' ? 'text-coralRed font-bold' : 'text-slate-400'}>
                    {s.status}{s.error ? ` (${s.error.slice(0, 60)})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-span-8 text-[10px] text-slate-600">
          {!plan ? (
            <div className="h-full min-h-40 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              {task && task.status === 'FAILED' ? 'Planning failed. Check the step errors.' : 'The plan will appear here.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div><div className="text-[9px] uppercase font-bold text-slate-400">Duration</div><div className="text-base font-black text-slate-900">{plan.plan.total_weeks} wks</div></div>
                  <div><div className="text-[9px] uppercase font-bold text-slate-400">Effort</div><div className="text-base font-black text-slate-900">{plan.plan.total_effort_person_weeks} p-wks</div></div>
                  <div><div className="text-[9px] uppercase font-bold text-slate-400">Components</div><div className="text-base font-black text-slate-900">{plan.components.length}</div></div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusStyle[plan.status] ?? 'bg-slate-100 text-slate-700'}`}>{plan.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex space-x-1.5">
                  <a href={api.migrationReportUrl(plan.plan_id, 'md')} download className="action-btn-black text-[10px] font-bold px-3 py-1.5 rounded-lg"><i className="fa-solid fa-file-lines mr-1"></i>Markdown</a>
                  <a href={api.migrationReportUrl(plan.plan_id, 'pdf')} download className="action-btn-black text-[10px] font-bold px-3 py-1.5 rounded-lg"><i className="fa-solid fa-file-pdf mr-1"></i>PDF</a>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-700">{plan.narrative.summary}</p>
              <div className="space-y-1">
                {phases.map((p) => (
                  <button key={p.key} className="w-full grid grid-cols-12 gap-2 items-center text-left hover:bg-slate-50 rounded"
                    onClick={() => openModal(p.title, `${plan.narrative.phase_notes[p.key]?.rationale ?? ''}\n\nComponents: ${p.components.join(', ') || 'none'}`)}>
                    <span className="col-span-4 truncate font-semibold text-slate-800">{p.sequence}. {p.title}</span>
                    <span className="col-span-7 relative h-3 bg-slate-100 rounded">
                      <span className="absolute h-3 bg-indigo-500 rounded" style={{ left: `${(p.start_week / total) * 100}%`, width: `${(p.duration_weeks / total) * 100}%` }} />
                    </span>
                    <span className="col-span-1 text-right text-[9px]">{p.duration_weeks}w</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {plan.checks.map((c) => (
                  <span key={c.name} title={c.detail}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    <i className={`fa-solid ${c.passed ? 'fa-check' : 'fa-xmark'} mr-1`}></i>{c.name.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              {plan.warnings.length > 0 && <div className="text-[9px] text-amber-700">{plan.warnings.slice(0, 3).join(' · ')}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
