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
}

interface DailySummary {
  food: { meal_count: number; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; total_fiber: number };
  exercise: { exercise_count: number; total_minutes: number; total_burned: number };
  goals: { calorie_goal: number; exercise_goal: number; tracking_mode: string };
}

type Page = 'home' | 'food' | 'exercise' | 'settings' | 'onboarding';

interface AppState {
  profiles: Profile[];
  activeProfileId: string | null;
  page: Page;
  foodEntries: FoodEntry[];
  exerciseEntries: ExerciseEntry[];
  summary: DailySummary | null;
  settings: Settings | null;
  loading: boolean;
  petReaction: { type: 'food' | 'exercise' | 'pet'; mood: string } | null;

  setPage: (page: Page) => void;
  setActiveProfile: (id: string) => void;
  loadProfiles: () => Promise<void>;
  createProfile: (data: any) => Promise<void>;
  petPet: () => Promise<void>;
  loadFood: (date?: string) => Promise<void>;
  addFood: (data: any) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  loadExercise: (date?: string) => Promise<void>;
  addExercise: (data: any) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  loadSummary: (date?: string) => Promise<void>;
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
    }));
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
