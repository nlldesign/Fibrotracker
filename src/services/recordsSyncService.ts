import { getSupabaseClient } from '../lib/supabaseClient';
import { classifyRecord } from '../domain/riskEngine';
import { DailyRecord, RecordsMap } from '../types/record';

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

export async function syncLocalRecordsToSupabase(
  userId: string,
  localRecords: RecordsMap
): Promise<{ mergedRecords: RecordsMap; syncedCount: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { mergedRecords: localRecords, syncedCount: 0, error: 'Cliente Supabase não configurado.' };
  }

  try {
    // 1. Fetch existing records from cloud
    const { data: cloudRows, error: fetchError } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      return { mergedRecords: localRecords, syncedCount: 0, error: fetchError.message };
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

    // 2. Merge: local records take precedence if not in cloud, or combine both
    const mergedRecords: RecordsMap = { ...localRecords, ...cloudMap };

    // 3. Upsert all merged records to Supabase so nothing from localStorage is lost
    const rowsToUpsert = Object.entries(mergedRecords).map(([dateKey, rec]) => ({
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

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('daily_records')
        .upsert(rowsToUpsert, { onConflict: 'user_id,record_date' });

      if (upsertError) {
        return { mergedRecords, syncedCount: 0, error: upsertError.message };
      }
    }

    return { mergedRecords, syncedCount: rowsToUpsert.length };
  } catch (err: any) {
    return {
      mergedRecords: localRecords,
      syncedCount: 0,
      error: err?.message || 'Erro ao sincronizar com o Supabase.',
    };
  }
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
