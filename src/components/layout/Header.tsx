'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ACTORS, getModule, type ActorRole } from '@/lib/modules';
import { useDashboard } from '@/context/DashboardContext';

const TIMEFRAMES = [
  { value: 'Today', label: 'Today' },
  { value: '7 Days', label: 'Last 7 Days' },
  { value: 'This Month', label: 'This Month' },
];

export default function Header() {
  const pathname = usePathname();
  const meta = getModule(pathname.split('/')[1] ?? '') ?? getModule('ops')!;
  const { actor, switchActorRole, timeframe, setTimeframe, triggerExport, openModal } = useDashboard();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [today, setToday] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }).replace(',', ''));
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="h-12 w-full flex items-center justify-between px-2 mb-2 shrink-0">
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">{meta.title}</h1>
          <p className="text-[11px] text-slate-400 font-medium">{meta.subtitle}</p>
        </div>
        <span className="bg-amber-100 text-amber-900 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-amber-300/60 uppercase tracking-wide">
          DEMO / MOCK DATA
        </span>
      </div>

      <div className="flex-1 max-w-sm mx-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search across all 9 banking modules..."
            className="w-full bg-slate-200/60 border-0 text-xs text-slate-700 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={actor}
          onChange={(e) => switchActorRole(e.target.value as ActorRole)}
          className="bg-white text-[11px] text-slate-700 font-semibold rounded-full px-3 py-1.5 border border-slate-200/80 shadow-sm focus:outline-none cursor-pointer"
        >
          {ACTORS.map((a) => (
            <option key={a.value} value={a.value}>Actor: {a.label}</option>
          ))}
        </select>

        <div className="bg-white text-[11px] font-medium text-slate-600 rounded-full px-3 py-1.5 flex items-center space-x-2 border border-slate-200/80 shadow-sm">
          <i className="fa-regular fa-bell text-coralRed text-xs" />
          <span>{today} <span className="text-coralRed font-bold">(12)</span></span>
        </div>

        <div
          className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 shadow-sm cursor-pointer"
          onClick={() => openModal('User Profile', 'Operational Lead: Sarah Jenkins\nRole: Executive Admin')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-1.5"
          >
            <span>{timeframe}</span>
            <i className="fa-solid fa-chevron-down text-[8px] text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTimeframe(t.value); setDropdownOpen(false); }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => triggerExport('Executive Briefing')}
          className="bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-1.5"
        >
          <span>Export</span>
          <i className="fa-solid fa-arrow-up-from-bracket text-[9px] text-slate-400" />
        </button>
      </div>
    </header>
  );
}
