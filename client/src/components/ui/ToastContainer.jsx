import React from 'react';
import { useApp } from '../../contexts/AppContext';

export default function ToastContainer() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-enter px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${
            t.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-100' :
            t.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-100' :
            'bg-surface/95 border-white/10 text-white'
          }`}
        >
          <div className="font-bold text-sm">{t.title}</div>
          {t.body && <div className="text-xs mt-1 opacity-80">{t.body}</div>}
        </div>
      ))}
    </div>
  );
}
