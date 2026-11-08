import React, { useEffect, useState } from 'react';
import { useFibroStore } from '../store/useFibroStore';
import {
  classifyRecord,
  evaluateCurrentCyclePhase,
  formatDateKey,
  formatHumanDate,
} from '../domain/riskEngine';
import {
  CARE_PROTOCOLS,
  PAIN_QUALITY_METADATA,
  RELIEF_ACTION_METADATA,
  SPOON_LEVELS,
  TRIGGER_METADATA,
} from '../constants/clinicalData';
import {
  BodyZoneId,
  DailyRecord,
  FogLevel,
  PainQualityKey,
  ReliefActionKey,
  SleepQuality,
  TriggerKey,
} from '../types/record';
import { BodyPainMap } from '../components/checkin/BodyPainMap';

export const CheckinPage: React.FC = () => {
  const {
    selectedDateStr,
    records,
    setPage,
    shiftSelectedDay,
    selectToday,
    saveRecord,
    deleteRecord,
    showToast,
  } = useFibroStore();

  const existing = records[selectedDateStr];
  const todayKey = formatDateKey(new Date());
  const isToday = selectedDateStr === todayKey;

  const [formState, setFormState] = useState<DailyRecord>({
    pain: 2,
    spoons: 3,
    sleep: 'bom',
    fog: 'claro',
    triggers: [],
    bodyZones: [],
    painQualities: [],
    reliefActions: [],
    notes: '',
  });

  useEffect(() => {
    if (existing) {
      setFormState({
        pain: existing.pain ?? 2,
        spoons: existing.spoons ?? 3,
        sleep: existing.sleep || 'bom',
        fog: existing.fog || 'claro',
        triggers: [...(existing.triggers || [])],
        bodyZones: [...(existing.bodyZones || [])],
        painQualities: [...(existing.painQualities || [])],
        reliefActions: [...(existing.reliefActions || [])],
        notes: existing.notes || '',
      });
    } else {
      setFormState({
        pain: 2,
        spoons: 3,
        sleep: 'bom',
        fog: 'claro',
        triggers: [],
        bodyZones: [],
        painQualities: [],
        reliefActions: [],
        notes: '',
      });
    }
  }, [selectedDateStr, existing]);

  const currentPhase = evaluateCurrentCyclePhase(records);
  const phaseProtocol = CARE_PROTOCOLS[currentPhase];
  const existingStatus = classifyRecord(existing);

  const toggleTrigger = (key: TriggerKey) => {
    setFormState((prev) => ({
      ...prev,
      triggers: prev.triggers.includes(key)
        ? prev.triggers.filter((t) => t !== key)
        : [...prev.triggers, key],
    }));
  };

  const toggleBodyZone = (zoneId: BodyZoneId) => {
    setFormState((prev) => ({
      ...prev,
      bodyZones: prev.bodyZones.includes(zoneId)
        ? prev.bodyZones.filter((z) => z !== zoneId)
        : [...prev.bodyZones, zoneId],
    }));
  };

  const togglePainQuality = (key: PainQualityKey) => {
    setFormState((prev) => ({
      ...prev,
      painQualities: prev.painQualities.includes(key)
        ? prev.painQualities.filter((q) => q !== key)
        : [...prev.painQualities, key],
    }));
  };

  const toggleReliefAction = (key: ReliefActionKey) => {
    setFormState((prev) => ({
      ...prev,
      reliefActions: prev.reliefActions.includes(key)
        ? prev.reliefActions.filter((r) => r !== key)
        : [...prev.reliefActions, key],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecord(selectedDateStr, {
      ...formState,
      notes: formState.notes.trim(),
    });
    showToast('Registro atualizado com sucesso!');
  };

  const handleSaveAndCalendar = () => {
    saveRecord(selectedDateStr, {
      ...formState,
      notes: formState.notes.trim(),
    });
    showToast('Registro salvo! Abrindo calendário...');
    setPage('calendar');
  };

  const handleDelete = () => {
    deleteRecord(selectedDateStr);
    showToast('Registro removido.');
  };

  const getPainBadgeClasses = (num: number) => {
    if (num <= 3) {
      return 'text-base font-extrabold px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    }
    if (num <= 6) {
      return 'text-base font-extrabold px-3 py-1 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    }
    return 'text-base font-extrabold px-3 py-1 rounded-xl bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300';
  };

  const getMiniBadgeClasses = () => {
    if (currentPhase === 'red') {
      return 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300';
    }
    if (currentPhase === 'yellow') {
      return 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    }
    return 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  };

  const activeSpoonMeta =
    SPOON_LEVELS.find((s) => s.spoons === formState.spoons) || SPOON_LEVELS[2];

  return (
    <section className="page-fade">
      <div className="max-w-3xl mx-auto">
        {/* Top Quick Context Bar */}
        <div className="mb-5 bg-gradient-to-r from-rosebrand-50 via-rosebrand-50/60 to-white dark:from-zinc-900 dark:to-zinc-900 rounded-3xl p-4 border border-rosebrand-100 dark:border-zinc-800 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 flex items-center justify-center text-2xl shadow-sm shrink-0">
              {phaseProtocol.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
                  Status Hoje
                </span>
                <span className={getMiniBadgeClasses()}>{phaseProtocol.miniBadge}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 font-medium">
                {phaseProtocol.miniDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPage('insights')}
            className="shrink-0 text-xs font-bold text-rosebrand-600 dark:text-rosebrand-400 hover:underline flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-2 rounded-xl border border-rosebrand-100 dark:border-zinc-700 shadow-sm"
          >
            <span>Ver Ciclo</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Main Check-in Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-8 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
          {/* Date Selector Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-rosebrand-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
                Check-in de Sintomas
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => shiftSelectedDay(-1)}
                  className="p-1.5 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rosebrand-600 dark:text-zinc-300 transition"
                  title="Dia anterior"
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
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white capitalize">
                  {isToday
                    ? `Hoje, ${formatHumanDate(selectedDateStr)}`
                    : formatHumanDate(selectedDateStr)}
                </h2>
                <button
                  type="button"
                  onClick={() => shiftSelectedDay(1)}
                  className="p-1.5 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rosebrand-600 dark:text-zinc-300 transition"
                  title="Próximo dia"
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
                {!isToday && (
                  <button
                    type="button"
                    onClick={selectToday}
                    className="text-[11px] font-bold text-rosebrand-600 dark:text-rosebrand-400 underline ml-1"
                  >
                    Voltar para Hoje
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {existingStatus === 'green' && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  🟢 Dia Estável
                </span>
              )}
              {existingStatus === 'yellow' && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  🟡 Alerta Precoce
                </span>
              )}
              {existingStatus === 'red' && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300">
                  🔴 Dia de Crise
                </span>
              )}
              {!existingStatus && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rosebrand-50 text-rosebrand-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Novo Registro
                </span>
              )}
            </div>
          </div>

          {/* Interactive Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Pain Level Slider & Pain Quality */}
            <div className="bg-rosebrand-50/50 dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-rosebrand-100/80 dark:border-zinc-800 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold uppercase text-zinc-800 dark:text-zinc-200">
                      1. Intensidade & Sensação da Dor
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Deslize para pontuar a dor (0 a 10) e marque como ela se manifesta hoje
                    </p>
                  </div>
                  <span className={getPainBadgeClasses(formState.pain)}>{formState.pain} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formState.pain}
                  onChange={(e) => setFormState({ ...formState, pain: Number(e.target.value) })}
                  className="w-full accent-rosebrand-500 cursor-pointer h-2.5 rounded-lg my-2"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  <span>🟢 0-3 (Estável)</span>
                  <span>🟡 4-6 (Alerta)</span>
                  <span>🔴 7-10 (Crise)</span>
                </div>
              </div>

              {/* Pain Quality Chips (Burning, Tingling, Heavy, Stabbing) */}
              <div className="pt-3 border-t border-rosebrand-100 dark:border-zinc-700/70">
                <span className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 block mb-2">
                  Qual é a característica da dor hoje? (Opcional)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(PAIN_QUALITY_METADATA).map((q) => {
                    const active = formState.painQualities.includes(q.key);
                    return (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => togglePainQuality(q.key)}
                        title={q.desc}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          active
                            ? 'bg-rosebrand-500 border-rosebrand-500 text-white font-bold shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-rosebrand-50'
                        }`}
                      >
                        <span>{q.emoji}</span>
                        <span className="truncate">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Interactive Body Pain Map */}
            <BodyPainMap
              selectedZones={formState.bodyZones}
              onToggleZone={toggleBodyZone}
              onClearAll={() => setFormState({ ...formState, bodyZones: [] })}
            />

            {/* 3. Energy Battery (Spoon Theory) */}
            <div className="bg-rosebrand-50/30 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-rosebrand-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <label className="text-xs sm:text-sm font-bold uppercase text-zinc-800 dark:text-zinc-200">
                    3. Bateria de Energia Diária (Teoria das Colheres 🥄)
                  </label>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Quantas &ldquo;colheres&rdquo; de disposição física você sente que tem hoje?
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${activeSpoonMeta.badgeColor}`}>
                  {activeSpoonMeta.label}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {SPOON_LEVELS.map((lvl) => {
                  const filled = lvl.spoons <= formState.spoons;
                  const exact = lvl.spoons === formState.spoons;
                  return (
                    <button
                      key={lvl.spoons}
                      type="button"
                      onClick={() => setFormState({ ...formState, spoons: lvl.spoons })}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        exact
                          ? 'bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm scale-[1.02]'
                          : filled
                          ? 'bg-rosebrand-100/80 dark:bg-rosebrand-950/60 border-rosebrand-300 dark:border-rosebrand-800 text-rosebrand-800 dark:text-rosebrand-200'
                          : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      <span className="text-base">{'🥄'.repeat(Math.min(lvl.spoons, 3))}</span>
                      <span>{lvl.spoons}/5</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5">
                💡 {activeSpoonMeta.desc}
              </p>
            </div>

            {/* 4. Sleep & 5. Fibrofog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sleep */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-2.5">
                  4. Qualidade do Sono
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'bom', emoji: '🛌', label: 'Reparador' },
                      { key: 'leve', emoji: '🥱', label: 'Cansado' },
                      { key: 'insonia', emoji: '⚡', label: 'Não dormi' },
                    ] as { key: SleepQuality; emoji: string; label: string }[]
                  ).map((opt) => {
                    const active = formState.sleep === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormState({ ...formState, sleep: opt.key })}
                        className={
                          active
                            ? 'py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition bg-rosebrand-100 border-rosebrand-400 text-rosebrand-800 dark:bg-rosebrand-950/80 dark:border-rosebrand-500 dark:text-rosebrand-200 shadow-sm'
                            : 'py-2.5 px-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition bg-rosebrand-50/30 border-rosebrand-100 text-zinc-600 hover:bg-rosebrand-50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400'
                        }
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fibrofog */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-2.5">
                  5. Névoa Mental (Fibrofog)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'claro', emoji: '✨', label: 'Foco Normal' },
                      { key: 'leve', emoji: '🌫️', label: 'Distraído' },
                      { key: 'intenso', emoji: '🌪️', label: 'Intenso' },
                    ] as { key: FogLevel; emoji: string; label: string }[]
                  ).map((opt) => {
                    const active = formState.fog === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormState({ ...formState, fog: opt.key })}
                        className={
                          active
                            ? 'py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition bg-rosebrand-100 border-rosebrand-400 text-rosebrand-800 dark:bg-rosebrand-950/80 dark:border-rosebrand-500 dark:text-rosebrand-200 shadow-sm'
                            : 'py-2.5 px-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition bg-rosebrand-50/30 border-rosebrand-100 text-zinc-600 hover:bg-rosebrand-50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400'
                        }
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6. Early Warning Signs / Triggers Pills */}
            <div>
              <div className="mb-2.5">
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                  6. Sinais de Alerta Precoce, Gatilhos & Sintomas Associados
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Inclui fatores físicos, hormonais (TPM), sensoriais e gastrointestinais
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(TRIGGER_METADATA).map((trig) => {
                  const active = formState.triggers.includes(trig.key);
                  return (
                    <button
                      key={trig.key}
                      type="button"
                      onClick={() => toggleTrigger(trig.key)}
                      className={
                        active
                          ? 'px-3.5 py-2 rounded-full text-xs font-semibold border transition bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                          : 'px-3.5 py-2 rounded-full text-xs font-medium border transition bg-rosebrand-50/50 border-rosebrand-200 text-zinc-700 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                      }
                    >
                      {trig.pillLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Medication & Relief Actions */}
            <div>
              <div className="mb-2.5">
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                  7. Medicação & Cuidados de Alívio Realizados Hoje
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Ajuda seu médico a saber quantos dias exigiram medicação de resgate (SOS)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(RELIEF_ACTION_METADATA).map((item) => {
                  const active = formState.reliefActions.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleReliefAction(item.key)}
                      className={
                        active
                          ? item.isRescue
                            ? 'px-3.5 py-2 rounded-full text-xs font-bold border transition bg-rose-600 border-rose-600 text-white shadow-sm'
                            : 'px-3.5 py-2 rounded-full text-xs font-semibold border transition bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'px-3.5 py-2 rounded-full text-xs font-medium border transition bg-white dark:bg-zinc-800 border-rosebrand-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-rosebrand-50'
                      }
                    >
                      {item.emoji} {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. Notes */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 mb-1.5">
                8. Anotações do Dia (Opcional)
              </label>
              <textarea
                rows={2}
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                placeholder="Qual remédio SOS tomou, como foi o humor ou o que ajudou a aliviar..."
                className="w-full bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rosebrand-400 resize-none"
              />
            </div>

            {/* Submit & Secondary Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="submit"
                className="flex-1 bg-rosebrand-500 hover:bg-rosebrand-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-rosebrand-200 dark:shadow-none transition text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Salvar Registro</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAndCalendar}
                className="bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rosebrand-700 dark:text-rosebrand-300 font-semibold py-3.5 px-5 rounded-2xl border border-rosebrand-200 dark:border-zinc-700 transition text-xs flex items-center justify-center space-x-1.5"
              >
                <span>Salvar e Ver Calendário</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              {existing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-3.5 rounded-2xl bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-rose-950/50 dark:text-zinc-400 transition flex items-center justify-center"
                  title="Apagar registro deste dia"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
