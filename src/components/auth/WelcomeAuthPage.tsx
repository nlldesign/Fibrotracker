import React, { useState } from 'react';
import { useFibroStore } from '../../store/useFibroStore';
import { getSupabaseClient } from '../../lib/supabaseClient';

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
        updatePatientMeta({
          patientName: cleanName,
          doctorName: doctorName.trim(),
          continuousMedications: continuousMedications.trim(),
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
            continuous_medications: continuousMedications
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
    <div className="min-h-screen bg-gradient-to-br from-rosebrand-50 via-white to-rosebrand-100/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rosebrand-400 to-rosebrand-500 flex items-center justify-center text-white shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">FibroCare</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Monitor Cíclico, Mapa Corporal & Relatórios Médicos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 text-rosebrand-600 dark:text-amber-400 border border-rosebrand-100 dark:border-zinc-800 shadow-sm"
          title="Alternar tema claro/escuro"
        >
          🌗
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Pitch: Clinical Value */}
        <div className="lg:col-span-6 space-y-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rosebrand-100 text-rosebrand-700 dark:bg-rosebrand-950 dark:text-rosebrand-300">
            🌸 Diário Clínico Inteligente
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
            Compreenda o ciclo da sua dor, antecipe crises e leve relatórios claros ao seu médico.
          </h2>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Crie sua conta gratuita para iniciar seu diário em branco, armazenar seus registros com
            segurança e acompanhar sua evolução ao longo do tratamento.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
              <span className="text-lg">🧍‍♀️</span>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                Mapa Corporal & Colheres 🥄
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Registre onde dói, o tipo da dor (queimação, formigamento, peso) e sua bateria diária
                de energia em menos de 30 segundos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-rosebrand-100 dark:border-zinc-800 shadow-sm">
              <span className="text-lg">📊</span>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                Relatório Médico por Período
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Exporte a evolução de 7, 30, 90 dias ou datas personalizadas com índices ACR (WPI e
                SSS) e uso de medicação SOS.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Card: Account Creation before continuing */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-rosebrand-100 dark:border-zinc-800 shadow-xl">
          <div className="mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rosebrand-500 dark:text-rosebrand-400">
              Acesso Pessoal
            </span>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {mode === 'signup'
                ? 'Crie sua conta para começar'
                : 'Entre na sua conta FibroCare'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Seu histórico é salvo automaticamente e protegido na sua conta.
            </p>
          </div>

          {/* Toggle Signup / Login */}
          <div className="grid grid-cols-2 gap-1.5 bg-rosebrand-50/80 dark:bg-zinc-800 p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition ${
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
              className={`py-2.5 rounded-xl text-xs font-bold transition ${
                mode === 'login'
                  ? 'bg-rosebrand-500 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Já Tenho Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Digite seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rosebrand-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Médico(a) / Reumatologista (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do(a) médico(a)"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Medicação Contínua (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Se utilizar alguma medicação"
                      value={continuousMedications}
                      onChange={(e) => setContinuousMedications(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Seu E-mail *
              </label>
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rosebrand-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Senha de Acesso *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-rosebrand-50/30 dark:bg-zinc-800 border border-rosebrand-200 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rosebrand-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rosebrand-50 dark:bg-rosebrand-950/50 border border-rosebrand-200 dark:border-rosebrand-800 text-xs text-rosebrand-700 dark:text-rosebrand-300 font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rosebrand-500 hover:bg-rosebrand-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-rosebrand-200 dark:shadow-none transition text-xs sm:text-sm uppercase tracking-wider"
            >
              {loading
                ? 'Acessando...'
                : mode === 'signup'
                ? 'Criar Conta e Iniciar Diário →'
                : 'Entrar no Meu Diário →'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-rosebrand-50 dark:border-zinc-800 text-center text-[11px] text-zinc-400">
            <span>🔒 Seus dados de saúde são privados e protegidos (LGPD)</span>
          </div>
        </div>
      </div>

      <footer className="max-w-5xl w-full mx-auto text-center text-[11px] text-zinc-400">
        FibroCare • Ferramenta de apoio ao autogerenciamento e comunicação médico-paciente
      </footer>
    </div>
  );
};
