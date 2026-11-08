import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import {
  ClinicalIcon,
  Info,
  Layers,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SpoonIcon,
  Trash2,
  Zap,
} from '../components/common/ClinicalIcons';

export const CheckinPage: React.FC = () => {
  const {
    selectedDateStr,
    records,
    checkinActiveMode,
    setCheckinActiveMode,
    setSettingsModalOpen,
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

  const [isPainInfoModalOpen, setIsPainInfoModalOpen] = useState(false);

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
      return 'text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border dark:border-emerald-800/60';
    }
    if (num <= 6) {
      return 'text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl whitespace-nowrap shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 dark:border dark:border-amber-800/60';
    }
    return 'text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl whitespace-nowrap shrink-0 bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950/90 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60';
  };

  const getMiniBadgeClasses = () => {
    if (currentPhase === 'red') {
      return 'text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950/90 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60';
    }
    if (currentPhase === 'yellow') {
      return 'text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 dark:border dark:border-amber-800/60';
    }
    return 'text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border dark:border-emerald-800/60';
  };

  const activeSpoonMeta =
    SPOON_LEVELS.find((s) => s.spoons === formState.spoons) || SPOON_LEVELS[2];

  return (
    <section className="page-fade">
      <div className="max-w-3xl mx-auto">
        {/* Top Quick Context Bar (Fixed wrapping for STATUS HOJE & Ciclo Estável) */}
        <div className="mb-5 bg-gradient-to-r from-rosebrand-50 via-rosebrand-50/60 to-white dark:from-zinc-900 dark:to-zinc-900 rounded-3xl p-4 border border-rosebrand-100 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 flex items-center justify-center text-rosebrand-500 dark:text-rosebrand-400 shadow-sm shrink-0">
              <ClinicalIcon name={phaseProtocol.emoji} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-600 dark:text-rosebrand-400 whitespace-nowrap">
                  Status Hoje
                </span>
                <span className={getMiniBadgeClasses()}>{phaseProtocol.miniBadge}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium leading-snug">
                {phaseProtocol.miniDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPage('insights')}
            className="shrink-0 whitespace-nowrap text-xs font-bold text-rosebrand-600 dark:text-rosebrand-400 hover:underline flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-2 rounded-xl border border-rosebrand-100 dark:border-zinc-700 shadow-sm"
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
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-rosebrand-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
                Check-in de Sintomas
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => shiftSelectedDay(-1)}
                  className="p-2 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rosebrand-600 dark:text-zinc-300 transition"
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
                <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white capitalize">
                  {isToday
                    ? `Hoje, ${formatHumanDate(selectedDateStr)}`
                    : formatHumanDate(selectedDateStr)}
                </h2>
                <button
                  type="button"
                  onClick={() => shiftSelectedDay(1)}
                  className="p-2 rounded-xl bg-rosebrand-50 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rosebrand-600 dark:text-zinc-300 transition"
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
                    className="text-[11px] font-bold text-rosebrand-600 dark:text-rosebrand-400 underline ml-1 whitespace-nowrap"
                  >
                    Voltar para Hoje
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {existingStatus === 'green' && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border dark:border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Dia Estável</span>
                </span>
              )}
              {existingStatus === 'yellow' && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 dark:border dark:border-amber-800/60">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Alerta Precoce</span>
                </span>
              )}
              {existingStatus === 'red' && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950/90 dark:text-rosebrand-200 dark:border dark:border-rosebrand-800/60">
                  <span className="w-2 h-2 rounded-full bg-rosebrand-500" />
                  <span>Dia de Crise</span>
                </span>
              )}
              {!existingStatus && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap bg-rosebrand-50 text-rosebrand-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-zinc-700">
                  Novo Registro
                </span>
              )}
            </div>
          </div>

          {/* Mode Toggle Bar: Simples vs Avançado */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 bg-rosebrand-50/60 dark:bg-zinc-800/70 p-2 rounded-2xl border border-rosebrand-100 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-1.5 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setCheckinActiveMode('simple')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  checkinActiveMode === 'simple'
                    ? 'bg-rosebrand-500 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-rosebrand-600 dark:hover:text-zinc-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Simples</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckinActiveMode('advanced')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  checkinActiveMode === 'advanced'
                    ? 'bg-rosebrand-500 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-rosebrand-600 dark:hover:text-zinc-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span>Avançado</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-rosebrand-600 dark:hover:text-rosebrand-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/60 dark:hover:bg-zinc-800 transition"
              title="Escolher qual modo abrir sempre por padrão"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Definir modo padrão</span>
            </button>
          </div>

          {/* Interactive Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Pain Level Slider & Single-Keyword Pain Quality */}
            <div className="bg-rosebrand-50/40 dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-rosebrand-100/80 dark:border-zinc-800 space-y-4">
              <div>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <label className="text-xs sm:text-sm font-bold uppercase text-zinc-800 dark:text-zinc-100 block">
                      1. Intensidade & Sensação da Dor
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
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
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>0-3 (Estável)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>4-6 (Alerta)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rosebrand-500 inline-block" />
                    <span>7-10 (Crise)</span>
                  </span>
                </div>
              </div>

              {/* Single-Keyword Pain Quality Chips + Info Modal Trigger ('i') */}
              <div className="pt-3 border-t border-rosebrand-100 dark:border-zinc-700/70">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-300">
                    Característica da dor hoje
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPainInfoModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-rosebrand-300 border border-rosebrand-200 dark:border-zinc-700 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 transition shadow-sm"
                    title="Entenda o que significa cada característica da dor"
                  >
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>O que é cada tipo?</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(PAIN_QUALITY_METADATA).map((q) => {
                    const active = formState.painQualities.includes(q.key);
                    return (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => togglePainQuality(q.key)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                          active
                            ? 'bg-rosebrand-500 border-rosebrand-500 text-white font-bold shadow-sm'
                            : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-rosebrand-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <ClinicalIcon
                          name={q.key}
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-white' : 'text-rosebrand-500 dark:text-rosebrand-400'
                          }`}
                        />
                        <span>{q.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Interactive Body Pain Map (Shown in Advanced Mode) */}
            {checkinActiveMode === 'advanced' && (
              <BodyPainMap
                selectedZones={formState.bodyZones}
                onToggleZone={toggleBodyZone}
                onClearAll={() => setFormState({ ...formState, bodyZones: [] })}
              />
            )}

            {/* 3. Energy Battery (Spoon Theory) */}
            <div className="bg-rosebrand-50/30 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-rosebrand-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <label className="text-xs sm:text-sm font-bold uppercase text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>
                      {checkinActiveMode === 'advanced' ? '3.' : '2.'} Bateria de Energia Diária
                      (Teoria das Colheres)
                    </span>
                    <SpoonIcon className="w-4 h-4 text-rosebrand-500 shrink-0" />
                  </label>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Quantas &ldquo;colheres&rdquo; de disposição física você sente que tem hoje?
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${activeSpoonMeta.badgeColor}`}
                >
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
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                        exact
                          ? 'bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm scale-[1.02]'
                          : filled
                          ? 'bg-rosebrand-100/80 dark:bg-rosebrand-950/80 border-rosebrand-300 dark:border-rosebrand-700 text-rosebrand-800 dark:text-rosebrand-200'
                          : 'bg-white dark:bg-zinc-900 border-rosebrand-100 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      <SpoonIcon className="w-4 h-4" />
                      <span>{lvl.spoons}/5</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rosebrand-500 shrink-0" />
                <span>{activeSpoonMeta.desc}</span>
              </p>
            </div>

            {/* Sleep & Fibrofog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sleep */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-2.5">
                  {checkinActiveMode === 'advanced' ? '4.' : '3.'} Qualidade do Sono
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'bom', icon: 'sleep_bom', label: 'Reparador' },
                      { key: 'leve', icon: 'sleep_leve', label: 'Cansado' },
                      { key: 'insonia', icon: 'sleep_insonia', label: 'Não dormi' },
                    ] as { key: SleepQuality; icon: string; label: string }[]
                  ).map((opt) => {
                    const active = formState.sleep === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormState({ ...formState, sleep: opt.key })}
                        className={
                          active
                            ? 'py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                            : 'py-3 px-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition bg-rosebrand-50/30 border-rosebrand-100 text-zinc-700 hover:bg-rosebrand-50 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200'
                        }
                      >
                        <ClinicalIcon
                          name={opt.icon}
                          className={`w-5 h-5 ${
                            active ? 'text-white' : 'text-rosebrand-500 dark:text-rosebrand-400'
                          }`}
                        />
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fibrofog */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-2.5">
                  {checkinActiveMode === 'advanced' ? '5.' : '4.'} Névoa Mental (Fibrofog)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'claro', icon: 'fog_claro', label: 'Foco Normal' },
                      { key: 'leve', icon: 'fog_leve', label: 'Distraído' },
                      { key: 'intenso', icon: 'fog_intenso', label: 'Intenso' },
                    ] as { key: FogLevel; icon: string; label: string }[]
                  ).map((opt) => {
                    const active = formState.fog === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormState({ ...formState, fog: opt.key })}
                        className={
                          active
                            ? 'py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                            : 'py-3 px-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition bg-rosebrand-50/30 border-rosebrand-100 text-zinc-700 hover:bg-rosebrand-50 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200'
                        }
                      >
                        <ClinicalIcon
                          name={opt.icon}
                          className={`w-5 h-5 ${
                            active ? 'text-white' : 'text-rosebrand-500 dark:text-rosebrand-400'
                          }`}
                        />
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6. Early Warning Signs / Triggers Pills (Shown in Advanced Mode) */}
            {checkinActiveMode === 'advanced' && (
              <div>
                <div className="mb-2.5">
                  <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
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
                            ? 'px-3.5 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 bg-rosebrand-500 border-rosebrand-500 text-white shadow-sm'
                            : 'px-3.5 py-2 rounded-full text-xs font-medium border transition flex items-center gap-1.5 bg-rosebrand-50/50 border-rosebrand-200 text-zinc-700 hover:bg-rosebrand-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200'
                        }
                      >
                        <ClinicalIcon
                          name={trig.key}
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-white' : 'text-rosebrand-500 dark:text-rosebrand-400'
                          }`}
                        />
                        <span>{trig.pillLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medication & Relief Actions */}
            <div>
              <div className="mb-2.5">
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
                  {checkinActiveMode === 'advanced' ? '7.' : '5.'} Medicação & Cuidados de Alívio
                  Realizados Hoje
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Ajuda seu médico a acompanhar a adesão contínua e os dias que exigiram resgate
                  (SOS)
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
                            ? 'px-3.5 py-2 rounded-full text-xs font-bold border transition flex items-center gap-1.5 bg-rose-600 border-rose-600 text-white shadow-sm'
                            : 'px-3.5 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'px-3.5 py-2 rounded-full text-xs font-medium border transition flex items-center gap-1.5 bg-white dark:bg-zinc-800 border-rosebrand-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-rosebrand-50'
                      }
                    >
                      <ClinicalIcon
                        name={item.key}
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active
                            ? 'text-white'
                            : item.isRescue
                            ? 'text-rose-500'
                            : 'text-emerald-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. Notes (Shown in Advanced Mode) */}
            {checkinActiveMode === 'advanced' ? (
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-1.5">
                  8. Anotações do Dia
                </label>
                <textarea
                  rows={2}
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  placeholder="Qual remédio SOS tomou, como foi o humor ou o que ajudou a aliviar..."
                  className="w-full bg-rosebrand-50/40 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rosebrand-400 resize-none"
                />
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rosebrand-50/40 dark:bg-zinc-800/50 border border-dashed border-rosebrand-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rosebrand-500 shrink-0" />
                  <span>
                    Quer marcar o <strong>Mapa Corporal</strong>, gatilhos ou anotações hoje?
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCheckinActiveMode('advanced')}
                  className="font-bold text-rosebrand-600 dark:text-rosebrand-400 underline whitespace-nowrap"
                >
                  Expandir para Modo Avançado
                </button>
              </div>
            )}

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
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal Informativo "i": Explicação das Características da Dor */}
      {isPainInfoModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsPainInfoModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 w-full max-w-md max-h-[88vh] overflow-y-auto my-auto rounded-3xl p-6 border border-rosebrand-100 dark:border-zinc-800 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-300 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                      Características da Dor
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Entenda o que cada sensação representa na Fibromialgia
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPainInfoModalOpen(false)}
                  className="p-1.5 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {Object.values(PAIN_QUALITY_METADATA).map((q) => (
                  <div
                    key={q.key}
                    className="p-3.5 rounded-2xl bg-rosebrand-50/50 dark:bg-zinc-800/70 border border-rosebrand-100 dark:border-zinc-700/80 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-100 dark:border-zinc-700 text-rosebrand-500 dark:text-rosebrand-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ClinicalIcon name={q.key} className="w-4 h-4" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          {q.shortLabel}
                        </span>
                        <span className="text-[10px] font-semibold text-rosebrand-600 dark:text-rosebrand-400">
                          ({q.clinicalTitle})
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 mt-0.5">{q.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsPainInfoModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-rosebrand-500 hover:bg-rosebrand-600 text-white text-xs font-bold uppercase tracking-wider transition"
              >
                Entendi
              </button>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
