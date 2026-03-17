import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type CalendarDay } from '../stores/appStore';
import { ChevronLeft, ChevronRight, X, Flame, TrendingUp, UtensilsCrossed, Dumbbell, Trophy } from 'lucide-react';
import { api } from '../lib/api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekStart(d: Date) {
  const day = new Date(d);
  day.setDate(day.getDate() - day.getDay());
  return day.toISOString().split('T')[0];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DayDetail {
  food: any[];
  exercise: any[];
  summary: any;
}

export default function HistoryPage() {
  const { activeProfileId, calendarData, weekSummary, streaks, loadCalendar, loadWeekSummary, loadStreaks, achievements, loadAchievements } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    loadCalendar(getMonthStr(currentMonth));
    loadStreaks();
    loadAchievements();
  }, [currentMonth, activeProfileId, loadCalendar, loadStreaks, loadAchievements]);

  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    loadWeekSummary(weekStart);
  }, [activeProfileId, loadWeekSummary]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    calendarData.forEach((d) => map.set(d.date, d));
    return map;
  }, [calendarData]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const selectDay = async (date: string) => {
    setSelectedDate(date);
    setLoadingDetail(true);
    if (!activeProfileId) return;
    try {
      const [food, exercise, summary] = await Promise.all([
        api.getFood(activeProfileId, date),
        api.getExercise(activeProfileId, date),
        api.getSummary(activeProfileId, date),
      ]);
      setDayDetail({ food, exercise, summary });
    } catch {
      setDayDetail(null);
    }
    setLoadingDetail(false);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      <h1 className="font-heading text-2xl font-bold text-brown mb-4">History</h1>

      {/* Streak + Week Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <Flame size={20} className="text-terracotta mx-auto mb-1" />
          <p className="text-2xl font-bold text-brown">{streaks?.current_streak || 0}</p>
          <p className="text-[10px] text-brown-light">day streak</p>
          {(streaks?.longest_streak || 0) > 0 && (
            <p className="text-[10px] text-brown-light mt-0.5">best: {streaks!.longest_streak}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <TrendingUp size={20} className="text-sage mx-auto mb-1" />
          <p className="text-2xl font-bold text-brown">{weekSummary?.days_logged || 0}<span className="text-sm text-brown-light">/7</span></p>
          <p className="text-[10px] text-brown-light">days this week</p>
          {weekSummary && weekSummary.avg_daily_calories > 0 && (
            <p className="text-[10px] text-brown-light mt-0.5">~{weekSummary.avg_daily_calories} cal/day</p>
          )}
        </div>
      </div>

      {/* Week Summary Details */}
      {weekSummary && (weekSummary.food.total_meals > 0 || weekSummary.exercise.total_exercises > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-heading font-bold text-sm text-brown mb-2">This Week</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-terracotta">{weekSummary.food.total_calories}</p>
              <p className="text-[10px] text-brown-light">total calories</p>
            </div>
            <div>
              <p className="text-lg font-bold text-sage">{weekSummary.exercise.total_minutes}</p>
              <p className="text-[10px] text-brown-light">exercise min</p>
            </div>
            <div>
              <p className="text-lg font-bold text-mustard">{weekSummary.food.total_meals}</p>
              <p className="text-[10px] text-brown-light">meals logged</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brown">{weekSummary.exercise.total_exercises}</p>
              <p className="text-[10px] text-brown-light">workouts</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-cream btn-press">
            <ChevronLeft size={18} className="text-brown" />
          </button>
          <h3 className="font-heading font-bold text-brown">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-cream btn-press">
            <ChevronRight size={18} className="text-brown" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-brown-light">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const data = calendarMap.get(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dayNum}
                onClick={() => selectDay(dateStr)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 btn-press transition-colors ${
                  isSelected ? 'bg-terracotta/15 ring-1 ring-terracotta' :
                  isToday ? 'bg-cream-dark' : 'hover:bg-cream'
                }`}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-terracotta font-bold' : 'text-brown'}`}>
                  {dayNum}
                </span>
                {data && (
                  <div className="flex gap-0.5">
                    {data.has_food && <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />}
                    {data.has_exercise && <div className="w-1.5 h-1.5 rounded-full bg-sage" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-terracotta" />
            <span className="text-[10px] text-brown-light">Food</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-sage" />
            <span className="text-[10px] text-brown-light">Exercise</span>
          </div>
        </div>
      </div>

      {/* Day Detail Sheet */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-sm text-brown">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="p-1 rounded-lg hover:bg-cream btn-press">
                <X size={16} className="text-brown-light" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="text-center py-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-cream-dark border-t-terracotta rounded-full mx-auto"
                />
              </div>
            ) : dayDetail ? (
              <div className="space-y-3">
                {/* Summary Row */}
                {dayDetail.summary && (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-cream rounded-xl p-2">
                      <p className="text-lg font-bold text-terracotta">{dayDetail.summary.food.total_calories}</p>
                      <p className="text-[10px] text-brown-light">calories</p>
                    </div>
                    <div className="bg-cream rounded-xl p-2">
                      <p className="text-lg font-bold text-sage">{dayDetail.summary.exercise.total_minutes}</p>
                      <p className="text-[10px] text-brown-light">exercise min</p>
                    </div>
                  </div>
                )}

                {/* Food Entries */}
                {dayDetail.food.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <UtensilsCrossed size={14} className="text-terracotta" />
                      <span className="text-xs font-medium text-brown">Food ({dayDetail.food.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {dayDetail.food.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-brown">{f.name}</p>
                            <p className="text-[10px] text-brown-light">{f.meal_type}</p>
                          </div>
                          <span className="text-sm font-bold text-terracotta">{f.calories}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercise Entries */}
                {dayDetail.exercise.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Dumbbell size={14} className="text-sage" />
                      <span className="text-xs font-medium text-brown">Exercise ({dayDetail.exercise.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {dayDetail.exercise.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-brown">{e.name}</p>
                            <p className="text-[10px] text-brown-light">{e.intensity} - {e.duration_minutes}min</p>
                          </div>
                          <span className="text-sm font-bold text-sage">{e.calories_burned} cal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dayDetail.food.length === 0 && dayDetail.exercise.length === 0 && (
                  <p className="text-center text-sm text-brown-light py-4">No entries for this day</p>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-mustard" />
            <h3 className="font-heading font-bold text-sm text-brown">
              Achievements ({achievements.filter((a: any) => a.unlocked).length}/{achievements.length})
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((a: any) => (
              <div
                key={a.key}
                className={`text-center p-2 rounded-xl transition-colors ${a.unlocked ? 'bg-cream' : 'bg-cream/40 opacity-40'}`}
                title={a.unlocked ? `${a.name}: ${a.description}` : `Locked: ${a.description}`}
              >
                <span className="text-xl">{a.icon}</span>
                <p className="text-[9px] font-medium text-brown mt-0.5 leading-tight">{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
