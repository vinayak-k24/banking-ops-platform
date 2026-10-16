'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULES } from '@/lib/modules';
import { useDashboard } from '@/context/DashboardContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { toggleGeminiDrawer } = useDashboard();

  return (
    <aside className="w-16 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 flex flex-col items-center py-4 justify-between shrink-0 shadow-sm z-20">
      <Link
        href="/ops"
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-coralRed to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-coralRed/30 cursor-pointer hover:scale-105 transition-transform"
      >
        <i className="fa-solid fa-shapes" />
      </Link>

      <nav className="flex flex-col space-y-2.5 my-auto">
        {MODULES.map((m) => {
          const active = pathname === `/${m.id}`;
          return (
            <Link
              key={m.id}
              href={`/${m.id}`}
              title={m.title}
              className={`nav-icon-btn ${active ? 'active' : ''} w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all text-sm group relative`}
            >
              <i className={`fa-solid ${m.icon}`} />
              <span className="absolute left-14 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                {m.navLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleGeminiDrawer}
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform group relative"
      >
        <i className="fa-solid fa-wand-magic-sparkles text-xs" />
        <span className="absolute left-14 bg-indigo-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
          Gemini Telemetry Drawer
        </span>
      </button>
    </aside>
  );
}
