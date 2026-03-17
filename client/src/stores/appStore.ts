import { create } from 'zustand';
import { api } from '../lib/api';

export interface Profile {
  id: string;
  name: string;
  pet_type: 'red-panda' | 'cat' | 'hamster' | 'frog';
  pet_name: string;
  avatar_color: string;
  calorie_goal: number;
  exercise_goal: number;
  pet_stats: {
    fullness: number;
    fitness: number;
    happiness: number;
    interaction_bonus: number;
    is_stuffed: boolean;
    is_exhausted: boolean;
    last_updated: string;
    last_petted: string | null;
  } | null;
  mood: string;
}

export interface FoodEntry {
  id: string;
  profile_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at: string;
  quantity: number;
  quantity_unit: string;
  serving_grams: number | null;
  display_calories: number;
  display_protein: number;
  display_carbs: number;
  display_fat: number;
  display_fiber: number;
}

export interface ExerciseEntry {
  id: string;
  profile_id: string;
  name: string;
  exercise_type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'walking';
  duration_minutes: number;
  calories_burned: number;
  intensity: 'light' | 'moderate' | 'intense';
  created_at: string;
}

export interface Settings {
  profile_id: string;
  calorie_goal: number;
  exercise_goal: number;
  tracking_mode: 'casual' | 'structured';
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  meal_frequency: number;
  track_calories: number;
  track_macros: number;
  track_exercise: number;
  ntfy_enabled: number;
  ntfy_server: string;
  ntfy_topic: string;
  ntfy_pet_alerts: number;
  ntfy_goal_reminders: number;
  blocker_enabled: number;
  blocker_mode: 'gentle' | 'hard';
  happiness_food: number;
  happiness_exercise: number;
  happiness_interaction: number;
}

interface DailySummary {
  food: { meal_count: number; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; total_fiber: number };
  exercise: { exercise_count: number; total_minutes: number; total_burned: number };
  goals: { calorie_goal: number; exercise_goal: number; tracking_mode: string };
}

export interface CalendarDay {
  date: string;
  has_food: boolean;
  has_exercise: boolean;
  food_count: number;
  exercise_count: number;
}

export interface WeekSummary {
  week_start: string;
  week_end: string;
  food: { total_meals: number; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; total_fiber: number; days_with_food: number };
  exercise: { total_exercises: number; total_minutes: number; total_burned: number; days_with_exercise: number };
  days_logged: number;
  avg_daily_calories: number;
}

export interface Streaks {
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
}

export interface Progression {
  xp: number;
  level: number;
  treats: number;
  current: number;
  needed: number;
  progress: number;
}

export interface ChecklistItem {
  id: string;
  profile_id: string;
  title: string;
  icon: string;
  recurrence: 'once' | 'daily' | 'weekly';
  recurrence_days: string;
  scheduled_date: string | null;
  completed: boolean;
}

type Page = 'home' | 'food' | 'exercise' | 'history' | 'checklist' | 'settings' | 'onboarding';

interface AppState {
  profiles: Profile[];
  activeProfileId: string | null;
  page: Page;
  foodEntries: FoodEntry[];
  exerciseEntries: ExerciseEntry[];
  summary: DailySummary | null;
  settings: Settings | null;
  calendarData: CalendarDay[];
  weekSummary: WeekSummary | null;
  streaks: Streaks | null;
  progression: Progression | null;
  levelUpTriggered: boolean;
  achievements: any[];
  newAchievement: any | null;
  checklistItems: ChecklistItem[];
  loading: boolean;
  petReaction: { type: 'food' | 'exercise' | 'pet' | 'treat'; mood: string } | null;

  setPage: (page: Page) => void;
  setActiveProfile: (id: string) => void;
  loadProfiles: () => Promise<void>;
  createProfile: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  petPet: () => Promise<void>;
  loadFood: (date?: string) => Promise<void>;
  addFood: (data: any) => Promise<void>;
  updateFood: (id: string, data: { quantity: number; quantity_unit: string }) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  loadExercise: (date?: string) => Promise<void>;
  addExercise: (data: any) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  loadSummary: (date?: string) => Promise<void>;
  loadCalendar: (month: string) => Promise<void>;
  loadWeekSummary: (weekStart: string) => Promise<void>;
  loadStreaks: () => Promise<void>;
  loadProgression: () => Promise<void>;
  useTreat: () => Promise<void>;
  clearLevelUp: () => void;
  loadAchievements: () => Promise<void>;
  clearNewAchievement: () => void;
  loadChecklist: (date?: string) => Promise<void>;
  addChecklistItem: (data: any) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
  completeChecklistItem: (id: string) => Promise<void>;
  uncompleteChecklistItem: (id: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  clearReaction: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  page: 'home',
  foodEntries: [],
  exerciseEntries: [],
  summary: null,
  settings: null,
  calendarData: [],
  weekSummary: null,
  streaks: null,
  progression: null,
  levelUpTriggered: false,
  achievements: [],
  newAchievement: null,
  checklistItems: [],
  loading: true,
  petReaction: null,

  setPage: (page) => set({ page }),
  setActiveProfile: (id) => {
    set({ activeProfileId: id });
    localStorage.setItem('activeProfileId', id);
  },

  loadProfiles: async () => {
    set({ loading: true });
    try {
      const profiles = await api.getProfiles();
      const savedId = localStorage.getItem('activeProfileId');
      const activeProfileId = profiles.find((p: any) => p.id === savedId)?.id || profiles[0]?.id || null;
      set({ profiles, activeProfileId, loading: false, page: profiles.length === 0 ? 'onboarding' : 'home' });
    } catch {
      set({ loading: false });
    }
  },

  createProfile: async (data) => {
    const profile = await api.createProfile(data);
    const profiles = [...get().profiles, profile];
    set({ profiles, activeProfileId: profile.id, page: 'home' });
    localStorage.setItem('activeProfileId', profile.id);
  },

  updateProfile: async (data) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const updated = await api.updateProfile(activeProfileId, data);
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === activeProfileId ? { ...updated } : p
      ),
    }));
  },

  petPet: async () => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const result = await api.petPet(activeProfileId);
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === activeProfileId ? { ...p, pet_stats: result.pet_stats, mood: result.mood } : p
      ),
      petReaction: { type: 'pet', mood: result.mood },
    }));
  },

  loadFood: async (date) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const entries = await api.getFood(activeProfileId, date);
    set({ foodEntries: entries });
  },

  addFood: async (data) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const result = await api.addFood(activeProfileId, data);
    set((state) => ({
      foodEntries: [result.entry, ...state.foodEntries],
      profiles: result.pet_stats
        ? state.profiles.map((p) =>
            p.id === activeProfileId ? { ...p, pet_stats: result.pet_stats, mood: result.mood } : p
          )
        : state.profiles,
      petReaction: result.pet_stats ? { type: 'food', mood: result.mood } : null,
      progression: result.level ? { xp: result.xp, level: result.level, treats: result.treats, current: 0, needed: 0, progress: 0 } : state.progression,
      levelUpTriggered: result.new_level || false,
      newAchievement: result.new_achievements?.length > 0 ? result.new_achievements[0] : state.newAchievement,
    }));
    if (result.level) get().loadProgression();
  },

  updateFood: async (id, data) => {
    const updated = await api.updateFood(id, data);
    set((state) => ({
      foodEntries: state.foodEntries.map((e) => e.id === id ? updated : e),
    }));
  },

  deleteFood: async (id) => {
    await api.deleteFood(id);
    set((state) => ({ foodEntries: state.foodEntries.filter((e) => e.id !== id) }));
  },

  loadExercise: async (date) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const entries = await api.getExercise(activeProfileId, date);
    set({ exerciseEntries: entries });
  },

  addExercise: async (data) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const result = await api.addExercise(activeProfileId, data);
    set((state) => ({
      exerciseEntries: [result.entry, ...state.exerciseEntries],
      profiles: result.pet_stats
        ? state.profiles.map((p) =>
            p.id === activeProfileId ? { ...p, pet_stats: result.pet_stats, mood: result.mood } : p
          )
        : state.profiles,
      petReaction: result.pet_stats ? { type: 'exercise', mood: result.mood } : null,
      progression: result.level ? { xp: result.xp, level: result.level, treats: result.treats, current: 0, needed: 0, progress: 0 } : state.progression,
      levelUpTriggered: result.new_level || false,
      newAchievement: result.new_achievements?.length > 0 ? result.new_achievements[0] : state.newAchievement,
    }));
    if (result.level) get().loadProgression();
  },

  deleteExercise: async (id) => {
    await api.deleteExercise(id);
    set((state) => ({ exerciseEntries: state.exerciseEntries.filter((e) => e.id !== id) }));
  },

  loadSummary: async (date) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const summary = await api.getSummary(activeProfileId, date);
    set({ summary });
  },

  loadCalendar: async (month) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const data = await api.getCalendar(activeProfileId, month);
    set({ calendarData: data });
  },

  loadWeekSummary: async (weekStart) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const data = await api.getWeekSummary(activeProfileId, weekStart);
    set({ weekSummary: data });
  },

  loadStreaks: async () => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const data = await api.getStreaks(activeProfileId);
    set({ streaks: data });
  },

  loadProgression: async () => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const data = await api.getProgression(activeProfileId);
    set({ progression: data });
  },

  useTreat: async () => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const result = await api.useTreat(activeProfileId);
    if (result.pet_stats) {
      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === activeProfileId ? { ...p, pet_stats: result.pet_stats, mood: result.mood } : p
        ),
        petReaction: { type: 'treat', mood: result.mood },
        progression: state.progression ? { ...state.progression, treats: result.treats } : null,
      }));
    }
  },

  clearLevelUp: () => set({ levelUpTriggered: false }),

  loadAchievements: async () => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const data = await api.getAchievements(activeProfileId);
    set({ achievements: data });
  },

  clearNewAchievement: () => set({ newAchievement: null }),

  loadChecklist: async (date) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const items = await api.getChecklist(activeProfileId, date);
    set({ checklistItems: items });
  },

  addChecklistItem: async (data) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    await api.addChecklistItem(activeProfileId, data);
    get().loadChecklist();
  },

  deleteChecklistItem: async (id) => {
    await api.deleteChecklistItem(id);
    set((state) => ({ checklistItems: state.checklistItems.filter(i => i.id !== id) }));
  },

  completeChecklistItem: async (id) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const result = await api.completeChecklistItem(id);
    set((state) => ({
      checklistItems: state.checklistItems.map(i => i.id === id ? { ...i, completed: true } : i),
      profiles: result.pet_stats
        ? state.profiles.map(p => p.id === activeProfileId ? { ...p, pet_stats: result.pet_stats, mood: result.mood } : p)
        : state.profiles,
      petReaction: result.pet_stats ? { type: 'food', mood: result.mood } : null,
    }));
    if (result.level) get().loadProgression();
  },

  uncompleteChecklistItem: async (id) => {
    await api.uncompleteChecklistItem(id);
    set((state) => ({
      checklistItems: state.checklistItems.map(i => i.id === id ? { ...i, completed: false } : i),
    }));
  },

  loadSettings: async () => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    try {
      const settings = await api.getSettings(activeProfileId);
      set({ settings });
    } catch {
      set({ settings: null });
    }
  },

  updateSettings: async (data) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    const updated = await api.updateSettings(activeProfileId, data);
    set({ settings: updated });
  },

  clearReaction: () => set({ petReaction: null }),
}));
