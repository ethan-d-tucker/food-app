import { motion, AnimatePresence } from 'framer-motion';

export default function LevelUpOverlay({ level, visible, onDismiss }: { level: number; visible: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center bg-brown/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-3xl p-8 text-center shadow-lg max-w-xs mx-4"
          >
            {/* Sparkle decorations */}
            <div className="relative mb-2">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], x: Math.cos(i * 60 * Math.PI / 180) * 50, y: Math.sin(i * 60 * Math.PI / 180) * 50 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-mustard"
                />
              ))}
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-5xl font-bold text-terracotta font-heading"
              >
                {level}
              </motion.p>
            </div>
            <h2 className="font-heading font-bold text-xl text-brown mb-1">Level Up!</h2>
            <p className="text-sm text-brown-light mb-1">Your critter reached level {level}!</p>
            <p className="text-xs text-sage font-medium">+1 treat earned</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              className="mt-4 px-6 py-2 rounded-xl bg-terracotta text-white font-heading font-bold text-sm"
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
