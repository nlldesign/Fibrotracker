import React from 'react';
import { useFibroStore } from '../store/useFibroStore';
import {
  classifyRecord,
  formatDateKey,
  formatHumanDate,
  isPredictiveWarningDay,
} from '../domain/riskEngine';
import { BODY_ZONE_MAP, TRIGGER_METADATA } from '../constants/clinicalData';

export const CalendarPage: React.FC = () => {
  const {
    currentMonthDate,
    selectedDateStr,
    records,
    selectDay,
    navigateMonth,
    goToCurrentMonth,
    setPage,
  } = useFibroStore();

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthTitle = currentMonthDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());

  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;

  const dayCells = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const cellDate = new Date(year, month, day);
    const dateKey = formatDateKey(cellDate);
    const rec = records[dateKey];
    const status = classifyRecord(rec);
    const isSelected = dateKey === selectedDateStr;
    const isToday = dateKey === todayKey;
    const isPredicted = isPredictiveWarningDay(dateKey, records);

    if (status === 'green') greenCount++;
    if (status === 'yellow') yellowCount++;
    if (status === 'red') redCount++;

    return {
      day,
      dateKey,
      rec,
      status,
      isSelected,
      isToday,
      isPredicted,
    };
  });

  const selectedRec = records[selectedDateStr];
  const selectedStatus = classifyRecord(selectedRec);

  const sleepMap: Record<string, string> = {
    bom: '🛌 Reparador',
    leve: '🥱 Cansado',
    insonia: '⚡ Insônia',
  };
  const fogMap: Record<string, string> = {
    claro: '✨ Foco Normal',
    leve: '🌫️ Distraído',
    intenso: '🌪️ Intenso',
  };

  return (
    <section className="page-fade">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Box */}
        <div className="lg:col-span-8 bg-rosebrand-50/40 dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
          {/* Calendar Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
                Visão Mensal do Ciclo
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">
                {monthTitle}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-rosebrand-100 dark:border-zinc-700 transition shadow-sm"
                aria-label="Mês anterior"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-xs font-semibold text-rosebrand-600 dark:text-rosebrand-400 border border-rosebrand-100 dark:border-zinc-700 transition shadow-sm"
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-rosebrand-100 dark:border-zinc-700 transition shadow-sm"
                aria-label="Próximo mês"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-rosebrand-400 dark:text-zinc-500 mb-3">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar Cells Container */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-2xl bg-transparent" />
            ))}

            {dayCells.map((cell) => {
              let bgClass =
                'bg-white dark:bg-zinc-800/70 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 border-rosebrand-100/80 dark:border-zinc-800';
              if (cell.status === 'green') {
                bgClass =
                  'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/60';
              } else if (cell.status === 'yellow') {
                bgClass =
                  'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/60';
              } else if (cell.status === 'red') {
                bgClass =
                  'bg-rosebrand-100/80 dark:bg-rosebrand-950/50 border-rosebrand-300 dark:border-rosebrand-800 hover:bg-rosebrand-200/60';
              } else if (cell.isPredicted) {
                bgClass =
                  'bg-rosebrand-50/40 dark:bg-zinc-800/40 border-2 border-dashed border-rosebrand-300 dark:border-rosebrand-700';
              }

              const ringClass = cell.isSelected
                ? 'ring-2 ring-rosebrand-500 dark:ring-rosebrand-400 scale-[1.02] shadow-md z-10'
                : '';

              const dayBadgeClass = cell.isToday
                ? 'w-6 h-6 rounded-full bg-rosebrand-500 text-white font-bold flex items-center justify-center text-xs'
                : 'text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200';

              const icons: string[] = [];
              if (cell.rec) {
                if (cell.rec.fog === 'intenso' || cell.rec.fog === 'leve') icons.push('🌫️');
                if (cell.rec.sleep === 'insonia') icons.push('⚡');
                if (cell.rec.triggers?.includes('rigidez')) icons.push('🦴');
              }

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => selectDay(cell.dateKey)}
                  className={`h-14 sm:h-20 p-1.5 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between items-start relative text-left ${bgClass} ${ringClass}`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className={dayBadgeClass}>{cell.day}</span>
                    {cell.status === 'green' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                    {cell.status === 'yellow' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    )}
                    {cell.status === 'red' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rosebrand-500 animate-pulse" />
                    )}
                    {!cell.status && cell.isPredicted && (
                      <span className="text-[10px]" title="Dia sugerido para descanso preventivo">
                        🌸
                      </span>
                    )}
                  </div>

                  {cell.rec ? (
                    <div className="w-full flex items-center justify-between text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <span className="truncate">{icons.slice(0, 2).join('')}</span>
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300">
                        {cell.rec.pain}
                      </span>
                    </div>
                  ) : cell.isPredicted ? (
                    <span className="text-[10px] text-rosebrand-500 dark:text-rosebrand-400 font-medium leading-tight hidden sm:inline">
                      Cuidado
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Visual Legend */}
          <div className="mt-6 pt-5 border-t border-rosebrand-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 inline-block ring-2 ring-emerald-100 dark:ring-emerald-950" />
                <span>Estável (0-3)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block ring-2 ring-amber-100 dark:ring-amber-950" />
                <span>Alerta Precoce (4-6)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rosebrand-500 inline-block ring-2 ring-rosebrand-200 dark:ring-rosebrand-950" />
                <span>Crise (7-10)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-rosebrand-400 inline-block" />
                <span>Zona de Cuidado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Summary Card (Side Inspector) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-rosebrand-100 dark:border-zinc-800">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
                    Resumo do Dia
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5 capitalize">
                    {formatHumanDate(selectedDateStr)}
                  </h3>
                </div>
                {selectedStatus === 'green' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    🟢 Estável
                  </span>
                )}
                {selectedStatus === 'yellow' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    🟡 Alerta
                  </span>
                )}
                {selectedStatus === 'red' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300">
                    🔴 Crise
                  </span>
                )}
                {!selectedStatus && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rosebrand-50 text-rosebrand-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Sem registro
                  </span>
                )}
              </div>

              {!selectedRec ? (
                <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                  <p className="text-2xl mb-2">📝</p>
                  <p className="font-medium text-zinc-600 dark:text-zinc-300">
                    Nenhum sintoma registrado neste dia.
                  </p>
                  <p className="text-[11px] mt-1">
                    Clique no botão abaixo para preencher os dados deste dia.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
                      <span className="text-[10px] uppercase text-zinc-400 block">Dor</span>
                      <span className="text-sm font-bold text-zinc-800 dark:text-white">
                        {selectedRec.pain}/10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
                      <span className="text-[10px] uppercase text-zinc-400 block">Sono</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-white">
                        {sleepMap[selectedRec.sleep] || selectedRec.sleep}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
                      <span className="text-[10px] uppercase text-zinc-400 block">Mente</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-white">
                        {fogMap[selectedRec.fog] || selectedRec.fog}
                      </span>
                    </div>
                  </div>

                  {/* Body Zones Affected */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1.5">
                      Regiões de Dor (Mapa Corporal)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRec.bodyZones && selectedRec.bodyZones.length > 0 ? (
                        selectedRec.bodyZones.map((zoneId) => {
                          const meta = BODY_ZONE_MAP[zoneId];
                          return (
                            <span
                              key={zoneId}
                              className="px-2.5 py-1 rounded-full bg-rosebrand-100/70 dark:bg-rosebrand-950/60 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-rosebrand-800 text-[11px] font-medium"
                            >
                              {meta ? `${meta.emoji} ${meta.shortLabel}` : zoneId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-zinc-400">Nenhuma região mapeada</span>
                      )}
                    </div>
                  </div>

                  {/* Triggers */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1.5">
                      Sinais & Gatilhos
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRec.triggers && selectedRec.triggers.length > 0 ? (
                        selectedRec.triggers.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-full bg-rosebrand-50 dark:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 text-[11px] font-medium"
                          >
                            {TRIGGER_METADATA[t]?.pillLabel || t}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400">Nenhum gatilho marcado</span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      Anotações
                    </span>
                    <p className="p-3 rounded-2xl bg-rosebrand-50/30 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-300 italic">
                      {selectedRec.notes ? selectedRec.notes : 'Sem anotações adicionais.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 mt-5 border-t border-rosebrand-50 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPage('checkin')}
                className="w-full bg-rosebrand-500 hover:bg-rosebrand-600 text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>✏️ Editar / Registrar este Dia</span>
              </button>
            </div>
          </div>

          {/* Mini Monthly Counter */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-50/70 dark:bg-zinc-900 p-3.5 rounded-2xl border border-emerald-200/70 dark:border-zinc-800 text-center">
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {greenCount}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Estáveis</p>
            </div>
            <div className="bg-amber-50/70 dark:bg-zinc-900 p-3.5 rounded-2xl border border-amber-200/70 dark:border-zinc-800 text-center">
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{yellowCount}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Alertas</p>
            </div>
            <div className="bg-rosebrand-50/80 dark:bg-zinc-900 p-3.5 rounded-2xl border border-rosebrand-200/70 dark:border-zinc-800 text-center">
              <p className="text-xl font-bold text-rosebrand-600 dark:text-rosebrand-400">
                {redCount}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Crises</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
