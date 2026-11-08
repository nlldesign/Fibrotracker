import { create } from 'zustand';
import {
  CheckinMode,
  DailyRecord,
  MedicationItem,
  PageId,
  RecordsMap,
  UserProfile,
} from '../types/record';
import { formatDateKey } from '../domain/riskEngine';
import {
  deleteSingleRecordFromSupabase,
  syncLocalRecordsToSupabase,
  upsertSingleRecordToSupabase,
} from '../services/recordsSyncService';
import { getSupabaseClient } from '../lib/supabaseClient';

const STORAGE_KEY = 'fibrocare_records_v2';
const THEME_KEY = 'fibro_theme';
const PATIENT_META_KEY = 'fibrocare_patient_meta_v2';
const CHECKIN_MODE_KEY = 'fibro_checkin_default_mode';

// Clean up legacy demo localStorage keys so app starts completely empty
try {
  localStorage.removeItem('fibrocare_records_v1');
  localStorage.removeItem('fibrocare_patient_meta_v1');
} catch {
  // ignore
}

export interface PatientLocalMeta {
  patientName: string;
  doctorName: string;
  continuousMedications: string;
  medicationsList: MedicationItem[];
  clinicalExams: string;
}

export interface CustomReportRange {
  startDate: string;
  endDate: string;
}

function loadPatientMeta(): PatientLocalMeta {
  try {
    const saved = localStorage.getItem(PATIENT_META_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        patientName: parsed.patientName || '',
        doctorName: parsed.doctorName || '',
        continuousMedications: parsed.continuousMedications || '',
        medicationsList: Array.isArray(parsed.medicationsList) ? parsed.medicationsList : [],
        clinicalExams: parsed.clinicalExams || '',
      };
    }
  } catch {
    // ignore
  }
  return {
    patientName: '',
    doctorName: '',
    continuousMedications: '',
    medicationsList: [],
    clinicalExams: '',
  };
}

function loadInitialCheckinMode(): CheckinMode {
  try {
    const saved = localStorage.getItem(CHECKIN_MODE_KEY);
    if (saved === 'advanced' || saved === 'simple') return saved;
  } catch {
    // ignore
  }
  return 'simple';
}

function loadInitialRecords(): RecordsMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as RecordsMap;
      if (parsed && typeof parsed === 'object') {
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
    // ignore
  }
  return {};
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

  // Check-in Mode Preferences
  checkinDefaultMode: CheckinMode;
  checkinActiveMode: CheckinMode;

  // Auth & Settings State
  user: UserProfile | null;
  authChecked: boolean;
  isSettingsModalOpen: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  patientMeta: PatientLocalMeta;

  // Report Period Filter State
  reportDaysFilter: number;
  reportCustomRange: CustomReportRange | null;

  setPage: (page: PageId) => void;
  selectDay: (dateKey: string) => void;
  shiftSelectedDay: (offsetDays: number) => void;
  selectToday: () => void;
  navigateMonth: (direction: number) => void;
  goToCurrentMonth: () => void;

  setCheckinDefaultMode: (mode: CheckinMode) => void;
  setCheckinActiveMode: (mode: CheckinMode) => void;

  saveRecord: (dateKey: string, record: DailyRecord) => void;
  deleteRecord: (dateKey: string) => void;
  toggleTheme: () => void;
  showToast: (msg: string) => void;

  // Auth & Settings Actions
  setSettingsModalOpen: (open: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setAuthChecked: (checked: boolean) => void;
  syncWithCloud: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePatientMeta: (meta: Partial<PatientLocalMeta>) => void;

  // Report Actions
  setReportDaysFilter: (days: number) => void;
  setReportCustomRange: (range: CustomReportRange | null) => void;
  openReportForPeriod: (days: number, customRange?: CustomReportRange | null) => void;
}

const initialCheckinMode = loadInitialCheckinMode();

export const useFibroStore = create<FibroStore>((set, get) => ({
  currentPage: 'checkin',
  selectedDateStr: formatDateKey(new Date()),
  currentMonthDate: new Date(),
  records: loadInitialRecords(),
  theme: loadInitialTheme(),
  toastMessage: null,

  checkinDefaultMode: initialCheckinMode,
  checkinActiveMode: initialCheckinMode,

  user: null,
  authChecked: false,
  isSettingsModalOpen: false,
  isSyncing: false,
  lastSyncedAt: null,
  patientMeta: loadPatientMeta(),

  reportDaysFilter: 30,
  reportCustomRange: null,

  setPage: (page) => {
    set((state) => ({
      currentPage: page,
      checkinActiveMode: page === 'checkin' ? state.checkinDefaultMode : state.checkinActiveMode,
    }));
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

  setCheckinDefaultMode: (mode) => {
    localStorage.setItem(CHECKIN_MODE_KEY, mode);
    set({ checkinDefaultMode: mode, checkinActiveMode: mode });
  },

  setCheckinActiveMode: (mode) => {
    set({ checkinActiveMode: mode });
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
          set({
            lastSyncedAt: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
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

  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  setUser: (user) => set({ user }),
  setAuthChecked: (checked) => set({ authChecked: checked }),

  syncWithCloud: async () => {
    const { user, records } = get();
    if (!user?.id) return;

    set({ isSyncing: true });
    const { mergedRecords, error } = await syncLocalRecordsToSupabase(user.id, records);
    set({ isSyncing: false });

    if (error) {
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
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PATIENT_META_KEY);
    set({
      user: null,
      records: {},
      patientMeta: {
        patientName: '',
        doctorName: '',
        continuousMedications: '',
        medicationsList: [],
        clinicalExams: '',
      },
      lastSyncedAt: null,
      isSettingsModalOpen: false,
    });
    get().showToast('Sessão encerrada.');
  },

  updatePatientMeta: (meta) => {
    const next = { ...get().patientMeta, ...meta };
    localStorage.setItem(PATIENT_META_KEY, JSON.stringify(next));
    set({ patientMeta: next });
  },

  setReportDaysFilter: (days) => set({ reportDaysFilter: days, reportCustomRange: null }),
  setReportCustomRange: (range) => set({ reportCustomRange: range }),

  openReportForPeriod: (days, customRange = null) => {
    set({
      reportDaysFilter: days,
      reportCustomRange: customRange,
      currentPage: 'reports',
      isSettingsModalOpen: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
}));
