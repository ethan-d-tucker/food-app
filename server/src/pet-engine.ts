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

export function calculateDecay(stats: PetStats, now: Date): PetStats {
  const lastUpdate = new Date(stats.last_updated);
  const hoursElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < 0.01) return stats;

  // Floor at 10 — pet never hits zero
  const fullness = clamp(stats.fullness - hoursElapsed * 2, 10, 100);
  const fitness = clamp(stats.fitness - hoursElapsed * 1, 10, 100);
  const interactionDecay = clamp(stats.interaction_bonus - hoursElapsed * 0.5, 0, 20);

  // Clear debuffs if stats dropped below threshold
  const is_stuffed = stats.is_stuffed && fullness > 85;
  const is_exhausted = stats.is_exhausted && fitness > 85;

  const baseHappiness = fullness * 0.4 + fitness * 0.4 + interactionDecay * 1.0;
  const penalties = (is_stuffed ? 15 : 0) + (is_exhausted ? 15 : 0);
  const happiness = clamp(baseHappiness - penalties, 10, 100);

  return {
    ...stats,
    fullness,
    fitness,
    happiness,
    interaction_bonus: interactionDecay,
    is_stuffed,
    is_exhausted,
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

export function applyFood(stats: PetStats, calories: number, protein: number, fiber: number): PetStats {
  const quality = getNutritionQuality(protein, fiber, calories);
  let points: number;
  if (calories < 200) points = 7;
  else if (calories < 500) points = 18;
  else if (calories < 800) points = 28;
  else points = 35;

  points *= quality;

  const fullness = clamp(stats.fullness + points, 0, 100);
  const is_stuffed = fullness > 90;

  const baseHappiness = fullness * 0.4 + stats.fitness * 0.4 + stats.interaction_bonus * 1.0;
  const penalties = (is_stuffed ? 15 : 0) + (stats.is_exhausted ? 15 : 0);
  const happiness = clamp(baseHappiness - penalties, 10, 100);

  return {
    ...stats,
    fullness,
    is_stuffed,
    happiness,
    last_updated: new Date().toISOString(),
  };
}

export function applyExercise(stats: PetStats, durationMinutes: number, intensity: string): PetStats {
  let points: number;
  switch (intensity) {
    case 'intense': points = 35; break;
    case 'moderate': points = 22; break;
    default: points = 12;
  }
  const durationMultiplier = clamp(durationMinutes / 30, 0.3, 2.0);
  points *= durationMultiplier;

  const fitness = clamp(stats.fitness + points, 0, 100);
  const is_exhausted = fitness > 90;

  const baseHappiness = stats.fullness * 0.4 + fitness * 0.4 + stats.interaction_bonus * 1.0;
  const penalties = (stats.is_stuffed ? 15 : 0) + (is_exhausted ? 15 : 0);
  const happiness = clamp(baseHappiness - penalties, 10, 100);

  return {
    ...stats,
    fitness,
    is_exhausted,
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
  const baseHappiness = stats.fullness * 0.4 + stats.fitness * 0.4 + interaction_bonus * 1.0;
  const penalties = (stats.is_stuffed ? 15 : 0) + (stats.is_exhausted ? 15 : 0);
  const happiness = clamp(baseHappiness - penalties, 10, 100);

  return {
    ...stats,
    interaction_bonus,
    happiness,
    last_petted: now.toISOString(),
    last_updated: now.toISOString(),
  };
}

export function deriveMood(stats: PetStats): PetMood {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 7) return 'sleeping';
  if (stats.fullness < 10) return 'starving';
  if (stats.is_stuffed || stats.is_exhausted) return 'sick';
  if (stats.happiness > 85) return 'ecstatic';
  if (stats.happiness > 65) return 'happy';
  if (stats.happiness > 45) return 'content';
  if (stats.happiness > 25) return 'meh';
  return 'sad';
}
