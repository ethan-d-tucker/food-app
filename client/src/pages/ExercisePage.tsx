import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { commonExercises, type ExerciseItem } from '../data/exercises';
import { Plus, Search, X, Trash2 } from 'lucide-react';

function AddExerciseModal({ onClose }: { onClose: () => void }) {
  const { addExercise } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');

  const filtered = search.trim()
    ? commonExercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12)
    : commonExercises.slice(0, 12);

  const estimatedCalories = selectedExercise
    ? Math.round(selectedExercise.caloriesPerMinute * Number(duration || 0) * (intensity === 'intense' ? 1.3 : intensity === 'light' ? 0.7 : 1))
    : 0;

  const handleAdd = async () => {
    if (!selectedExercise || !duration) return;
    await addExercise({
      name: selectedExercise.name,
      exercise_type: selectedExercise.type,
      duration_minutes: Number(duration),
      calories_burned: estimatedCalories,
      intensity,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-cream w-full max-w-[430px] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-brown">Add Exercise</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cream-dark btn-press">
            <X size={20} className="text-brown-light" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..." autoFocus
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-sage outline-none text-brown"
          />
        </div>

        {/* Exercise list */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
          {filtered.map((ex) => (
            <button
              key={ex.name}
              onClick={() => {
                setSelectedExercise(ex);
                setIntensity(ex.defaultIntensity);
              }}
              className={`w-full text-left p-3 rounded-xl transition-colors btn-press ${
                selectedExercise?.name === ex.name ? 'bg-sage/10 border-2 border-sage' : 'bg-white border-2 border-transparent'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-brown text-sm">{ex.name}</span>
                <span className="text-sage text-xs capitalize">{ex.type}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedExercise && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-brown-light mb-1 block">Duration (minutes)</label>
              <input
                type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-cream-dark focus:border-sage outline-none text-brown text-center text-lg font-bold"
              />
            </div>

            {/* Intensity */}
            <div>
              <label className="text-sm font-medium text-brown-light mb-1 block">Intensity</label>
              <div className="flex gap-2">
                {(['light', 'moderate', 'intense'] as const).map((i) => (
                  <button
                    key={i}
                    onClick={() => setIntensity(i)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium btn-press transition-colors ${
                      intensity === i ? 'bg-sage text-white' : 'bg-white text-brown-light'
                    }`}
                  >
                    {i.charAt(0).toUpperCase() + i.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated calories */}
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-sage">{estimatedCalories}</p>
              <p className="text-xs text-brown-light">estimated calories burned</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleAdd}
          disabled={!selectedExercise || !duration}
          className="w-full mt-4 py-3 rounded-2xl bg-sage text-white font-heading font-bold text-lg btn-press disabled:opacity-40 transition-opacity"
        >
          Log Exercise
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function ExercisePage() {
  const { exerciseEntries, loadExercise, deleteExercise, loadSummary, summary } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadExercise();
    loadSummary();
  }, [loadExercise, loadSummary]);

  const handleClose = () => {
    setShowAdd(false);
    loadExercise();
    loadSummary();
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      <h1 className="font-heading text-2xl font-bold text-brown mb-4">Exercise Log</h1>

      {/* Daily Summary */}
      {summary && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm text-brown-light">Today's Exercise</span>
            <span className="text-xs text-brown-light">{summary.goals.exercise_goal} min goal</span>
          </div>
          <div className="h-4 bg-cream-dark rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full bg-sage"
              animate={{ width: `${Math.min((summary.exercise.total_minutes / summary.goals.exercise_goal) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
          </div>
          <div className={`grid gap-2 text-center ${summary.activity?.active_energy ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <p className="text-lg font-bold text-sage">{summary.exercise.total_minutes}</p>
              <p className="text-[10px] text-brown-light">Minutes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-terracotta">{summary.exercise.total_burned}</p>
              <p className="text-[10px] text-brown-light">Workout Cal</p>
            </div>
            {summary.activity?.active_energy != null && summary.activity.active_energy > 0 && (
              <div>
                <p className="text-lg font-bold text-mustard">{summary.activity.active_energy}</p>
                <p className="text-[10px] text-brown-light">Active Cal</p>
              </div>
            )}
          </div>
          {summary.activity?.step_count != null && summary.activity.step_count > 0 && (
            <div className="mt-2 text-center">
              <span className="text-xs text-brown-light">{summary.activity.step_count.toLocaleString()} steps</span>
            </div>
          )}
        </div>
      )}

      {/* Entries */}
      <div className="flex-1 space-y-2">
        {exerciseEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏃</p>
            <p className="text-brown-light font-medium">No exercise logged today</p>
            <p className="text-brown-light text-sm">Tap + to log a workout</p>
          </div>
        ) : (
          exerciseEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-brown text-sm">{entry.name}</p>
                <div className="flex gap-2 mt-0.5 text-xs text-brown-light">
                  <span className="capitalize px-1.5 py-0.5 bg-cream-dark rounded-md">{entry.intensity}</span>
                  <span>{entry.duration_minutes} min</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sage text-sm">{entry.calories_burned} cal</span>
                <button onClick={() => { deleteExercise(entry.id); loadExercise(); loadSummary(); }}
                  className="p-1.5 rounded-full hover:bg-cream-dark btn-press">
                  <Trash2 size={14} className="text-brown-light" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowAdd(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 w-14 h-14 rounded-full bg-sage text-white shadow-lg flex items-center justify-center z-40"
        style={{ right: 'max(16px, calc(50% - 195px))' }}
      >
        <Plus size={28} />
      </motion.button>

      <AnimatePresence>
        {showAdd && <AddExerciseModal onClose={handleClose} />}
      </AnimatePresence>
    </div>
  );
}
