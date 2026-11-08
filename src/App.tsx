import React, { useEffect } from 'react';
import { useFibroStore } from './store/useFibroStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/layout/Toast';
import { AuthModal } from './components/auth/AuthModal';
import { CheckinPage } from './pages/CheckinPage';
import { CalendarPage } from './pages/CalendarPage';
import { InsightsPage } from './pages/InsightsPage';
import { ReportsPage } from './pages/ReportsPage';
import { getSupabaseClient } from './lib/supabaseClient';

export const App: React.FC = () => {
  const { currentPage, theme, setUser, syncWithCloud } = useFibroStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Restore Supabase Auth session automatically if configured
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email,
          fullName: data.session.user.user_metadata?.full_name,
        });
        syncWithCloud();
      }
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
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setUser, syncWithCloud]);

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
      <AuthModal />
      <Toast />
    </div>
  );
};
export default App;
