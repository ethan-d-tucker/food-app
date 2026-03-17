export interface PetStats {
  fullness: number;
  fitness: number;
  happiness: number;
  interaction_bonus: number;
  is_stuffed: boolean;
  is_exhausted: boolean;
  last_updated: string;
  last_petted: string | null;
}

export type PetMood =
  | 'ecstatic'
  | 'happy'
  | 'content'
  | 'meh'
  | 'sad'
  | 'sick'
  | 'starving'
  | 'sleeping';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export interface HappinessWeights {
  food: number;     // 0-100, default 50
  exercise: number; // 0-100, default 30
  interaction: number; // 0-100, default 20
}

const DEFAULT_WEIGHTS: HappinessWeights = { food: 50, exercise: 30, interaction: 20 };

function calcHappiness(fullness: number, fitness: number, interaction: number, weights: HappinessWeights = DEFAULT_WEIGHTS): number {
  const total = weights.food + weights.exercise + weights.interaction;
  if (total === 0) return 50;
  // Normalize weights so they always sum to produce a 0-100 scale
  const wF = weights.food / total;
  const wE = weights.exercise / total;
  const wI = weights.interaction / total;
  // interaction is 0-20, scale to 0-100 for weighted average
  const base = fullness * wF + fitness * wE + (interaction * 5) * wI;
  return clamp(base, 10, 100);
}

export function calculateDecay(stats: PetStats, now: Date, weights?: HappinessWeights): PetStats {
  const lastUpdate = new Date(stats.last_updated);
  const hoursElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < 0.01) return stats;

  // Floor at 10 — pet never hits zero
  const fullness = clamp(stats.fullness - hoursElapsed * 2, 10, 100);
  const fitness = clamp(stats.fitness - hoursElapsed * 1, 10, 100);
  const interactionDecay = clamp(stats.interaction_bonus - hoursElapsed * 0.5, 0, 20);

  const happiness = calcHappiness(fullness, fitness, interactionDecay, weights);

  return {
    ...stats,
    fullness,
    fitness,
    happiness,
    interaction_bonus: interactionDecay,
    is_stuffed: false,
    is_exhausted: false,
    last_updated: now.toISOString(),
  };
}

export function getNutritionQuality(protein: number, fiber: number, calories: number): number {
  if (calories <= 0) return 1;
  const proteinRatio = protein * 4 / calories;
  const fiberScore = Math.min(fiber / 5, 1);
  const quality = 0.7 + proteinRatio * 0.5 + fiberScore * 0.3;
  return clamp(quality, 0.5, 1.5);
}

export function applyFood(stats: PetStats, calories: number, protein: number, fiber: number, trackingMode: 'casual' | 'structured' = 'structured', weights?: HappinessWeights): PetStats {
  const quality = trackingMode === 'casual' ? 1.0 : getNutritionQuality(protein, fiber, calories);
  let points: number;
  if (trackingMode === 'casual') {
    // In casual mode, just logging any food gives a decent boost
    points = 20;
  } else if (calories < 200) points = 7;
  else if (calories < 500) points = 18;
  else if (calories < 800) points = 28;
  else points = 35;

  points *= quality;

  const fullness = clamp(stats.fullness + points, 0, 100);

  const happiness = calcHappiness(fullness, stats.fitness, stats.interaction_bonus, weights);

  return {
    ...stats,
    fullness,
    is_stuffed: false,
    is_exhausted: false,
    happiness,
    last_updated: new Date().toISOString(),
  };
}

export function applyExercise(stats: PetStats, durationMinutes: number, intensity: string, weights?: HappinessWeights): PetStats {
  let points: number;
  switch (intensity) {
    case 'intense': points = 35; break;
    case 'moderate': points = 22; break;
    default: points = 12;
  }
  const durationMultiplier = clamp(durationMinutes / 30, 0.3, 2.0);
  points *= durationMultiplier;

  const fitness = clamp(stats.fitness + points, 0, 100);

  const happiness = calcHappiness(stats.fullness, fitness, stats.interaction_bonus, weights);

  return {
    ...stats,
    fitness,
    is_stuffed: false,
    is_exhausted: false,
    happiness,
    last_updated: new Date().toISOString(),
  };
}

export function applyPetting(stats: PetStats): PetStats {
  const now = new Date();
  if (stats.last_petted) {
    const lastPet = new Date(stats.last_petted);
    const secondsElapsed = (now.getTime() - lastPet.getTime()) / 1000;
    if (secondsElapsed < 30) return stats;
  }

  const interaction_bonus = clamp(stats.interaction_bonus + 3, 0, 20);
  const happiness = calcHappiness(stats.fullness, stats.fitness, interaction_bonus);

  return {
    ...stats,
    interaction_bonus,
    happiness,
    last_petted: now.toISOString(),
    last_updated: now.toISOString(),
  };
}

// ─── XP / Leveling ───

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 50;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const needed = nextLevelXp - currentLevelXp;
  const current = xp - currentLevelXp;
  return { current, needed, progress: needed > 0 ? current / needed : 1 };
}

export interface XpGain {
  xp_gained: number;
  reason: string;
}

export function calculateFoodXp(calories: number, protein: number, carbs: number, fat: number, fiber: number, isFirstToday: boolean): XpGain[] {
  const gains: XpGain[] = [];
  gains.push({ xp_gained: 10, reason: 'Logged food' });
  if (protein > 0 && carbs > 0 && fat > 0 && fiber > 0) {
    gains.push({ xp_gained: 5, reason: 'Complete macros' });
  }
  if (isFirstToday) {
    gains.push({ xp_gained: 20, reason: 'First log today' });
  }
  return gains;
}

export function calculateExerciseXp(intensity: string, isFirstToday: boolean): XpGain[] {
  const gains: XpGain[] = [];
  let base = 15;
  if (intensity === 'intense') base += 5;
  else if (intensity === 'moderate') base += 3;
  gains.push({ xp_gained: base, reason: 'Logged exercise' });
  if (isFirstToday) {
    gains.push({ xp_gained: 20, reason: 'First log today' });
  }
  return gains;
}

export function calculateStreakXp(streak: number): XpGain[] {
  if (streak <= 0) return [];
  const xp = Math.min(streak * 5, 50);
  return [{ xp_gained: xp, reason: `${streak}-day streak bonus` }];
}

export function deriveMood(stats: PetStats): PetMood {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 7) return 'sleeping';
  if (stats.fullness < 10) return 'starving';
  if (stats.happiness > 85) return 'ecstatic';
  if (stats.happiness > 65) return 'happy';
  if (stats.happiness > 45) return 'content';
  if (stats.happiness > 25) return 'meh';
  return 'sad';
}
