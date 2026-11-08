import React from 'react';
import { useFibroStore } from '../store/useFibroStore';
import {
  evaluateCurrentCyclePhase,
  getTopBodyZones,
  getTopTriggers,
} from '../domain/riskEngine';
import { CARE_PROTOCOLS } from '../constants/clinicalData';
import {
  ClinicalIcon,
  Compass,
  Flower2,
  Sparkles,
} from '../components/common/ClinicalIcons';

export const InsightsPage: React.FC = () => {
  const { records } = useFibroStore();

  const todayBadge = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const phase = evaluateCurrentCyclePhase(records);
  const protocol = CARE_PROTOCOLS[phase];
  const topTriggers = getTopTriggers(records, 3);
  const topBodyZones = getTopBodyZones(records, 4);

  const circleBorderClass =
    phase === 'red'
      ? 'bg-rosebrand-50 dark:bg-zinc-900 border-rosebrand-400 dark:border-rosebrand-600'
      : phase === 'yellow'
      ? 'bg-amber-50/40 dark:bg-zinc-900 border-amber-300 dark:border-amber-600/80'
      : 'bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-700/70';

  const circleIconColor =
    phase === 'red'
      ? 'text-rosebrand-500 dark:text-rosebrand-400'
      : phase === 'yellow'
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-emerald-500 dark:text-emerald-400';

  return (
    <section className="page-fade pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cycle Ring Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-rosebrand-50 via-rosebrand-50/40 to-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-3xl p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400">
              Termômetro do Ciclo
            </span>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-white/90 dark:bg-zinc-800 px-3 py-1 rounded-full border border-rosebrand-100 dark:border-zinc-700 whitespace-nowrap">
              {todayBadge}
            </span>
          </div>

          {/* Center Circular Indicator */}
          <div className="my-6 flex items-center justify-center z-10">
            <div
              className={`w-48 h-48 rounded-full border-8 shadow-inner flex flex-col items-center justify-center text-center p-4 transition-all duration-500 animate-pulse-soft ${circleBorderClass}`}
            >
              <div className={`mb-1.5 ${circleIconColor}`}>
                <ClinicalIcon name={protocol.emoji} className="w-8 h-8" />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-400 font-semibold">
                Risco de Crise
              </p>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white mt-0.5">
                {protocol.riskText}
              </h2>
              <p className="text-xs text-rosebrand-500 dark:text-rosebrand-400 mt-1 font-medium">
                {protocol.subtext}
              </p>
            </div>
          </div>

          {/* Alert Prediction Box */}
          <div className="z-10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-2xl p-4 border border-rosebrand-100 dark:border-zinc-700 flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-300 flex items-center justify-center shrink-0 mt-0.5">
              <ClinicalIcon name={protocol.predIcon} className="w-5 h-5" />
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-zinc-800 dark:text-zinc-100">{protocol.predTitle}</p>
              <p className="text-zinc-500 dark:text-zinc-300 mt-0.5">{protocol.predDesc}</p>
            </div>
          </div>

          {/* Decorative subtle background circles */}
          <div className="w-64 h-64 rounded-full bg-rosebrand-200/20 dark:bg-rosebrand-900/10 absolute -top-16 -right-16 pointer-events-none" />
          <div className="w-40 h-40 rounded-full bg-rosebrand-300/10 dark:bg-rosebrand-800/10 absolute -bottom-10 -left-10 pointer-events-none" />
        </div>

        {/* Right Column: Trigger Radar, Body Pain Ranking & Self-Care Protocol */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          {/* Early Warning Radar (Yellow Flags) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
                Mapeamento Pessoal
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                Radar de Sinais Prévios & Gatilhos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fatores que mais antecederam seus dias de fadiga ou crise neste ciclo
              </p>
            </div>

            <div className="space-y-4 my-4">
              {topTriggers.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                    <span className="font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2 min-w-0">
                      <ClinicalIcon
                        name={item.key}
                        className="w-4 h-4 text-rosebrand-500 dark:text-rosebrand-400 shrink-0"
                      />
                      <span className="leading-snug">{item.radarLabel}</span>
                    </span>
                    <span className="font-bold text-rosebrand-600 dark:text-rosebrand-400 whitespace-nowrap shrink-0">
                      {item.count}x no ciclo
                    </span>
                  </div>
                  <div className="w-full h-2 bg-rosebrand-100/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rosebrand-300 to-rosebrand-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.pct, 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Body Pain Zones Ranking */}
            <div className="mt-5 pt-4 border-t border-rosebrand-50 dark:border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400 block mb-2.5">
                Regiões Corporais Mais Afetadas no Ciclo
              </span>
              {topBodyZones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {topBodyZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="p-2.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/70 border border-rosebrand-100 dark:border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Compass className="w-4 h-4 text-rosebrand-500 dark:text-rosebrand-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {zone.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-rosebrand-300 border border-rosebrand-100 dark:border-zinc-700 shrink-0 whitespace-nowrap">
                        {zone.count}d
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Marque áreas no Mapa Corporal durante o check-in para ver o ranking anatômico.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-rosebrand-50 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-300">
              <span className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-rosebrand-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Observação clínica:</strong> Notar rigidez matinal na cervical/trapézio
                  somada a névoa mental costuma anteceder crises em 24h a 48h.
                </span>
              </span>
            </div>
          </div>

          {/* Actionable Prevention Checklist based on Phase */}
          <div className="bg-rosebrand-50/50 dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-rosebrand-500 shrink-0" />
              <span>Plano de Acolhimento Recomendado para Hoje</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {protocol.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-rosebrand-100 dark:border-zinc-700 flex items-start gap-2.5"
                >
                  <ClinicalIcon
                    name={rec.icon}
                    className="w-4 h-4 text-rosebrand-500 dark:text-rosebrand-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <strong className="text-zinc-900 dark:text-white">{rec.title}</strong>{' '}
                    <span className="text-zinc-600 dark:text-zinc-300">{rec.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
