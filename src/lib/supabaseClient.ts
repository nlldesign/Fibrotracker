import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LS_URL_KEY = 'fibrocare_supabase_url';
const LS_ANON_KEY = 'fibrocare_supabase_anon_key';

const DEFAULT_PROJECT_URL = 'https://pgrrkkgzojmwasykoqod.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_DpK96CtQhtwq7toZruH_4g_Y0_Mru7K';

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
  source: 'env' | 'local' | 'none';
} {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (envUrl && envKey && !envUrl.includes('SEU_PROJETO')) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), source: 'env' };
  }

  const localUrl = localStorage.getItem(LS_URL_KEY);
  const localKey = localStorage.getItem(LS_ANON_KEY);

  if (localUrl && localKey) {
    return { url: localUrl.trim(), anonKey: localKey.trim(), source: 'local' };
  }

  return {
    url: DEFAULT_PROJECT_URL,
    anonKey: DEFAULT_PUBLISHABLE_KEY,
    source: 'env',
  };
}

export function saveSupabaseCredentialsToLocal(url: string, anonKey: string) {
  localStorage.setItem(LS_URL_KEY, url.trim());
  localStorage.setItem(LS_ANON_KEY, anonKey.trim());
  cachedClient = null;
}

export function clearSupabaseCredentialsFromLocal() {
  localStorage.removeItem(LS_URL_KEY);
  localStorage.removeItem(LS_ANON_KEY);
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  const configKey = `${url}::${anonKey}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    cachedConfigKey = configKey;
    return cachedClient;
  } catch {
    return null;
  }
}
