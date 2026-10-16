'use client';

import { useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';

export default function UniversalModal() {
  const { modal, closeModal } = useDashboard();

  useEffect(() => {
    if (!modal.open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeModal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open, closeModal]);

  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900">{modal.title}</h3>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xs" aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{modal.body}</div>
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button onClick={closeModal} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">Close</button>
          <button onClick={closeModal} className="action-btn-black px-3 py-1.5 text-xs font-bold rounded-xl">Acknowledge</button>
        </div>
      </div>
    </div>
  );
}
