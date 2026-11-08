import React from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import { PageId } from '../../types/record';

const MOBILE_ITEMS: { id: PageId; icon: string; label: string }[] = [
  { id: 'checkin', icon: '📝', label: 'Registrar' },
  { id: 'calendar', icon: '🗓️', label: 'Calendário' },
  { id: 'insights', icon: '🌸', label: 'Ciclo' },
  { id: 'reports', icon: '📊', label: 'Relatório' },
];

export const BottomNav: React.FC = () => {
  const { currentPage, setPage } = useFibroStore();

  return (
    <nav className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-rosebrand-100 dark:border-zinc-800 px-3 py-2 flex justify-around items-center">
      {MOBILE_ITEMS.map((item) => {
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={
              active
                ? 'flex-1 py-1.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition text-rosebrand-600 dark:text-rosebrand-400 bg-rosebrand-50/80 dark:bg-zinc-900'
                : 'flex-1 py-1.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition text-zinc-400 dark:text-zinc-500'
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
