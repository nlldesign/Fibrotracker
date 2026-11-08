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
  fetchAccountRecordsFromSupabase,
  fetchUserProfileFromSupabase,
  upsertSingleRecordToSupabase,
  upsertUserProfileToSupabase,
} from '../services/recordsSyncService';
import { getSupabaseClient } from '../lib/supabaseClient';

const STORAGE_KEY = 'fibrocare_records_v2';
const THEME_KEY = 'fibro_theme';
const PATIENT_META_KEY = 'fibrocare_patient_meta_v2';
const CHECKIN_MODE_KEY = 'fibro_checkin_default_mode';
const ACTIVE_USER_KEY = 'fibrocare_active_user_id';
const PENDING_RECORDS_KEY = 'fibrocare_pending_records_v2';
const PENDING_PROFILE_KEY = 'fibrocare_pending_profile_v2';

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

const EMPTY_PATIENT_META: PatientLocalMeta = {
  patientName: '',
  doctorName: '',
  continuousMedications: '',
  medicationsList: [],
  clinicalExams: '',
};

function getPendingRecordDates(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addPendingRecordDate(dateKey: string): void {
  try {
    const current = new Set(getPendingRecordDates());
    current.add(dateKey);
    localStorage.setItem(PENDING_RECORDS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

function removePendingRecordDate(dateKey: string): void {
  try {
    const current = getPendingRecordDates().filter((d) => d !== dateKey);
    if (current.length === 0) {
      localStorage.removeItem(PENDING_RECORDS_KEY);
    } else {
      localStorage.setItem(PENDING_RECORDS_KEY, JSON.stringify(current));
    }
  } catch {
    // ignore
  }
}

function clearAllUserLocalCache(): void {
  try {
    localStorage.removeItem(ACTIVE_USER_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PATIENT_META_KEY);
    localStorage.removeItem(PENDING_RECORDS_KEY);
    localStorage.removeItem(PENDING_PROFILE_KEY);
  } catch {
    // ignore
  }
}

function loadPatientMeta(): PatientLocalMeta {
  try {
    const activeUserId = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUserId) return { ...EMPTY_PATIENT_META };

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
  return { ...EMPTY_PATIENT_META };
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
    // Only restore cached records if they belong to an explicitly identified active user session
    const activeUserId = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUserId) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }

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
  resetForNewAccount: (user: UserProfile, initialMeta: PatientLocalMeta) => void;
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

    const { user, patientMeta } = get();
    if (user?.id) {
      localStorage.setItem(PENDING_PROFILE_KEY, '1');
      upsertUserProfileToSupabase(user.id, patientMeta, mode).then(({ error }) => {
        if (!error) {
          localStorage.removeItem(PENDING_PROFILE_KEY);
        }
      });
    }
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
    addPendingRecordDate(dateKey);
    set({ records: updated });

    const { user } = get();
    if (user?.id) {
      upsertSingleRecordToSupabase(user.id, dateKey, record).then(({ error }) => {
        if (!error) {
          removePendingRecordDate(dateKey);
          set({
            lastSyncedAt: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        } else {
          get().showToast(
            'Salvo no aparelho (sem rede). Sincronizará automaticamente ao reconectar.'
          );
        }
      });
    }
  },

  deleteRecord: (dateKey) => {
    const updated = { ...get().records };
    delete updated[dateKey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    removePendingRecordDate(dateKey);
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

  setUser: (user) => {
    if (!user) {
      clearAllUserLocalCache();
      set({
        user: null,
        records: {},
        patientMeta: { ...EMPTY_PATIENT_META },
      });
      return;
    }

    const previousUserId = localStorage.getItem(ACTIVE_USER_KEY);
    if (previousUserId !== user.id) {
      // Strictly isolate accounts: wipe any cached data from previous account/test
      clearAllUserLocalCache();
      localStorage.setItem(ACTIVE_USER_KEY, user.id);
      set({
        user,
        records: {},
        patientMeta: {
          ...EMPTY_PATIENT_META,
          patientName: user.fullName || user.email?.split('@')[0] || '',
          doctorName: user.doctorName || '',
        },
      });
      return;
    }

    set({ user });
  },

  resetForNewAccount: (user, initialMeta) => {
    clearAllUserLocalCache();
    localStorage.setItem(ACTIVE_USER_KEY, user.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    localStorage.setItem(PATIENT_META_KEY, JSON.stringify(initialMeta));
    set({
      user,
      records: {},
      patientMeta: initialMeta,
      lastSyncedAt: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  },

  setAuthChecked: (checked) => set({ authChecked: checked }),

  syncWithCloud: async () => {
    const { user, records, patientMeta, checkinDefaultMode } = get();
    if (!user?.id) return;

    set({ isSyncing: true });

    // 1. Check if this exact same user had any offline pending changes to flush first
    const isSameActiveUser = localStorage.getItem(ACTIVE_USER_KEY) === user.id;
    const pendingDates = isSameActiveUser ? getPendingRecordDates() : [];
    const pendingRecordsMap: RecordsMap = {};
    pendingDates.forEach((dateKey) => {
      if (records[dateKey]) {
        pendingRecordsMap[dateKey] = records[dateKey];
      }
    });

    if (isSameActiveUser && localStorage.getItem(PENDING_PROFILE_KEY) === '1') {
      const { error: flushProfErr } = await upsertUserProfileToSupabase(
        user.id,
        patientMeta,
        checkinDefaultMode
      );
      if (!flushProfErr) {
        localStorage.removeItem(PENDING_PROFILE_KEY);
      }
    }

    // 2. Flush pending records (if any) and fetch authoritative data from Supabase
    const [recordsResult, profileResult] = await Promise.all([
      fetchAccountRecordsFromSupabase(user.id, pendingRecordsMap),
      fetchUserProfileFromSupabase(user.id, user.email),
    ]);

    set({ isSyncing: false });

    localStorage.setItem(ACTIVE_USER_KEY, user.id);

    if (recordsResult.flushedPending) {
      localStorage.removeItem(PENDING_RECORDS_KEY);
    }

    if (!recordsResult.error) {
      // Keep any still-unflushed offline records for this same user so nothing is ever lost
      const remainingPendingDates = getPendingRecordDates();
      const finalRecords: RecordsMap = { ...recordsResult.cloudRecords };
      if (isSameActiveUser && remainingPendingDates.length > 0) {
        remainingPendingDates.forEach((dateKey) => {
          if (records[dateKey]) {
            finalRecords[dateKey] = records[dateKey];
          }
        });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalRecords));
      set({
        records: finalRecords,
        lastSyncedAt: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    if (
      !profileResult.error &&
      profileResult.profile &&
      localStorage.getItem(PENDING_PROFILE_KEY) !== '1'
    ) {
      const { checkinDefaultMode: cloudMode, ...cloudMeta } = profileResult.profile;
      localStorage.setItem(PATIENT_META_KEY, JSON.stringify(cloudMeta));
      localStorage.setItem(CHECKIN_MODE_KEY, cloudMode);
      set({
        patientMeta: cloudMeta,
        checkinDefaultMode: cloudMode,
        checkinActiveMode: cloudMode,
      });
    }
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearAllUserLocalCache();
    set({
      user: null,
      records: {},
      patientMeta: { ...EMPTY_PATIENT_META },
      lastSyncedAt: null,
      isSettingsModalOpen: false,
    });
    get().showToast('Sessão encerrada.');
  },

  updatePatientMeta: (meta) => {
    const next = { ...get().patientMeta, ...meta };
    localStorage.setItem(PATIENT_META_KEY, JSON.stringify(next));
    set({ patientMeta: next });

    const { user, checkinDefaultMode } = get();
    if (user?.id) {
      localStorage.setItem(PENDING_PROFILE_KEY, '1');
      upsertUserProfileToSupabase(user.id, next, checkinDefaultMode).then(({ error }) => {
        if (!error) {
          localStorage.removeItem(PENDING_PROFILE_KEY);
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
