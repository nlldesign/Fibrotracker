import React, { useState } from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import { getSupabaseClient } from '../../lib/supabaseClient';
import {
  AlertTriangle,
  Flower2,
  Heart,
  Moon,
  ShieldCheck,
  Sun,
} from '../common/ClinicalIcons';

export const WelcomeAuthPage: React.FC = () => {
  const { setUser, syncWithCloud, updatePatientMeta, toggleTheme } = useFibroStore();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [continuousMedications, setContinuousMedications] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Cliente Supabase não configurado.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cleanName = fullName.trim() || email.split('@')[0];
        const medStr = continuousMedications.trim();
        updatePatientMeta({
          patientName: cleanName,
          doctorName: doctorName.trim(),
          continuousMedications: medStr,
          medicationsList: medStr
            ? [{ id: `med_${Date.now()}`, name: medStr, frequency: '' }]
            : [],
        });

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: cleanName },
          },
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: cleanName,
            doctor_name: doctorName.trim() || null,
            continuous_medications: medStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          });

          setUser({
            id: data.user.id,
            email: data.user.email,
            fullName: cleanName,
            doctorName: doctorName.trim(),
          });
          await syncWithCloud();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          const userFullName =
            data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '';
          updatePatientMeta({ patientName: userFullName });
          setUser({
            id: data.user.id,
            email: data.user.email,
            fullName: userFullName,
          });
          await syncWithCloud();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível concluir a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rosebrand-50 via-white to-rosebrand-100/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar Mobile-Friendly */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rosebrand-400 to-rosebrand-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              FibroCare
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Diário Cíclico & Relatórios
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-amber-400 border border-rosebrand-100 dark:border-zinc-800 shadow-sm"
          title="Alternar tema claro/escuro"
        >
          <Sun className="w-4 h-4 hidden dark:block" />
          <Moon className="w-4 h-4 block dark:hidden" />
        </button>
      </div>

      {/* Main Form Card Mobile-First */}
      <div className="max-w-md w-full mx-auto my-4 sm:my-6 bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-rosebrand-100 dark:border-zinc-800 shadow-xl">
        {/* Header & Badges (Fixed Dark Mode Contrast) */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rosebrand-100 text-rosebrand-800 dark:bg-rosebrand-950 dark:border dark:border-rosebrand-800/70 dark:text-rosebrand-200">
            <Flower2 className="w-3.5 h-3.5 text-rosebrand-500 dark:text-rosebrand-300 shrink-0" />
            <span>Diário Clínico Inteligente</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white mt-2.5">
            {mode === 'signup' ? 'Crie sua conta para começar' : 'Acesse seu diário'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Seus registros ficam salvos com segurança para gerar laudos ao seu médico.
          </p>
        </div>

        {/* Toggle Signup / Login */}
        <div className="grid grid-cols-2 gap-1 bg-rosebrand-50/80 dark:bg-zinc-800 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              mode === 'signup'
                ? 'bg-rosebrand-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Criar Minha Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              mode === 'login'
                ? 'bg-rosebrand-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Já Tenho Conta
          </button>
        </div>

        {/* Form with Clean * Labels */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rosebrand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1">
                  Médico(a) / Reumatologista
                </label>
                <input
                  type="text"
                  placeholder="Nome do(a) médico(a)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1">
                  Medicação Contínua
                </label>
                <input
                  type="text"
                  placeholder="Se utilizar medicação contínua"
                  value={continuousMedications}
                  onChange={(e) => setContinuousMedications(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rosebrand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1">
              Senha *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mínimo de 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rosebrand-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rosebrand-50 dark:bg-rosebrand-950/80 border border-rosebrand-200 dark:border-rosebrand-800 text-xs text-rosebrand-700 dark:text-rosebrand-200 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-rosebrand-500 hover:bg-rosebrand-600 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl shadow-md shadow-rosebrand-200 dark:shadow-none transition text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center"
          >
            {loading
              ? 'Conectando...'
              : mode === 'signup'
              ? 'Criar Conta e Iniciar Diário →'
              : 'Entrar no Meu Diário →'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-rosebrand-50 dark:border-zinc-800 text-center text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Dados protegidos e privados (LGPD)</span>
        </div>
      </div>

      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-zinc-400 pb-2">
        FibroCare • Apoio ao autogerenciamento da Fibromialgia
      </footer>
    </div>
  );
};
