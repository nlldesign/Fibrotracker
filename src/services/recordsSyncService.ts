import { getSupabaseClient } from '../lib/supabaseClient';
import { classifyRecord } from '../domain/riskEngine';
import { CheckinMode, DailyRecord, MedicationItem, RecordsMap } from '../types/record';

interface DbRecordRow {
  record_date: string;
  pain: number;
  spoons: number;
  sleep: DailyRecord['sleep'];
  fog: DailyRecord['fog'];
  body_zones: DailyRecord['bodyZones'];
  pain_qualities: DailyRecord['painQualities'];
  triggers: DailyRecord['triggers'];
  relief_actions: DailyRecord['reliefActions'];
  cycle_status: string;
  notes: string;
}

export interface CloudProfileData {
  patientName: string;
  doctorName: string;
  continuousMedications: string;
  medicationsList: MedicationItem[];
  clinicalExams: string;
  checkinDefaultMode: CheckinMode;
}

/**
 * Flushes any pending offline records belonging to the exact same userId to Supabase
 * before fetching the authoritative list from public.daily_records.
 */
export async function fetchAccountRecordsFromSupabase(
  userId: string,
  pendingOfflineRecords?: RecordsMap
): Promise<{ cloudRecords: RecordsMap; flushedPending: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      cloudRecords: {},
      flushedPending: false,
      error: 'Cliente Supabase não configurado.',
    };
  }

  try {
    let flushedPending = false;

    // 1. If this same user had records saved while offline, flush them to Supabase first
    if (pendingOfflineRecords && Object.keys(pendingOfflineRecords).length > 0) {
      const rowsToUpsert = Object.entries(pendingOfflineRecords).map(([dateKey, rec]) => ({
        user_id: userId,
        record_date: dateKey,
        pain: rec.pain,
        spoons: rec.spoons ?? 3,
        sleep: rec.sleep,
        fog: rec.fog,
        body_zones: rec.bodyZones || [],
        pain_qualities: rec.painQualities || [],
        triggers: rec.triggers || [],
        relief_actions: rec.reliefActions || [],
        cycle_status: classifyRecord(rec) || 'green',
        notes: rec.notes || '',
        updated_at: new Date().toISOString(),
      }));

      const { error: flushError } = await supabase
        .from('daily_records')
        .upsert(rowsToUpsert, { onConflict: 'user_id,record_date' });

      if (!flushError) {
        flushedPending = true;
      }
    }

    // 2. Fetch authoritative records for this user_id from Supabase
    const { data: cloudRows, error: fetchError } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      return { cloudRecords: {}, flushedPending, error: fetchError.message };
    }

    const cloudMap: RecordsMap = {};
    (cloudRows as DbRecordRow[] | null)?.forEach((row) => {
      cloudMap[row.record_date] = {
        pain: row.pain ?? 2,
        spoons: row.spoons ?? 3,
        sleep: row.sleep || 'bom',
        fog: row.fog || 'claro',
        bodyZones: row.body_zones || [],
        painQualities: row.pain_qualities || [],
        triggers: row.triggers || [],
        reliefActions: row.relief_actions || [],
        notes: row.notes || '',
      };
    });

    return { cloudRecords: cloudMap, flushedPending };
  } catch (err: any) {
    return {
      cloudRecords: {},
      flushedPending: false,
      error: err?.message || 'Erro ao buscar registros do Supabase.',
    };
  }
}

/**
 * Fetches the authenticated user's profile (including + Remédios list and Clinical Exams)
 * from public.profiles.
 */
export async function fetchUserProfileFromSupabase(
  userId: string,
  fallbackEmail?: string
): Promise<{ profile: CloudProfileData | null; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profile: null, error: 'Cliente Supabase não configurado.' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'full_name, doctor_name, continuous_medications, medications_list, clinical_exams, checkin_default_mode'
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }

    if (!data) {
      return { profile: null };
    }

    const rawMedsArray = Array.isArray(data.continuous_medications)
      ? (data.continuous_medications as string[])
      : [];
    const continuousStr = rawMedsArray.join(', ');

    let parsedMedsList: MedicationItem[] = [];
    if (Array.isArray(data.medications_list) && data.medications_list.length > 0) {
      parsedMedsList = data.medications_list
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any, idx: number) => ({
          id: String(item.id || `med_${idx}_${Date.now()}`),
          name: String(item.name || ''),
          frequency: String(item.frequency || ''),
        }));
    } else if (rawMedsArray.length > 0) {
      parsedMedsList = rawMedsArray.map((medName, idx) => ({
        id: `med_init_${idx}`,
        name: medName,
        frequency: '',
      }));
    }

    const mode: CheckinMode =
      data.checkin_default_mode === 'advanced' ? 'advanced' : 'simple';

    return {
      profile: {
        patientName: data.full_name || fallbackEmail?.split('@')[0] || '',
        doctorName: data.doctor_name || '',
        continuousMedications: continuousStr,
        medicationsList: parsedMedsList,
        clinicalExams: data.clinical_exams || '',
        checkinDefaultMode: mode,
      },
    };
  } catch (err: any) {
    return {
      profile: null,
      error: err?.message || 'Erro ao carregar perfil do Supabase.',
    };
  }
}

/**
 * Upserts the authenticated user's profile (patientName, doctorName, medicationsList,
 * clinicalExams, checkinDefaultMode) into public.profiles.
 */
export async function upsertUserProfileToSupabase(
  userId: string,
  meta: {
    patientName: string;
    doctorName: string;
    continuousMedications: string;
    medicationsList: MedicationItem[];
    clinicalExams: string;
  },
  checkinDefaultMode?: CheckinMode
): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const cleanedMedsList = (meta.medicationsList || [])
    .map((m) => ({
      id: m.id,
      name: m.name.trim(),
      frequency: m.frequency.trim(),
    }))
    .filter((m) => m.name.length > 0 || m.frequency.length > 0);

  const continuousArray =
    cleanedMedsList.length > 0
      ? cleanedMedsList.map((m) => (m.frequency ? `${m.name} (${m.frequency})` : m.name))
      : meta.continuousMedications
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

  const payload: Record<string, any> = {
    id: userId,
    full_name: meta.patientName.trim() || null,
    doctor_name: meta.doctorName.trim() || null,
    continuous_medications: continuousArray,
    medications_list: cleanedMedsList,
    clinical_exams: meta.clinicalExams || '',
    updated_at: new Date().toISOString(),
  };

  if (checkinDefaultMode) {
    payload.checkin_default_mode = checkinDefaultMode;
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  return { error: error?.message };
}

export async function upsertSingleRecordToSupabase(
  userId: string,
  dateKey: string,
  rec: DailyRecord
): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const { error } = await supabase.from('daily_records').upsert(
    {
      user_id: userId,
      record_date: dateKey,
      pain: rec.pain,
      spoons: rec.spoons ?? 3,
      sleep: rec.sleep,
      fog: rec.fog,
      body_zones: rec.bodyZones || [],
      pain_qualities: rec.painQualities || [],
      triggers: rec.triggers || [],
      relief_actions: rec.reliefActions || [],
      cycle_status: classifyRecord(rec) || 'green',
      notes: rec.notes || '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,record_date' }
  );

  return { error: error?.message };
}

export async function deleteSingleRecordFromSupabase(
  userId: string,
  dateKey: string
): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const { error } = await supabase
    .from('daily_records')
    .delete()
    .eq('user_id', userId)
    .eq('record_date', dateKey);

  return { error: error?.message };
}
