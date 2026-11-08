export type SleepQuality = 'bom' | 'leve' | 'insonia';
export type FogLevel = 'claro' | 'leve' | 'intenso';
export type CheckinMode = 'simple' | 'advanced';

export type TriggerKey =
  | 'rigidez'
  | 'alodinia'
  | 'estresse'
  | 'clima'
  | 'esforco'
  | 'hormonal'
  | 'sensorial'
  | 'intestino';

export type PainQualityKey = 'queimacao' | 'formigamento' | 'peso' | 'pontadas';

export type ReliefActionKey =
  | 'med_continua'
  | 'med_sos'
  | 'calor_local'
  | 'repouso'
  | 'movimento_leve';

export type CycleStatus = 'green' | 'yellow' | 'red';
export type PageId = 'checkin' | 'calendar' | 'insights' | 'reports';

export type BodyZoneId =
  | 'head_jaw'
  | 'neck_cervical'
  | 'shoulders_trapezius'
  | 'chest_ribs'
  | 'upper_back'
  | 'lower_back'
  | 'abdomen'
  | 'arms_elbows'
  | 'wrists_hands'
  | 'hips_glutes'
  | 'thighs_knees'
  | 'calves_ankles';

export interface BodyZoneMeta {
  id: BodyZoneId;
  label: string;
  shortLabel: string;
  emoji: string;
  view: 'front' | 'back' | 'both';
  clinicalNote: string;
  acrWeight: number; // Equivalent count in the 19-region ACR Widespread Pain Index (WPI)
}

export interface DailyRecord {
  pain: number; // 0 - 10
  spoons: number; // 1 - 5 (Spoon Theory energy battery)
  sleep: SleepQuality;
  fog: FogLevel;
  triggers: TriggerKey[];
  bodyZones: BodyZoneId[];
  painQualities: PainQualityKey[];
  reliefActions: ReliefActionKey[];
  notes: string;
}

export type RecordsMap = Record<string, DailyRecord>;

export interface MedicationItem {
  id: string;
  name: string;
  frequency: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  doctorName?: string;
  continuousMedications?: string[];
}
