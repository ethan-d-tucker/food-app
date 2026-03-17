import db from './database.js';
import { calculateDecay, applyExercise } from './pet-engine.js';

// Map Apple Health workout types to our exercise types
const workoutTypeMap: Record<string, string> = {
  'HKWorkoutActivityTypeRunning': 'cardio',
  'HKWorkoutActivityTypeCycling': 'cardio',
  'HKWorkoutActivityTypeSwimming': 'cardio',
  'HKWorkoutActivityTypeWalking': 'walking',
  'HKWorkoutActivityTypeHiking': 'walking',
  'HKWorkoutActivityTypeYoga': 'flexibility',
  'HKWorkoutActivityTypeFunctionalStrengthTraining': 'strength',
  'HKWorkoutActivityTypeTraditionalStrengthTraining': 'strength',
  'HKWorkoutActivityTypeHighIntensityIntervalTraining': 'cardio',
  'HKWorkoutActivityTypeCoreTraining': 'strength',
  'HKWorkoutActivityTypeDance': 'cardio',
  'HKWorkoutActivityTypeElliptical': 'cardio',
  'HKWorkoutActivityTypeRowing': 'cardio',
  'HKWorkoutActivityTypePilates': 'flexibility',
  'HKWorkoutActivityTypeSoccer': 'sports',
  'HKWorkoutActivityTypeBasketball': 'sports',
  'HKWorkoutActivityTypeTennis': 'sports',
  'HKWorkoutActivityTypeStairClimbing': 'cardio',
  'HKWorkoutActivityTypeCrossTraining': 'cardio',
  'HKWorkoutActivityTypeMixedCardio': 'cardio',
  'HKWorkoutActivityTypeBadminton': 'sports',
  'HKWorkoutActivityTypeTableTennis': 'sports',
  'HKWorkoutActivityTypeVolleyball': 'sports',
  'HKWorkoutActivityTypeBoxing': 'sports',
  'HKWorkoutActivityTypeMartialArts': 'sports',
  'HKWorkoutActivityTypeClimbing': 'strength',
};

// Map display names to our types
const nameTypeMap: Record<string, string> = {
  'running': 'cardio',
  'run': 'cardio',
  'cycling': 'cardio',
  'biking': 'cardio',
  'swimming': 'cardio',
  'walking': 'walking',
  'walk': 'walking',
  'hiking': 'walking',
  'yoga': 'flexibility',
  'strength': 'strength',
  'weight': 'strength',
  'hiit': 'cardio',
  'soccer': 'sports',
  'basketball': 'sports',
  'tennis': 'sports',
  'dance': 'cardio',
  'pilates': 'flexibility',
  'stretching': 'flexibility',
};

function inferExerciseType(workoutType?: string, name?: string): string {
  if (workoutType && workoutTypeMap[workoutType]) {
    return workoutTypeMap[workoutType];
  }
  if (name) {
    const lower = name.toLowerCase();
    for (const [keyword, type] of Object.entries(nameTypeMap)) {
      if (lower.includes(keyword)) return type;
    }
  }
  return 'cardio'; // default
}

function inferIntensity(caloriesBurned: number, durationMinutes: number, heartRateAvg?: number): string {
  if (heartRateAvg) {
    if (heartRateAvg > 150) return 'intense';
    if (heartRateAvg > 120) return 'moderate';
    return 'light';
  }
  // Infer from calorie burn rate
  if (durationMinutes > 0) {
    const calPerMin = caloriesBurned / durationMinutes;
    if (calPerMin > 10) return 'intense';
    if (calPerMin > 5) return 'moderate';
    return 'light';
  }
  return 'moderate';
}

function humanizeName(workoutType?: string, name?: string): string {
  if (name) return name;
  if (workoutType) {
    // Convert HKWorkoutActivityTypeRunning -> Running
    return workoutType
      .replace('HKWorkoutActivityType', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }
  return 'Workout';
}

export interface ImportEntry {
  name?: string;
  workout_type?: string;
  duration_minutes: number;
  calories_burned: number;
  heart_rate_avg?: number;
  date?: string;
}

export function importExerciseEntries(profileId: string, entries: ImportEntry[]): { imported: number; skipped: number } {
  let imported = 0;
  let skipped = 0;

  const insertStmt = db.prepare(`
    INSERT INTO exercise_entries (id, profile_id, name, exercise_type, duration_minutes, calories_burned, intensity, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'health-auto-export', ?)
  `);

  const checkDupe = db.prepare(`
    SELECT id FROM exercise_entries
    WHERE profile_id = ? AND date(created_at) = date(?) AND duration_minutes = ? AND source = 'health-auto-export'
    LIMIT 1
  `);

  for (const entry of entries) {
    const date = entry.date || new Date().toISOString();
    const duration = Math.round(entry.duration_minutes || 0);
    if (duration <= 0) { skipped++; continue; }

    // Deduplication
    const existing = checkDupe.get(profileId, date, duration);
    if (existing) { skipped++; continue; }

    const exerciseType = inferExerciseType(entry.workout_type, entry.name);
    const intensity = inferIntensity(entry.calories_burned || 0, duration, entry.heart_rate_avg);
    const name = humanizeName(entry.workout_type, entry.name);
    const id = crypto.randomUUID();

    insertStmt.run(id, profileId, name, exerciseType, duration, entry.calories_burned || 0, intensity, date);
    imported++;
  }

  // Update pet stats for the latest import
  if (imported > 0) {
    const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(profileId) as any;
    if (rawStats) {
      let current = calculateDecay({
        fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
        interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
        is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
      }, new Date());

      // Apply a single aggregate exercise update
      const totalDuration = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      const avgIntensity = totalDuration > 30 ? 'moderate' : 'light';
      current = applyExercise(current, Math.min(totalDuration, 60), avgIntensity);

      db.prepare(`
        UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
          interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?
        WHERE profile_id = ?
      `).run(
        current.fullness, current.fitness, current.happiness,
        current.interaction_bonus, current.is_stuffed ? 1 : 0, current.is_exhausted ? 1 : 0,
        current.last_updated, profileId
      );
    }
  }

  return { imported, skipped };
}

// Extract numeric value from Health Auto Export fields
// The app sends energy/heart rate as either plain numbers or objects like { qty: 150, units: "kcal" }
function extractQty(val: any): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val.qty != null) return Number(val.qty) || 0;
  return Number(val) || 0;
}

// Parse Health Auto Export app's webhook format
export function parseHealthAutoExport(body: any): ImportEntry[] {
  // Health Auto Export sends data in various formats. Common formats:
  // { data: { workouts: [...] } }
  // { workouts: [...] }
  // Or just an array of workouts
  const entries: ImportEntry[] = [];

  const workouts = body?.data?.workouts || body?.workouts || (Array.isArray(body) ? body : [body]);

  for (const w of workouts) {
    if (!w) continue;

    // Duration: seconds (from Health Auto Export) or already in minutes
    const rawDuration = extractQty(w.duration);
    // Health Auto Export sends duration in seconds; if value > 300 assume seconds
    const durationMinutes = rawDuration > 300 ? rawDuration / 60 : (w.duration_minutes || w.durationInMinutes || rawDuration);

    // Calories: Health Auto Export sends as { qty: number, units: "kcal" } objects
    const calories = extractQty(w.activeEnergy) || extractQty(w.totalEnergyBurned)
      || extractQty(w.activeEnergyBurned) || extractQty(w.calories_burned) || 0;

    // Heart rate: may be nested object or plain number
    const heartRate = extractQty(w.heartRateAverage) || extractQty(w.avgHeartRate)
      || extractQty(w.heart_rate_avg) || undefined;

    entries.push({
      name: w.name || w.workoutActivityType,
      workout_type: w.workoutActivityType || w.type,
      duration_minutes: durationMinutes,
      calories_burned: calories,
      heart_rate_avg: heartRate,
      date: w.start || w.startDate || w.date,
    });
  }

  return entries;
}
