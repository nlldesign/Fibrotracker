import { create } from 'zustand';
import { DailyRecord, PageId, RecordsMap, UserProfile } from '../types/record';
import { createDemoSeedData, formatDateKey } from '../domain/riskEngine';
import {
  deleteSingleRecordFromSupabase,
  syncLocalRecordsToSupabase,
  upsertSingleRecordToSupabase,
} from '../services/recordsSyncService';
import { getSupabaseClient } from '../lib/supabaseClient';

const STORAGE_KEY = 'fibrocare_records_v1';
const THEME_KEY = 'fibro_theme';
const PATIENT_META_KEY = 'fibrocare_patient_meta_v1';

interface PatientLocalMeta {
  patientName: string;
  doctorName: string;
  continuousMedications: string;
}

function loadPatientMeta(): PatientLocalMeta {
  try {
    const saved = localStorage.getItem(PATIENT_META_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {
    patientName: '',
    doctorName: '',
    continuousMedications: 'Pregabalina 75mg, Duloxetina 60mg',
  };
}

function loadInitialRecords(): RecordsMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as RecordsMap;
      if (parsed && Object.keys(parsed).length > 0) {
        Object.keys(parsed).forEach((k) => {
          if (!Array.isArray(parsed[k].bodyZones)) parsed[k].bodyZones = [];
          if (!Array.isArray(parsed[k].painQualities)) parsed[k].painQualities = [];
          if (!Array.isArray(parsed[k].reliefActions)) parsed[k].reliefActions = [];
          if (typeof parsed[k].spoons !== 'number') parsed[k].spoons = 3;
        });
        return parsed;
      }
    }
  } catch {
    // Fallback to demo data
  }
  const seeded = createDemoSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function loadInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

interface FibroStore {
  currentPage: PageId;
  selectedDateStr: string;
  currentMonthDate: Date;
  records: RecordsMap;
  theme: 'light' | 'dark';
  toastMessage: string | null;

  // Auth & Cloud Sync State
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  patientMeta: PatientLocalMeta;

  setPage: (page: PageId) => void;
  selectDay: (dateKey: string) => void;
  shiftSelectedDay: (offsetDays: number) => void;
  selectToday: () => void;
  navigateMonth: (direction: number) => void;
  goToCurrentMonth: () => void;

  saveRecord: (dateKey: string, record: DailyRecord) => void;
  deleteRecord: (dateKey: string) => void;
  resetDemoData: () => void;
  toggleTheme: () => void;
  showToast: (msg: string) => void;

  // Auth & Cloud Actions
  setAuthModalOpen: (open: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  syncWithCloud: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePatientMeta: (meta: Partial<PatientLocalMeta>) => void;
}

export const useFibroStore = create<FibroStore>((set, get) => ({
  currentPage: 'checkin',
  selectedDateStr: formatDateKey(new Date()),
  currentMonthDate: new Date(),
  records: loadInitialRecords(),
  theme: loadInitialTheme(),
  toastMessage: null,

  user: null,
  isAuthModalOpen: false,
  isSyncing: false,
  lastSyncedAt: null,
  patientMeta: loadPatientMeta(),

  setPage: (page) => {
    set({ currentPage: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  selectDay: (dateKey) => {
    set({ selectedDateStr: dateKey });
  },

  shiftSelectedDay: (offsetDays) => {
    const { selectedDateStr } = get();
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d + offsetDays);
    set({
      selectedDateStr: formatDateKey(nextDate),
      currentMonthDate: new Date(nextDate.getFullYear(), nextDate.getMonth(), 1),
    });
  },

  selectToday: () => {
    const today = new Date();
    set({
      selectedDateStr: formatDateKey(today),
      currentMonthDate: new Date(today.getFullYear(), today.getMonth(), 1),
    });
  },

  navigateMonth: (direction) => {
    const { currentMonthDate } = get();
    const nextMonth = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + direction,
      1
    );
    set({ currentMonthDate: nextMonth });
  },

  goToCurrentMonth: () => {
    const today = new Date();
    set({
      currentMonthDate: new Date(today.getFullYear(), today.getMonth(), 1),
      selectedDateStr: formatDateKey(today),
    });
  },

  saveRecord: (dateKey, record) => {
    const updated = {
      ...get().records,
      [dateKey]: record,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ records: updated });

    const { user } = get();
    if (user?.id) {
      upsertSingleRecordToSupabase(user.id, dateKey, record).then(({ error }) => {
        if (!error) {
          set({ lastSyncedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
        }
      });
    }
  },

  deleteRecord: (dateKey) => {
    const updated = { ...get().records };
    delete updated[dateKey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ records: updated });

    const { user } = get();
    if (user?.id) {
      deleteSingleRecordFromSupabase(user.id, dateKey);
    }
  },

  resetDemoData: () => {
    const demo = createDemoSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    const today = new Date();
    set({
      records: demo,
      selectedDateStr: formatDateKey(today),
      currentMonthDate: new Date(today.getFullYear(), today.getMonth(), 1),
    });
    get().showToast('Dados de demonstração restaurados!');
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2800);
  },

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  setUser: (user) => set({ user }),

  syncWithCloud: async () => {
    const { user, records, showToast } = get();
    if (!user?.id) return;

    set({ isSyncing: true });
    const { mergedRecords, syncedCount, error } = await syncLocalRecordsToSupabase(
      user.id,
      records
    );
    set({ isSyncing: false });

    if (error) {
      showToast(`Aviso Supabase: ${error}`);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
    set({
      records: mergedRecords,
      lastSyncedAt: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    showToast(`☁️ ${syncedCount} registros sincronizados na nuvem!`);
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, lastSyncedAt: null });
    get().showToast('Sessão encerrada (dados locais mantidos).');
  },

  updatePatientMeta: (meta) => {
    const next = { ...get().patientMeta, ...meta };
    localStorage.setItem(PATIENT_META_KEY, JSON.stringify(next));
    set({ patientMeta: next });
  },
}));
