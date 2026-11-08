import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFibroStore } from '../store/useFibroStore';
import {
  classifyRecord,
  formatDateKey,
  formatHumanDate,
  isPredictiveWarningDay,
} from '../domain/riskEngine';
import { BODY_ZONE_MAP, PAIN_QUALITY_METADATA, TRIGGER_METADATA } from '../constants/clinicalData';
import {
  ClinicalIcon,
  Compass,
  Flower2,
  PenLine,
  SpoonIcon,
} from '../components/common/ClinicalIcons';

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

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const lastTapRef = useRef<{ dateKey: string; time: number }>({ dateKey: '', time: 0 });

  const handleCellClick = (dateKey: string) => {
    const now = Date.now();
    selectDay(dateKey);

    if (lastTapRef.current.dateKey === dateKey && now - lastTapRef.current.time < 350) {
      setIsDayModalOpen(true);
      lastTapRef.current = { dateKey: '', time: 0 };
    } else {
      lastTapRef.current = { dateKey, time: now };
    }
  };

  const handleCellDoubleClick = (dateKey: string) => {
    selectDay(dateKey);
    setIsDayModalOpen(true);
  };

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
    bom: 'Reparador',
    leve: 'Cansado',
    insonia: 'Insônia',
  };
  const fogMap: Record<string, string> = {
    claro: 'Foco Normal',
    leve: 'Distraído',
    intenso: 'Intenso',
  };

  return (
    <section className="page-fade">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Box */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
          {/* Calendar Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400 block">
                Visão Mensal do Ciclo
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white capitalize">
                {monthTitle}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Toque 2x em qualquer data para expandir o resumo e registrar
              </p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-2.5 rounded-xl bg-rosebrand-50/70 dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-rosebrand-100 dark:border-zinc-700 transition shadow-sm"
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
                className="px-3 py-2 rounded-xl bg-rosebrand-50/70 dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-xs font-semibold text-rosebrand-600 dark:text-rosebrand-300 border border-rosebrand-100 dark:border-zinc-700 transition shadow-sm whitespace-nowrap"
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-2.5 rounded-xl bg-rosebrand-50/70 dark:bg-zinc-800 hover:bg-rosebrand-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-rosebrand-100 dark:border-zinc-700 transition shadow-sm"
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
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-zinc-400 mb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar Cells Container (Anti-Break Proportional Grid) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[54px] sm:min-h-[72px] rounded-xl sm:rounded-2xl bg-transparent"
              />
            ))}

            {dayCells.map((cell) => {
              let bgClass =
                'bg-rosebrand-50/30 dark:bg-zinc-800/60 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 border-rosebrand-100/80 dark:border-zinc-800';
              if (cell.status === 'green') {
                bgClass =
                  'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100/70';
              } else if (cell.status === 'yellow') {
                bgClass =
                  'bg-amber-50/80 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100/70';
              } else if (cell.status === 'red') {
                bgClass =
                  'bg-rosebrand-100/80 dark:bg-rosebrand-950/70 border-rosebrand-300 dark:border-rosebrand-700 hover:bg-rosebrand-200/60';
              } else if (cell.isPredicted) {
                bgClass =
                  'bg-rosebrand-50/40 dark:bg-zinc-800/70 border-2 border-dashed border-rosebrand-300 dark:border-rosebrand-500';
              }

              const ringClass = cell.isSelected
                ? 'ring-2 ring-rosebrand-500 dark:ring-rosebrand-400 shadow-sm z-10'
                : '';

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => handleCellClick(cell.dateKey)}
                  onDoubleClick={() => handleCellDoubleClick(cell.dateKey)}
                  className={`min-h-[54px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between items-stretch relative text-left select-none ${bgClass} ${ringClass}`}
                >
                  {/* Top Row: Day Number + Status Dot */}
                  <div className="w-full flex items-center justify-between gap-0.5">
                    <span
                      className={
                        cell.isToday
                          ? 'text-[11px] sm:text-xs font-extrabold px-1.5 py-0.2 rounded-md bg-rosebrand-500 text-white leading-tight'
                          : 'text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight'
                      }
                    >
                      {cell.day}
                    </span>
                    {cell.status === 'green' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    {cell.status === 'yellow' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                    {cell.status === 'red' && (
                      <span className="w-2 h-2 rounded-full bg-rosebrand-500 animate-pulse shrink-0" />
                    )}
                    {!cell.status && cell.isPredicted && (
                      <Flower2 className="w-3 h-3 text-rosebrand-400 shrink-0" />
                    )}
                  </div>

                  {/* Bottom Row: Pain Score Pill */}
                  {cell.rec ? (
                    <div className="w-full flex items-center justify-end mt-1">
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 border border-black/5 dark:border-white/10 leading-none whitespace-nowrap">
                        <span className="hidden sm:inline text-[9px] text-zinc-400 mr-0.5">
                          Dor
                        </span>
                        {cell.rec.pain}
                      </span>
                    </div>
                  ) : cell.isPredicted ? (
                    <span className="text-[9px] text-rosebrand-500 dark:text-rosebrand-300 font-semibold leading-tight truncate hidden sm:block">
                      Cuidado
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Visual Legend */}
          <div className="mt-5 pt-4 border-t border-rosebrand-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span>Estável (0-3)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span>Alerta Precoce (4-6)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rosebrand-500 inline-block" />
                <span>Crise (7-10)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-dashed border-rosebrand-400 inline-block" />
                <span>Zona de Cuidado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Summary Card (Side Inspector) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-rosebrand-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400 block">
                    Resumo do Dia
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5 capitalize truncate">
                    {formatHumanDate(selectedDateStr)}
                  </h3>
                </div>
                {selectedStatus === 'green' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border dark:border-emerald-800/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Estável</span>
                  </span>
                )}
                {selectedStatus === 'yellow' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 dark:border dark:border-amber-800/60">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Alerta</span>
                  </span>
                )}
                {selectedStatus === 'red' && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 flex items-center gap-1.5 bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950/90 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60">
                    <span className="w-2 h-2 rounded-full bg-rosebrand-500" />
                    <span>Crise</span>
                  </span>
                )}
                {!selectedStatus && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 bg-rosebrand-50 text-rosebrand-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-zinc-700">
                    Sem registro
                  </span>
                )}
              </div>

              {!selectedRec ? (
                <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                  <div className="w-11 h-11 rounded-2xl bg-rosebrand-50 dark:bg-zinc-800 text-rosebrand-500 flex items-center justify-center mx-auto mb-2.5">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">
                    Nenhum sintoma registrado neste dia.
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Toque no botão abaixo para registrar os dados desta data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Dor
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {selectedRec.pain}/10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Sono
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {sleepMap[selectedRec.sleep] || selectedRec.sleep}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/60 border border-rosebrand-100 dark:border-zinc-800">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Mente
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {fogMap[selectedRec.fog] || selectedRec.fog}
                      </span>
                    </div>
                  </div>

                  {/* Body Zones Affected */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5">
                      Regiões de Dor (Mapa Corporal)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRec.bodyZones && selectedRec.bodyZones.length > 0 ? (
                        selectedRec.bodyZones.map((zoneId) => {
                          const meta = BODY_ZONE_MAP[zoneId];
                          return (
                            <span
                              key={zoneId}
                              className="px-2.5 py-1 rounded-full bg-rosebrand-100/70 dark:bg-rosebrand-950/80 text-rosebrand-800 dark:text-rosebrand-200 border border-rosebrand-200 dark:border-rosebrand-800/60 text-[11px] font-medium inline-flex items-center gap-1"
                            >
                              <Compass className="w-3 h-3 shrink-0" />
                              <span>{meta ? meta.shortLabel : zoneId}</span>
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
                    <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1.5">
                      Sinais & Gatilhos
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRec.triggers && selectedRec.triggers.length > 0 ? (
                        selectedRec.triggers.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-full bg-rosebrand-50 dark:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <ClinicalIcon name={t} className="w-3 h-3 shrink-0" />
                            <span>{TRIGGER_METADATA[t]?.pillLabel || t}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400">Nenhum gatilho marcado</span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                      Anotações
                    </span>
                    <p className="p-3 rounded-2xl bg-rosebrand-50/30 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 italic">
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
                className="w-full bg-rosebrand-500 hover:bg-rosebrand-600 text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                <span>Editar / Registrar este Dia</span>
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

      {/* Modal Resumido ao clicar 2x na data (com atalho para a aba Registrar) */}
      {isDayModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDayModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-2xl space-y-5 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-rosebrand-100 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400 block">
                    Resumo Rápido da Data
                  </span>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white capitalize mt-0.5">
                    {formatHumanDate(selectedDateStr)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDayModalOpen(false)}
                  className="p-2 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              {!selectedRec ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-rosebrand-50 dark:bg-zinc-800 text-rosebrand-500 flex items-center justify-center mx-auto">
                    <PenLine className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    Ainda não há registro neste dia
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Abra a aba Registrar abaixo para anotar seus sintomas de forma rápida.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/60 dark:bg-zinc-800 border border-rosebrand-100 dark:border-zinc-700">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Dor EVA
                      </span>
                      <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                        {selectedRec.pain}/10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/60 dark:bg-zinc-800 border border-rosebrand-100 dark:border-zinc-700">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Colheres
                      </span>
                      <span className="text-sm font-extrabold text-zinc-900 dark:text-white inline-flex items-center justify-center gap-1">
                        <SpoonIcon className="w-3.5 h-3.5 text-rosebrand-500" />
                        {selectedRec.spoons ?? 3}/5
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/60 dark:bg-zinc-800 border border-rosebrand-100 dark:border-zinc-700">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Sono
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {sleepMap[selectedRec.sleep] || selectedRec.sleep}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rosebrand-50/60 dark:bg-zinc-800 border border-rosebrand-100 dark:border-zinc-700">
                      <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block">
                        Fog
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {fogMap[selectedRec.fog] || selectedRec.fog}
                      </span>
                    </div>
                  </div>

                  {selectedRec.painQualities && selectedRec.painQualities.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                        Característica da Dor
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRec.painQualities.map((pq) => (
                          <span
                            key={pq}
                            className="px-2.5 py-1 rounded-full bg-rosebrand-50 dark:bg-zinc-800 text-rosebrand-700 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <ClinicalIcon name={pq} className="w-3 h-3" />
                            <span>{PAIN_QUALITY_METADATA[pq]?.shortLabel || pq}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRec.bodyZones && selectedRec.bodyZones.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                        Áreas Afetadas ({selectedRec.bodyZones.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRec.bodyZones.map((zoneId) => (
                          <span
                            key={zoneId}
                            className="px-2.5 py-1 rounded-full bg-rosebrand-100/70 dark:bg-rosebrand-950/80 text-rosebrand-800 dark:text-rosebrand-200 border border-rosebrand-200 dark:border-rosebrand-800/60 text-[11px] font-medium"
                          >
                            {BODY_ZONE_MAP[zoneId]?.shortLabel || zoneId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRec.notes && (
                    <p className="p-3 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 italic">
                      &ldquo;{selectedRec.notes}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Modal Actions: Aba Registrar */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDayModalOpen(false);
                    setPage('checkin');
                  }}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-rosebrand-500 hover:bg-rosebrand-600 text-white text-xs font-bold uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2"
                >
                  <PenLine className="w-4 h-4" />
                  <span>Abrir na Aba Registrar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDayModalOpen(false)}
                  className="py-3.5 px-4 rounded-2xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-rosebrand-100 dark:hover:bg-zinc-700 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
