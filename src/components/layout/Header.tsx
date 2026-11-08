import React from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import { PageId } from '../../types/record';
import {
  BarChart3,
  CalendarDays,
  Flower2,
  Heart,
  Moon,
  PenLine,
  Settings,
  Sun,
} from '../common/ClinicalIcons';

const NAV_ITEMS: { id: PageId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'checkin', label: '1. Registrar', Icon: PenLine },
  { id: 'calendar', label: '2. Calendário', Icon: CalendarDays },
  { id: 'insights', label: '3. Ciclo & Alertas', Icon: Flower2 },
  { id: 'reports', label: '4. Relatório Médico', Icon: BarChart3 },
];

export const Header: React.FC = () => {
  const { currentPage, setPage, toggleTheme, setSettingsModalOpen } = useFibroStore();

  return (
    <header className="print:hidden sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-rosebrand-100 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer shrink-0"
          onClick={() => setPage('checkin')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rosebrand-400 to-rosebrand-500 dark:from-rosebrand-600 dark:to-rosebrand-500 flex items-center justify-center text-white shadow-sm shadow-rosebrand-200 dark:shadow-none">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                FibroCare
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60 hidden sm:inline-block whitespace-nowrap">
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
            const Icon = item.Icon;
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
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Settings & Export Report Button */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            title="Configurações e Preferências"
            className="p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-200 border border-rosebrand-100 dark:border-zinc-800 transition flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Configurações</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-rosebrand-600 dark:text-amber-400 border border-rosebrand-100 dark:border-zinc-800 transition"
            aria-label="Alternar Tema"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
};
