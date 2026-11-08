import React, { useState } from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import {
  clearSupabaseCredentialsFromLocal,
  getSupabaseClient,
  getSupabaseCredentials,
  saveSupabaseCredentialsToLocal,
} from '../../lib/supabaseClient';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    user,
    setUser,
    syncWithCloud,
    isSyncing,
    lastSyncedAt,
    signOut,
    showToast,
  } = useFibroStore();

  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [showConfig, setShowConfig] = useState(initialCreds.source === 'none');

  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isConfigured = Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setFeedback('Preencha a URL do projeto e a Anon Key pública.');
      return;
    }
    saveSupabaseCredentialsToLocal(supabaseUrl, supabaseAnonKey);
    setShowConfig(false);
    setFeedback(null);
    showToast('Conexão Supabase salva! Agora você pode criar sua conta.');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (showConfig) {
      saveSupabaseCredentialsToLocal(supabaseUrl, supabaseAnonKey);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedback('Configure primeiro a URL e a Anon Key do seu projeto Supabase.');
      setShowConfig(true);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setFeedback('✨ Link mágico enviado! Verifique a caixa de entrada do seu e-mail.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split('@')[0] },
          },
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            fullName: fullName || data.user.user_metadata?.full_name,
          });
          await syncWithCloud();
          setAuthModalOpen(false);
        } else {
          setFeedback('Conta criada! Verifique seu e-mail caso a confirmação esteja ativa.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name,
          });
          await syncWithCloud();
          setAuthModalOpen(false);
        }
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Erro ao autenticar no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-rosebrand-100 dark:border-zinc-800 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition"
        >
          ✕
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-300 flex items-center justify-center text-xl">
            ☁️
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
              Sincronização em Nuvem & Backup
            </span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Conta FibroCare + Supabase
            </h3>
          </div>
        </div>

        {/* If user is already logged in */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    🟢 Conectada na Nuvem
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
                {lastSyncedAt && (
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Sync: {lastSyncedAt}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={isSyncing}
                onClick={syncWithCloud}
                className="flex-1 bg-rosebrand-500 hover:bg-rosebrand-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition"
              >
                {isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Agora'}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="py-3 px-4 rounded-2xl border border-rosebrand-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-rosebrand-50 dark:hover:bg-zinc-800 transition"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Connection Status Pill */}
            <div className="mb-4 flex items-center justify-between bg-rosebrand-50/50 dark:bg-zinc-800/60 px-3.5 py-2.5 rounded-2xl border border-rosebrand-100 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {isConfigured
                    ? 'Projeto Supabase conectado'
                    : 'Aguardando credenciais do projeto Supabase'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[11px] font-bold text-rosebrand-600 dark:text-rosebrand-400 underline"
              >
                {showConfig ? 'Ocultar Chaves' : 'Configurar Chaves'}
              </button>
            </div>

            {/* Step 1: Supabase Project URL & Anon Key setup */}
            {showConfig && (
              <form
                onSubmit={handleSaveCredentials}
                className="mb-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-rosebrand-200 dark:border-zinc-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-rosebrand-600 dark:text-rosebrand-400">
                    1. Conectar seu Projeto Supabase
                  </span>
                  {initialCreds.source === 'local' && (
                    <button
                      type="button"
                      onClick={() => {
                        clearSupabaseCredentialsFromLocal();
                        setSupabaseUrl('');
                        setSupabaseAnonKey('');
                      }}
                      className="text-[10px] text-zinc-400 hover:text-rose-500 underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No painel do Supabase, vá em <strong>Project Settings → API</strong> e cole a URL e
                  a chave <code>anon public</code> (ou defina no arquivo <code>.env</code>).
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                    Project URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                    Anon Public Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-rosebrand-200 dark:border-zinc-700 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition"
                >
                  Salvar Conexão da API
                </button>
              </form>
            )}

            {/* Step 2: Login / Signup Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-rosebrand-50/70 dark:bg-zinc-800 p-1 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'login'
                    ? 'bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-rosebrand-400 shadow-sm'
                    : 'text-zinc-500'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-rosebrand-400 shadow-sm'
                    : 'text-zinc-500'
                }`}
              >
                Criar Conta
              </button>
              <button
                type="button"
                onClick={() => setMode('magic')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'magic'
                    ? 'bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-rosebrand-400 shadow-sm'
                    : 'text-zinc-500'
                }`}
              >
                Link Mágico
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Clara"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm"
                />
              </div>

              {mode !== 'magic' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm"
                  />
                </div>
              )}

              {feedback && (
                <div className="p-3 rounded-xl bg-rosebrand-50 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs text-rosebrand-700 dark:text-rosebrand-300">
                  {feedback}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rosebrand-500 hover:bg-rosebrand-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-rosebrand-200 dark:shadow-none transition text-xs uppercase tracking-wider"
              >
                {loading
                  ? 'Conectando...'
                  : mode === 'login'
                  ? 'Entrar e Sincronizar Registros'
                  : mode === 'signup'
                  ? 'Criar Conta & Salvar na Nuvem'
                  : 'Enviar Link Mágico por E-mail'}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
              🔒 Seus registros já feitos neste aparelho serão mesclados automaticamente na sua
              conta protegida por Row Level Security (LGPD).
            </p>
          </>
        )}
      </div>
    </div>
  );
};
