import React from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import { PageId } from '../../types/record';

const NAV_ITEMS: { id: PageId; icon: string; label: string }[] = [
  { id: 'checkin', icon: '📝', label: '1. Registrar' },
  { id: 'calendar', icon: '🗓️', label: '2. Calendário' },
  { id: 'insights', icon: '🌸', label: '3. Ciclo & Alertas' },
  { id: 'reports', icon: '📊', label: '4. Relatório Médico' },
];

export const Header: React.FC = () => {
  const { currentPage, setPage, resetDemoData, toggleTheme, user, setAuthModalOpen } =
    useFibroStore();

  return (
    <header className="print:hidden sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-rosebrand-100 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer shrink-0"
          onClick={() => setPage('checkin')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rosebrand-300 to-rosebrand-400 dark:from-rosebrand-600 dark:to-rosebrand-500 flex items-center justify-center text-white shadow-sm shadow-rosebrand-200 dark:shadow-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                FibroCare
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-900/50 dark:text-rosebrand-300 hidden sm:inline-block">
                Diário Cíclico
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden lg:block">
              Monitoramento inteligente, mapa corporal e relatórios clínicos
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-rosebrand-50/70 dark:bg-zinc-900 p-1 rounded-2xl border border-rosebrand-100 dark:border-zinc-800">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={
                  active
                    ? 'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 bg-rosebrand-500 text-white shadow-sm'
                    : 'px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400 hover:text-rosebrand-600 dark:hover:text-rosebrand-300'
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Cloud / Supabase Account Button */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            title="Conta & Sincronização Supabase"
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              user
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 border-rosebrand-100 dark:border-zinc-800'
            }`}
          >
            <span>☁️</span>
            <span className="hidden sm:inline">{user ? 'Sincronizado' : 'Conta / Nuvem'}</span>
          </button>

          <button
            onClick={resetDemoData}
            title="Restaurar dados de exemplo"
            className="p-2.5 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-rosebrand-600 dark:text-zinc-400 border border-rosebrand-100 dark:border-zinc-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-rosebrand-600 dark:text-amber-400 border border-rosebrand-100 dark:border-zinc-800 transition"
            aria-label="Alternar Tema"
          >
            <svg
              className="w-5 h-5 hidden dark:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <svg
              className="w-5 h-5 block dark:hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
