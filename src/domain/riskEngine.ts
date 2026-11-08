import {
  BodyZoneId,
  CycleStatus,
  DailyRecord,
  PainQualityKey,
  RecordsMap,
  ReliefActionKey,
  TriggerKey,
} from '../types/record';
import {
  BODY_ZONES,
  BODY_ZONE_MAP,
  PAIN_QUALITY_METADATA,
  RELIEF_ACTION_METADATA,
  TRIGGER_METADATA,
} from '../constants/clinicalData';

export function formatDateKey(dateObj: Date): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHumanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
}

export function classifyRecord(rec?: DailyRecord | null): CycleStatus | null {
  if (!rec) return null;
  if (
    rec.pain >= 7 ||
    (rec.pain >= 6 && rec.fog === 'intenso') ||
    (rec.spoons !== undefined && rec.spoons <= 1 && rec.pain >= 5)
  ) {
    return 'red';
  }
  if (
    rec.pain >= 4 ||
    rec.sleep === 'insonia' ||
    rec.fog === 'intenso' ||
    (rec.spoons !== undefined && rec.spoons <= 2) ||
    (rec.triggers && rec.triggers.length >= 2)
  ) {
    return 'yellow';
  }
  return 'green';
}

export function isPredictiveWarningDay(dateKey: string, records: RecordsMap): boolean {
  if (records[dateKey]) return false;
  const [y, m, d] = dateKey.split('-').map(Number);

  const prev1 = formatDateKey(new Date(y, m - 1, d - 1));
  const prev2 = formatDateKey(new Date(y, m - 1, d - 2));

  const c1 = classifyRecord(records[prev1]);
  const c2 = classifyRecord(records[prev2]);

  const todayKey = formatDateKey(new Date());
  if (
    dateKey >= todayKey &&
    (c1 === 'yellow' || c1 === 'red') &&
    (c2 === 'yellow' || c2 === 'red')
  ) {
    return true;
  }
  return false;
}

export function evaluateCurrentCyclePhase(records: RecordsMap): CycleStatus {
  const today = new Date();
  const recentStatuses: { status: CycleStatus; rec: DailyRecord }[] = [];

  for (let i = 0; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const r = records[formatDateKey(d)];
    if (r) {
      const st = classifyRecord(r);
      if (st) recentStatuses.push({ status: st, rec: r });
    }
  }

  const yellowOrRedCount = recentStatuses.filter(
    (x) => x.status === 'yellow' || x.status === 'red'
  ).length;
  const latest = recentStatuses[0];

  if (latest && latest.status === 'red') return 'red';
  if (yellowOrRedCount >= 2 || (latest && latest.status === 'yellow')) return 'yellow';
  return 'green';
}

export function getTopTriggers(records: RecordsMap, topN = 4) {
  const counts: Record<TriggerKey, number> = {
    rigidez: 0,
    estresse: 0,
    clima: 0,
    alodinia: 0,
    esforco: 0,
    hormonal: 0,
    sensorial: 0,
    intestino: 0,
  };

  const allRecords = Object.values(records);
  const totalLogs = allRecords.length;

  allRecords.forEach((r) => {
    r.triggers?.forEach((t) => {
      if (counts[t] !== undefined) counts[t]++;
    });
  });

  return Object.values(TRIGGER_METADATA)
    .map((meta) => {
      const count = counts[meta.key] || 0;
      const pct =
        totalLogs > 0 ? Math.min(100, Math.round((count / Math.max(1, totalLogs)) * 100)) : 0;
      return {
        ...meta,
        count,
        pct,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function getTopBodyZones(records: RecordsMap, topN = 4) {
  const counts: Partial<Record<BodyZoneId, number>> = {};
  const allRecords = Object.values(records);
  const totalLogs = allRecords.length;

  allRecords.forEach((r) => {
    r.bodyZones?.forEach((z) => {
      counts[z] = (counts[z] || 0) + 1;
    });
  });

  return BODY_ZONES.map((zone) => {
    const count = counts[zone.id] || 0;
    const pct =
      totalLogs > 0 ? Math.min(100, Math.round((count / Math.max(1, totalLogs)) * 100)) : 0;
    return {
      ...zone,
      count,
      pct,
    };
  })
    .filter((z) => z.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Calcula os indicadores clínicos ACR 2016 (WPI 0-19 e SSS 0-12) e estatísticas
 * para o período selecionado (ex: últimos 7, 30 ou 90 dias).
 */
export function generateClinicalReport(records: RecordsMap, daysFilter: number) {
  const today = new Date();
  const cutoffDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysFilter + 1
  );
  const cutoffKey = formatDateKey(cutoffDate);
  const todayKey = formatDateKey(today);

  const filteredEntries = Object.entries(records)
    .filter(([dateKey]) => dateKey >= cutoffKey && dateKey <= todayKey)
    .sort(([a], [b]) => a.localeCompare(b));

  const totalLoggedDays = filteredEntries.length;

  if (totalLoggedDays === 0) {
    return {
      daysFilter,
      totalLoggedDays: 0,
      avgPain: 0,
      avgSpoons: 0,
      greenDays: 0,
      yellowDays: 0,
      redDays: 0,
      sosDays: 0,
      continuousMedDays: 0,
      wpiScore: 0,
      sssScore: 0,
      meetsAcrThreshold: false,
      uniqueZones7d: [] as BodyZoneId[],
      topQualities: [] as { key: PainQualityKey; label: string; emoji: string; count: number }[],
      topReliefs: [] as { key: ReliefActionKey; label: string; emoji: string; count: number }[],
      entries: [] as { dateKey: string; rec: DailyRecord; status: CycleStatus }[],
    };
  }

  let sumPain = 0;
  let sumSpoons = 0;
  let greenDays = 0;
  let yellowDays = 0;
  let redDays = 0;
  let sosDays = 0;
  let continuousMedDays = 0;

  const qualityCounts: Partial<Record<PainQualityKey, number>> = {};
  const reliefCounts: Partial<Record<ReliefActionKey, number>> = {};

  const entries = filteredEntries.map(([dateKey, rec]) => {
    const status = classifyRecord(rec) || 'green';
    sumPain += rec.pain;
    sumSpoons += rec.spoons ?? 3;

    if (status === 'green') greenDays++;
    if (status === 'yellow') yellowDays++;
    if (status === 'red') redDays++;

    if (rec.reliefActions?.includes('med_sos')) sosDays++;
    if (rec.reliefActions?.includes('med_continua')) continuousMedDays++;

    rec.painQualities?.forEach((q) => {
      qualityCounts[q] = (qualityCounts[q] || 0) + 1;
    });

    rec.reliefActions?.forEach((ra) => {
      reliefCounts[ra] = (reliefCounts[ra] || 0) + 1;
    });

    return { dateKey, rec, status };
  });

  // ACR WPI & SSS Calculation (based on last 7 logged days or period)
  const last7Entries = entries.slice(-7);
  const uniqueZonesSet = new Set<BodyZoneId>();
  last7Entries.forEach(({ rec }) => {
    rec.bodyZones?.forEach((z) => uniqueZonesSet.add(z));
  });

  const uniqueZones7d = Array.from(uniqueZonesSet);
  const wpiScore = Math.min(
    19,
    uniqueZones7d.reduce((acc, z) => acc + (BODY_ZONE_MAP[z]?.acrWeight || 1), 0)
  );

  // SSS (0-12): Fatigue (0-3) + Unrefreshing Sleep (0-3) + Cognitive/Fog (0-3) + Somatic (0-3)
  const avgSpoons7d =
    last7Entries.reduce((acc, e) => acc + (e.rec.spoons ?? 3), 0) / last7Entries.length;
  const fatigueScore = avgSpoons7d <= 1.5 ? 3 : avgSpoons7d <= 2.5 ? 2 : avgSpoons7d <= 3.8 ? 1 : 0;

  const avgSleep7d =
    last7Entries.reduce(
      (acc, e) => acc + (e.rec.sleep === 'insonia' ? 3 : e.rec.sleep === 'leve' ? 1.5 : 0),
      0
    ) / last7Entries.length;
  const sleepScore = Math.min(3, Math.round(avgSleep7d));

  const avgFog7d =
    last7Entries.reduce(
      (acc, e) => acc + (e.rec.fog === 'intenso' ? 3 : e.rec.fog === 'leve' ? 1.5 : 0),
      0
    ) / last7Entries.length;
  const fogScore = Math.min(3, Math.round(avgFog7d));

  const somaticTriggersSet = new Set<string>();
  last7Entries.forEach(({ rec }) => {
    if (rec.bodyZones?.includes('head_jaw')) somaticTriggersSet.add('headache');
    if (rec.bodyZones?.includes('abdomen') || rec.triggers?.includes('intestino'))
      somaticTriggersSet.add('gi');
    if (rec.triggers?.includes('sensorial') || rec.triggers?.includes('alodinia'))
      somaticTriggersSet.add('sensory');
    if (rec.painQualities?.includes('formigamento')) somaticTriggersSet.add('paresthesia');
  });
  const somaticScore = Math.min(3, somaticTriggersSet.size);

  const sssScore = Math.min(12, fatigueScore + sleepScore + fogScore + somaticScore);
  const meetsAcrThreshold =
    (wpiScore >= 7 && sssScore >= 5) || (wpiScore >= 4 && wpiScore <= 6 && sssScore >= 9);

  const topQualities = Object.values(PAIN_QUALITY_METADATA)
    .map((m) => ({ ...m, count: qualityCounts[m.key] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const topReliefs = Object.values(RELIEF_ACTION_METADATA)
    .map((m) => ({ ...m, count: reliefCounts[m.key] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    daysFilter,
    totalLoggedDays,
    avgPain: Number((sumPain / totalLoggedDays).toFixed(1)),
    avgSpoons: Number((sumSpoons / totalLoggedDays).toFixed(1)),
    greenDays,
    yellowDays,
    redDays,
    sosDays,
    continuousMedDays,
    wpiScore,
    sssScore,
    meetsAcrThreshold,
    uniqueZones7d,
    topQualities,
    topReliefs,
    entries,
  };
}

export function createDemoSeedData(): RecordsMap {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const demo: RecordsMap = {};

  const samplePattern: Array<{ offset: number } & DailyRecord> = [
    {
      offset: -12,
      pain: 2,
      spoons: 4,
      sleep: 'bom',
      fog: 'claro',
      triggers: [],
      bodyZones: ['shoulders_trapezius'],
      painQualities: ['peso'],
      reliefActions: ['med_continua', 'movimento_leve'],
      notes: 'Caminhada leve, dia produtivo.',
    },
    {
      offset: -11,
      pain: 1,
      spoons: 5,
      sleep: 'bom',
      fog: 'claro',
      triggers: [],
      bodyZones: [],
      painQualities: [],
      reliefActions: ['med_continua'],
      notes: 'Sem dores significativas.',
    },
    {
      offset: -10,
      pain: 3,
      spoons: 4,
      sleep: 'bom',
      fog: 'claro',
      triggers: ['clima'],
      bodyZones: ['neck_cervical'],
      painQualities: ['peso'],
      reliefActions: ['med_continua', 'calor_local'],
      notes: 'Frente fria chegando.',
    },
    {
      offset: -9,
      pain: 5,
      spoons: 2,
      sleep: 'leve',
      fog: 'leve',
      triggers: ['clima', 'rigidez', 'hormonal'],
      bodyZones: ['neck_cervical', 'shoulders_trapezius'],
      painQualities: ['peso', 'queimacao'],
      reliefActions: ['med_continua', 'calor_local'],
      notes: 'Acordei com o corpo pesado, rígido e início de TPM.',
    },
    {
      offset: -8,
      pain: 6,
      spoons: 2,
      sleep: 'insonia',
      fog: 'intenso',
      triggers: ['rigidez', 'estresse', 'alodinia', 'sensorial'],
      bodyZones: ['head_jaw', 'neck_cervical', 'shoulders_trapezius', 'upper_back'],
      painQualities: ['queimacao', 'formigamento'],
      reliefActions: ['med_continua', 'med_sos', 'repouso'],
      notes: 'Muita névoa mental, sensibilidade à luz e formigamento nas mãos.',
    },
    {
      offset: -7,
      pain: 8,
      spoons: 1,
      sleep: 'insonia',
      fog: 'intenso',
      triggers: ['rigidez', 'alodinia', 'hormonal'],
      bodyZones: [
        'neck_cervical',
        'shoulders_trapezius',
        'lower_back',
        'hips_glutes',
        'thighs_knees',
      ],
      painQualities: ['queimacao', 'peso', 'pontadas'],
      reliefActions: ['med_continua', 'med_sos', 'calor_local', 'repouso'],
      notes: 'Crise instalada. Dor difusa nos ombros, lombar e quadril. Precisei de SOS.',
    },
    {
      offset: -6,
      pain: 7,
      spoons: 1,
      sleep: 'leve',
      fog: 'intenso',
      triggers: ['rigidez', 'intestino'],
      bodyZones: ['shoulders_trapezius', 'lower_back', 'hips_glutes', 'abdomen'],
      painQualities: ['peso', 'queimacao'],
      reliefActions: ['med_continua', 'calor_local', 'repouso'],
      notes: 'Repouso e compressa morna.',
    },
    {
      offset: -5,
      pain: 4,
      spoons: 3,
      sleep: 'leve',
      fog: 'leve',
      triggers: [],
      bodyZones: ['shoulders_trapezius', 'lower_back'],
      painQualities: ['peso'],
      reliefActions: ['med_continua', 'movimento_leve'],
      notes: 'Saindo da crise, ainda com fadiga residual.',
    },
    {
      offset: -4,
      pain: 2,
      spoons: 4,
      sleep: 'bom',
      fog: 'claro',
      triggers: [],
      bodyZones: [],
      painQualities: [],
      reliefActions: ['med_continua', 'movimento_leve'],
      notes: 'Recuperada.',
    },
    {
      offset: -3,
      pain: 2,
      spoons: 4,
      sleep: 'bom',
      fog: 'claro',
      triggers: [],
      bodyZones: [],
      painQualities: [],
      reliefActions: ['med_continua'],
      notes: 'Dia tranquilo.',
    },
    {
      offset: -2,
      pain: 4,
      spoons: 2,
      sleep: 'leve',
      fog: 'claro',
      triggers: ['esforco'],
      bodyZones: ['lower_back', 'wrists_hands'],
      painQualities: ['peso', 'formigamento'],
      reliefActions: ['med_continua', 'calor_local'],
      notes: 'Exagerei na faxina ontem (efeito rebote / PEM).',
    },
    {
      offset: -1,
      pain: 5,
      spoons: 2,
      sleep: 'leve',
      fog: 'leve',
      triggers: ['rigidez', 'estresse'],
      bodyZones: ['neck_cervical', 'shoulders_trapezius', 'lower_back'],
      painQualities: ['peso', 'queimacao'],
      reliefActions: ['med_continua', 'repouso'],
      notes: 'Alerta amarelo: corpo pedindo pausa.',
    },
  ];

  samplePattern.forEach((item) => {
    const d = new Date(year, month, today.getDate() + item.offset);
    demo[formatDateKey(d)] = {
      pain: item.pain,
      spoons: item.spoons,
      sleep: item.sleep,
      fog: item.fog,
      triggers: item.triggers,
      bodyZones: item.bodyZones,
      painQualities: item.painQualities,
      reliefActions: item.reliefActions,
      notes: item.notes,
    };
  });

  return demo;
}
