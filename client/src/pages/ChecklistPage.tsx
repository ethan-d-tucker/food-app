import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import { Plus, X, Trash2, Check, Repeat, Calendar, RotateCcw } from 'lucide-react';

const ICONS = [
  { key: 'check', emoji: '✓' },
  { key: 'droplet', emoji: '💧' },
  { key: 'pill', emoji: '💊' },
  { key: 'book', emoji: '📖' },
  { key: 'star', emoji: '⭐' },
  { key: 'heart', emoji: '❤️' },
  { key: 'sun', emoji: '☀️' },
  { key: 'moon', emoji: '🌙' },
  { key: 'leaf', emoji: '🌿' },
  { key: 'fire', emoji: '🔥' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getIconEmoji(key: string): string {
  return ICONS.find(i => i.key === key)?.emoji || '✓';
}

export default function ChecklistPage() {
  const { checklistItems, loadChecklist, addChecklistItem, deleteChecklistItem, completeChecklistItem, uncompleteChecklistItem } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('check');
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly'>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const completed = checklistItems.filter(i => i.completed).length;
  const total = checklistItems.length;
  const progress = total > 0 ? completed / total : 0;

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addChecklistItem({
      title: title.trim(),
      icon,
      recurrence,
      recurrence_days: recurrence === 'weekly' ? recurrenceDays.join(',') : '',
      scheduled_date: recurrence === 'once' && scheduledDate ? scheduledDate : null,
    });
    setTitle('');
    setIcon('check');
    setRecurrence('daily');
    setRecurrenceDays([]);
    setScheduledDate('');
    setShowAdd(false);
  };

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      <h1 className="font-heading text-2xl font-bold text-brown mb-4">Checklist</h1>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-brown">{completed}/{total} done today</span>
            {completed === total && total > 0 && <span className="text-xs text-sage font-bold">All done!</span>}
          </div>
          <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-sage"
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {checklistItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 ${item.completed ? 'opacity-70' : ''}`}
            >
              <button
                onClick={() => item.completed ? uncompleteChecklistItem(item.id) : completeChecklistItem(item.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center btn-press transition-all ${
                  item.completed
                    ? 'bg-sage text-white'
                    : 'border-2 border-cream-dark hover:border-sage'
                }`}
              >
                {item.completed && <Check size={16} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.completed ? 'text-brown-light line-through' : 'text-brown'}`}>
                  <span className="mr-1.5">{getIconEmoji(item.icon)}</span>
                  {item.title}
                </p>
                <p className="text-[10px] text-brown-light">
                  {item.recurrence === 'daily' && 'Every day'}
                  {item.recurrence === 'weekly' && `Weekly: ${item.recurrence_days.split(',').map(d => DAY_LABELS[Number(d)]).join(', ')}`}
                  {item.recurrence === 'once' && (item.scheduled_date || 'One-time')}
                </p>
              </div>
              <button
                onClick={() => deleteChecklistItem(item.id)}
                className="p-1.5 rounded-lg hover:bg-cream btn-press"
              >
                <Trash2 size={14} className="text-brown-light" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {total === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm text-brown-light">No tasks yet! Add one below.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowAdd(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 right-1/2 translate-x-[195px] w-12 h-12 rounded-full bg-terracotta text-white shadow-lg flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </motion.button>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brown/40 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-[430px] bg-cream rounded-3xl p-4 max-h-[80vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg text-brown">New Task</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-cream-dark btn-press">
                  <X size={18} className="text-brown-light" />
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to do?"
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown font-body text-sm mb-3"
                autoFocus
              />

              {/* Icon Picker */}
              <div className="mb-3">
                <label className="text-xs font-medium text-brown-light mb-1.5 block">Icon</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ICONS.map(i => (
                    <button
                      key={i.key}
                      onClick={() => setIcon(i.key)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center btn-press transition-colors ${
                        icon === i.key ? 'bg-terracotta/15 ring-1 ring-terracotta' : 'bg-white'
                      }`}
                    >
                      <span className="text-lg">{i.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurrence */}
              <div className="mb-3">
                <label className="text-xs font-medium text-brown-light mb-1.5 block">Repeats</label>
                <div className="flex gap-2">
                  {[
                    { id: 'once' as const, label: 'Once', icon: Calendar },
                    { id: 'daily' as const, label: 'Daily', icon: Repeat },
                    { id: 'weekly' as const, label: 'Weekly', icon: RotateCcw },
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRecurrence(r.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 btn-press transition-colors ${
                        recurrence === r.id ? 'bg-terracotta text-white' : 'bg-white text-brown-light'
                      }`}
                    >
                      <r.icon size={12} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly day picker */}
              {recurrence === 'weekly' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3">
                  <label className="text-xs font-medium text-brown-light mb-1.5 block">Which days?</label>
                  <div className="flex gap-1.5">
                    {DAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold btn-press transition-colors ${
                          recurrenceDays.includes(i) ? 'bg-sage text-white' : 'bg-white text-brown-light'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Date picker for one-time */}
              {recurrence === 'once' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3">
                  <label className="text-xs font-medium text-brown-light mb-1.5 block">Date (optional, defaults to today)</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown text-sm"
                  />
                </motion.div>
              )}

              {/* Submit */}
              <button
                onClick={handleAdd}
                disabled={!title.trim()}
                className="w-full py-3 rounded-2xl bg-terracotta text-white font-heading font-bold text-sm btn-press disabled:opacity-40 transition-opacity"
              >
                Add Task
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
