import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './stores/appStore';
import { Home, UtensilsCrossed, Dumbbell, CalendarDays, ClipboardCheck, Settings } from 'lucide-react';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import FoodPage from './pages/FoodPage';
import ExercisePage from './pages/ExercisePage';
import HistoryPage from './pages/HistoryPage';
import ChecklistPage from './pages/ChecklistPage';
import SettingsPage from './pages/SettingsPage';
import AchievementToast from './components/AchievementToast';

const tabs = [
  { id: 'home' as const, label: 'Pets', icon: Home },
  { id: 'food' as const, label: 'Food', icon: UtensilsCrossed },
  { id: 'exercise' as const, label: 'Exercise', icon: Dumbbell },
  { id: 'history' as const, label: 'History', icon: CalendarDays },
  { id: 'checklist' as const, label: 'Tasks', icon: ClipboardCheck },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

function BottomNav() {
  const { page, setPage } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-md border-t border-cream-dark px-2 pb-[env(safe-area-inset-bottom)] z-30">
      <div className="flex">
        {tabs.map((tab) => {
          const active = page === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 btn-press relative"
            >
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-0.5 w-8 h-1 rounded-full bg-terracotta"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={`transition-colors ${active ? 'text-terracotta' : 'text-brown-light'}`}
              />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-terracotta' : 'text-brown-light'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const { page, loading, loadProfiles } = useAppStore();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-3 border-cream-dark border-t-terracotta rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex flex-col"
        >
          {page === 'onboarding' && <OnboardingPage />}
          {page === 'home' && <HomePage />}
          {page === 'food' && <FoodPage />}
          {page === 'exercise' && <ExercisePage />}
          {page === 'history' && <HistoryPage />}
          {page === 'checklist' && <ChecklistPage />}
          {page === 'settings' && <SettingsPage />}
        </motion.div>
      </AnimatePresence>
      {page !== 'onboarding' && <BottomNav />}
      <AchievementToast />
    </>
  );
}
