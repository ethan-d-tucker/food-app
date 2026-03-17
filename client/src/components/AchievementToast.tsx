import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export default function AchievementToast() {
  const { newAchievement, clearNewAchievement } = useAppStore();

  useEffect(() => {
    if (newAchievement) {
      const t = setTimeout(clearNewAchievement, 4000);
      return () => clearTimeout(t);
    }
  }, [newAchievement, clearNewAchievement]);

  return (
    <AnimatePresence>
      {newAchievement && (
        <motion.div
          initial={{ opacity: 0, y: -60, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -60, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-12 left-1/2 z-50 bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3 max-w-[350px]"
          onClick={clearNewAchievement}
        >
          <span className="text-2xl">{newAchievement.icon}</span>
          <div>
            <p className="font-heading font-bold text-sm text-brown">{newAchievement.name}</p>
            <p className="text-[11px] text-brown-light">{newAchievement.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
