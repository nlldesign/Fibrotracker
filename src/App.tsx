import React, { useEffect } from 'react';
import { useFibroStore } from './store/useFibroStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/layout/Toast';
import { WelcomeAuthPage } from './components/auth/WelcomeAuthPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { CheckinPage } from './pages/CheckinPage';
import { CalendarPage } from './pages/CalendarPage';
import { InsightsPage } from './pages/InsightsPage';
import { ReportsPage } from './pages/ReportsPage';
import { getSupabaseClient } from './lib/supabaseClient';

export const App: React.FC = () => {
  const {
    currentPage,
    theme,
    user,
    authChecked,
    guestAccessAllowed,
    setUser,
    setAuthChecked,
    syncWithCloud,
  } = useFibroStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Restore Supabase Auth session automatically
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email,
          fullName: data.session.user.user_metadata?.full_name,
        });
        syncWithCloud();
      }
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name,
        });
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setUser, setAuthChecked, syncWithCloud]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rosebrand-50/40 dark:bg-zinc-950">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rosebrand-500 text-white flex items-center justify-center text-2xl mx-auto animate-pulse">
            🌸
          </div>
          <p className="text-xs font-bold text-rosebrand-600 dark:text-rosebrand-400">
            Carregando seu Diário FibroCare...
          </p>
        </div>
      </div>
    );
  }

  // First Screen Gate: Ask user to create account / login before continuing
  if (!user && !guestAccessAllowed) {
    return (
      <>
        <WelcomeAuthPage />
        <Toast />
      </>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {currentPage === 'checkin' && <CheckinPage />}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'insights' && <InsightsPage />}
        {currentPage === 'reports' && <ReportsPage />}
      </main>
      <BottomNav />
      <SettingsModal />
      <Toast />
    </div>
  );
};
export default App;
