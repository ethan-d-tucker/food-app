import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import { calculateDecay, applyFood, applyExercise, applyPetting, deriveMood, calculateLevel, calculateFoodXp, calculateExerciseXp, calculateStreakXp, xpToNextLevel, type HappinessWeights } from './pet-engine.js';
import { checkAchievements, getProfileAchievements } from './achievements.js';
import { getAccessories, getEquipped, equipAccessory } from './accessories.js';
import { searchFoods, lookupBarcode as lookupBarcodeAPI } from './food-search.js';
import { sendNotification, startNotificationScheduler } from './notifications.js';
import { importExerciseEntries, importActivityMetrics, parseHealthAutoExport } from './exercise-import.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3003;

// ─── Happiness Weights Helper ───

function getWeights(profileId: string): HappinessWeights {
  const s = db.prepare('SELECT happiness_food, happiness_exercise, happiness_interaction FROM settings WHERE profile_id = ?').get(profileId) as any;
  if (!s) return { food: 50, exercise: 30, interaction: 20 };
  return { food: s.happiness_food, exercise: s.happiness_exercise, interaction: s.happiness_interaction };
}

// ─── Streak Helper ───

function updateStreak(profileId: string) {
  const today = new Date().toISOString().split('T')[0];
  const streak = db.prepare('SELECT * FROM streaks WHERE profile_id = ?').get(profileId) as any;

  if (!streak) {
    db.prepare('INSERT INTO streaks (profile_id, current_streak, longest_streak, last_logged_date) VALUES (?, 1, 1, ?)').run(profileId, today);
    return;
  }

  if (streak.last_logged_date === today) return; // already logged today

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (streak.last_logged_date === yesterdayStr) {
    newStreak = streak.current_streak + 1;
  } else {
    newStreak = 1;
  }

  const longest = Math.max(newStreak, streak.longest_streak);
  db.prepare('UPDATE streaks SET current_streak = ?, longest_streak = ?, last_logged_date = ? WHERE profile_id = ?')
    .run(newStreak, longest, today, profileId);
}

function ensureProgression(profileId: string) {
  db.prepare('INSERT OR IGNORE INTO pet_progression (profile_id) VALUES (?)').run(profileId);
}

function awardXp(profileId: string, xpGained: number): { xp: number; level: number; new_level: boolean; treats: number } {
  ensureProgression(profileId);
  const prog = db.prepare('SELECT * FROM pet_progression WHERE profile_id = ?').get(profileId) as any;
  const oldLevel = prog.level;
  const newXp = prog.xp + xpGained;
  const newLevel = calculateLevel(newXp);
  let newTreats = prog.treats;
  if (newLevel > oldLevel) {
    newTreats += (newLevel - oldLevel); // +1 treat per level gained
  }
  db.prepare('UPDATE pet_progression SET xp = ?, level = ?, treats = ? WHERE profile_id = ?')
    .run(newXp, newLevel, newTreats, profileId);
  return { xp: newXp, level: newLevel, new_level: newLevel > oldLevel, treats: newTreats };
}

function isFirstLogToday(profileId: string, table: 'food_entries' | 'exercise_entries'): boolean {
  const today = new Date().toISOString().split('T')[0];
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE profile_id = ? AND date(created_at) = ?`).get(profileId, today) as any;
  return count.c <= 1; // <= 1 because the current entry was just inserted
}

app.use(cors());
app.use(express.json());

// Serve client build
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

// ─── Profiles ───

app.get('/api/profiles', (_req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles').all();
  const stats = db.prepare('SELECT * FROM pet_stats').all() as any[];
  const now = new Date();

  const result = profiles.map((p: any) => {
    const rawStats = stats.find((s: any) => s.profile_id === p.id);
    if (!rawStats) return { ...p, pet_stats: null, mood: 'content' };

    const petStats = calculateDecay({
      fullness: rawStats.fullness,
      fitness: rawStats.fitness,
      happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus,
      is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted,
      last_updated: rawStats.last_updated,
      last_petted: rawStats.last_petted,
    }, now, getWeights(p.id));

    // Persist decayed stats
    db.prepare(`
      UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
        interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?
      WHERE profile_id = ?
    `).run(
      petStats.fullness, petStats.fitness, petStats.happiness,
      petStats.interaction_bonus, petStats.is_stuffed ? 1 : 0, petStats.is_exhausted ? 1 : 0,
      petStats.last_updated, p.id
    );

    return { ...p, pet_stats: petStats, mood: deriveMood(petStats) };
  });

  res.json(result);
});

app.post('/api/profiles', (req, res) => {
  const { name, pet_type, pet_name, avatar_color, calorie_goal, exercise_goal } = req.body;
  const id = crypto.randomUUID();

  db.prepare(
    'INSERT INTO profiles (id, name, pet_type, pet_name, avatar_color, calorie_goal, exercise_goal) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, pet_type, pet_name, avatar_color || '#E07A5F', calorie_goal || 2000, exercise_goal || 30);

  db.prepare(
    'INSERT INTO pet_stats (profile_id) VALUES (?)'
  ).run(id);

  db.prepare(
    'INSERT INTO settings (profile_id, calorie_goal, exercise_goal) VALUES (?, ?, ?)'
  ).run(id, calorie_goal || 2000, exercise_goal || 30);

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
  const stats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(id) as any;

  res.json({
    ...profile,
    pet_stats: {
      fullness: stats.fullness,
      fitness: stats.fitness,
      happiness: stats.happiness,
      interaction_bonus: stats.interaction_bonus,
      is_stuffed: !!stats.is_stuffed,
      is_exhausted: !!stats.is_exhausted,
      last_updated: stats.last_updated,
      last_petted: stats.last_petted,
    },
    mood: 'content',
  });
});

// ─── Update Profile ───

app.put('/api/profiles/:id', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const allowed = ['name', 'pet_type', 'pet_name', 'avatar_color'];
  const updates: string[] = [];
  const values: any[] = [];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id) as any;
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;

  if (rawStats) {
    const petStats = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date(), getWeights(req.params.id));
    return res.json({ ...updated, pet_stats: petStats, mood: deriveMood(petStats) });
  }

  res.json({ ...updated, pet_stats: null, mood: 'content' });
});

// ─── Pet Interaction ───

app.post('/api/profiles/:id/pet', (req, res) => {
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (!rawStats) return res.status(404).json({ error: 'Profile not found' });

  const current = calculateDecay({
    fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
    interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
    is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
  }, new Date(), getWeights(req.params.id));

  const updated = applyPetting(current);

  db.prepare(`
    UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
      interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?, last_petted = ?
    WHERE profile_id = ?
  `).run(
    updated.fullness, updated.fitness, updated.happiness,
    updated.interaction_bonus, updated.is_stuffed ? 1 : 0, updated.is_exhausted ? 1 : 0,
    updated.last_updated, updated.last_petted, req.params.id
  );

  // Award XP for petting (only if petting actually happened — i.e., stats changed)
  if (updated.last_petted !== current.last_petted) {
    const progression = awardXp(req.params.id, 2);
    return res.json({ pet_stats: updated, mood: deriveMood(updated), xp_gained: 2, ...progression });
  }

  res.json({ pet_stats: updated, mood: deriveMood(updated) });
});

// ─── Food Entries ───

app.get('/api/profiles/:id/food', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const entries = db.prepare(`
    SELECT *,
      ROUND(calories * quantity) as display_calories,
      ROUND(protein * quantity, 1) as display_protein,
      ROUND(carbs * quantity, 1) as display_carbs,
      ROUND(fat * quantity, 1) as display_fat,
      ROUND(fiber * quantity, 1) as display_fiber
    FROM food_entries WHERE profile_id = ? AND date(created_at) = ? ORDER BY created_at DESC
  `).all(req.params.id, date);
  res.json(entries);
});

app.post('/api/profiles/:id/food', (req, res) => {
  const { name, calories, protein, carbs, fat, fiber, meal_type, quantity, quantity_unit, serving_grams } = req.body;
  const id = crypto.randomUUID();

  db.prepare(
    'INSERT INTO food_entries (id, profile_id, name, calories, protein, carbs, fat, fiber, meal_type, quantity, quantity_unit, serving_grams) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, name, calories, protein || 0, carbs || 0, fat || 0, fiber || 0, meal_type, quantity || 1, quantity_unit || 'serving', serving_grams || null);

  // Update streak
  updateStreak(req.params.id);

  // Update pet stats
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (rawStats) {
    const weights = getWeights(req.params.id);
    const current = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date(), weights);

    const settings = db.prepare('SELECT tracking_mode FROM settings WHERE profile_id = ?').get(req.params.id) as any;
    const trackingMode = settings?.tracking_mode || 'structured';
    const updated = applyFood(current, calories, protein || 0, fiber || 0, trackingMode, weights);

    db.prepare(`
      UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
        interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?
      WHERE profile_id = ?
    `).run(
      updated.fullness, updated.fitness, updated.happiness,
      updated.interaction_bonus, updated.is_stuffed ? 1 : 0, updated.is_exhausted ? 1 : 0,
      updated.last_updated, req.params.id
    );

    // Award XP
    const firstToday = isFirstLogToday(req.params.id, 'food_entries');
    const xpGains = calculateFoodXp(calories, protein || 0, carbs || 0, fat || 0, fiber || 0, firstToday);
    const streak = db.prepare('SELECT current_streak FROM streaks WHERE profile_id = ?').get(req.params.id) as any;
    if (streak) xpGains.push(...calculateStreakXp(streak.current_streak));
    const totalXp = xpGains.reduce((sum, g) => sum + g.xp_gained, 0);
    const progression = awardXp(req.params.id, totalXp);

    // Check achievements
    const hour = new Date().getHours();
    const newAchievements = checkAchievements(req.params.id, { event: 'food', streak: streak?.current_streak, level: progression.level, meal_type, hour });

    const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(id);
    return res.json({ entry, pet_stats: updated, mood: deriveMood(updated), xp_gained: totalXp, ...progression, new_achievements: newAchievements });
  }

  const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(id);
  res.json({ entry });
});

app.put('/api/food/:id', (req, res) => {
  const { quantity, quantity_unit } = req.body;
  const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(req.params.id) as any;
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  db.prepare('UPDATE food_entries SET quantity = ?, quantity_unit = ? WHERE id = ?')
    .run(quantity, quantity_unit || entry.quantity_unit, req.params.id);

  const updated = db.prepare(`
    SELECT *,
      ROUND(calories * quantity) as display_calories,
      ROUND(protein * quantity, 1) as display_protein,
      ROUND(carbs * quantity, 1) as display_carbs,
      ROUND(fat * quantity, 1) as display_fat,
      ROUND(fiber * quantity, 1) as display_fiber
    FROM food_entries WHERE id = ?
  `).get(req.params.id);
  res.json(updated);
});

app.delete('/api/food/:id', (req, res) => {
  db.prepare('DELETE FROM food_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Exercise Entries ───

app.get('/api/profiles/:id/exercise', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const entries = db.prepare(
    "SELECT * FROM exercise_entries WHERE profile_id = ? AND date(created_at) = ? ORDER BY created_at DESC"
  ).all(req.params.id, date);
  res.json(entries);
});

app.post('/api/profiles/:id/exercise', (req, res) => {
  const { name, exercise_type, duration_minutes, calories_burned, intensity } = req.body;
  const id = crypto.randomUUID();

  db.prepare(
    'INSERT INTO exercise_entries (id, profile_id, name, exercise_type, duration_minutes, calories_burned, intensity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, name, exercise_type, duration_minutes, calories_burned || 0, intensity);

  // Update streak
  updateStreak(req.params.id);

  // Update pet stats
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (rawStats) {
    const weights = getWeights(req.params.id);
    const current = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date(), weights);

    const updated = applyExercise(current, duration_minutes, intensity, weights);

    db.prepare(`
      UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
        interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?
      WHERE profile_id = ?
    `).run(
      updated.fullness, updated.fitness, updated.happiness,
      updated.interaction_bonus, updated.is_stuffed ? 1 : 0, updated.is_exhausted ? 1 : 0,
      updated.last_updated, req.params.id
    );

    // Award XP
    const firstToday = isFirstLogToday(req.params.id, 'exercise_entries');
    const xpGains = calculateExerciseXp(intensity, firstToday);
    const streak = db.prepare('SELECT current_streak FROM streaks WHERE profile_id = ?').get(req.params.id) as any;
    if (streak) xpGains.push(...calculateStreakXp(streak.current_streak));
    const totalXp = xpGains.reduce((sum, g) => sum + g.xp_gained, 0);
    const progression = awardXp(req.params.id, totalXp);

    // Check achievements
    const newAchievements = checkAchievements(req.params.id, { event: 'exercise', streak: streak?.current_streak, level: progression.level });

    const entry = db.prepare('SELECT * FROM exercise_entries WHERE id = ?').get(id);
    return res.json({ entry, pet_stats: updated, mood: deriveMood(updated), xp_gained: totalXp, ...progression, new_achievements: newAchievements });
  }

  const entry = db.prepare('SELECT * FROM exercise_entries WHERE id = ?').get(id);
  res.json({ entry });
});

app.delete('/api/exercise/:id', (req, res) => {
  db.prepare('DELETE FROM exercise_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Daily Summary ───

app.get('/api/profiles/:id/summary', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];

  const foodSummary = db.prepare(`
    SELECT
      COUNT(*) as meal_count,
      COALESCE(SUM(calories * quantity), 0) as total_calories,
      COALESCE(SUM(protein * quantity), 0) as total_protein,
      COALESCE(SUM(carbs * quantity), 0) as total_carbs,
      COALESCE(SUM(fat * quantity), 0) as total_fat,
      COALESCE(SUM(fiber * quantity), 0) as total_fiber
    FROM food_entries WHERE profile_id = ? AND date(created_at) = ?
  `).get(req.params.id, date);

  const exerciseSummary = db.prepare(`
    SELECT
      COUNT(*) as exercise_count,
      COALESCE(SUM(duration_minutes), 0) as total_minutes,
      COALESCE(SUM(calories_burned), 0) as total_burned
    FROM exercise_entries WHERE profile_id = ? AND date(created_at) = ?
  `).get(req.params.id, date);

  const settings = db.prepare('SELECT calorie_goal, exercise_goal, tracking_mode FROM settings WHERE profile_id = ?').get(req.params.id) as any;
  const goals = settings || { calorie_goal: 2000, exercise_goal: 30, tracking_mode: 'casual' };

  // Fetch activity metrics for the day (active calories, steps, etc.)
  const activityRows = db.prepare(
    'SELECT metric, value FROM activity_metrics WHERE profile_id = ? AND date = ?'
  ).all(req.params.id, date) as any[];
  const activity: Record<string, number> = {};
  for (const row of activityRows) {
    activity[row.metric] = Math.round(row.value);
  }

  res.json({ food: foodSummary, exercise: exerciseSummary, goals, activity });
});

// ─── Calendar / History ───

app.get('/api/profiles/:id/calendar', (req, res) => {
  const month = req.query.month as string; // YYYY-MM
  if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

  const foodDays = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM food_entries WHERE profile_id = ? AND strftime('%Y-%m', created_at) = ?
    GROUP BY date(created_at)
  `).all(req.params.id, month) as any[];

  const exerciseDays = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM exercise_entries WHERE profile_id = ? AND strftime('%Y-%m', created_at) = ?
    GROUP BY date(created_at)
  `).all(req.params.id, month) as any[];

  const foodMap = new Map(foodDays.map((d: any) => [d.date, d.count]));
  const exerciseMap = new Map(exerciseDays.map((d: any) => [d.date, d.count]));
  const allDates = new Set([...foodMap.keys(), ...exerciseMap.keys()]);

  const result = Array.from(allDates).map((date) => ({
    date,
    has_food: foodMap.has(date),
    has_exercise: exerciseMap.has(date),
    food_count: foodMap.get(date) || 0,
    exercise_count: exerciseMap.get(date) || 0,
  }));

  res.json(result);
});

app.get('/api/profiles/:id/weekly-summary', (req, res) => {
  const weekStart = req.query.week_start as string; // YYYY-MM-DD
  if (!weekStart) return res.status(400).json({ error: 'week_start required (YYYY-MM-DD)' });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const food = db.prepare(`
    SELECT
      COUNT(*) as total_meals,
      COALESCE(SUM(calories * quantity), 0) as total_calories,
      COALESCE(SUM(protein * quantity), 0) as total_protein,
      COALESCE(SUM(carbs * quantity), 0) as total_carbs,
      COALESCE(SUM(fat * quantity), 0) as total_fat,
      COALESCE(SUM(fiber * quantity), 0) as total_fiber,
      COUNT(DISTINCT date(created_at)) as days_with_food
    FROM food_entries WHERE profile_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
  `).get(req.params.id, weekStart, weekEndStr) as any;

  const exercise = db.prepare(`
    SELECT
      COUNT(*) as total_exercises,
      COALESCE(SUM(duration_minutes), 0) as total_minutes,
      COALESCE(SUM(calories_burned), 0) as total_burned,
      COUNT(DISTINCT date(created_at)) as days_with_exercise
    FROM exercise_entries WHERE profile_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
  `).get(req.params.id, weekStart, weekEndStr) as any;

  const daysLogged = db.prepare(`
    SELECT COUNT(DISTINCT d) as count FROM (
      SELECT date(created_at) as d FROM food_entries WHERE profile_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
      UNION
      SELECT date(created_at) as d FROM exercise_entries WHERE profile_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
    )
  `).get(req.params.id, weekStart, weekEndStr, req.params.id, weekStart, weekEndStr) as any;

  res.json({
    week_start: weekStart,
    week_end: weekEndStr,
    food,
    exercise,
    days_logged: daysLogged.count,
    avg_daily_calories: food.days_with_food > 0 ? Math.round(food.total_calories / food.days_with_food) : 0,
  });
});

app.get('/api/profiles/:id/streaks', (req, res) => {
  const streak = db.prepare('SELECT * FROM streaks WHERE profile_id = ?').get(req.params.id) as any;
  if (!streak) return res.json({ current_streak: 0, longest_streak: 0, last_logged_date: null });
  res.json({ current_streak: streak.current_streak, longest_streak: streak.longest_streak, last_logged_date: streak.last_logged_date });
});

// ─── Progression ───

app.get('/api/profiles/:id/progression', (req, res) => {
  ensureProgression(req.params.id);
  const prog = db.prepare('SELECT * FROM pet_progression WHERE profile_id = ?').get(req.params.id) as any;
  const nextLevel = xpToNextLevel(prog.xp);
  res.json({ xp: prog.xp, level: prog.level, treats: prog.treats, ...nextLevel });
});

app.post('/api/profiles/:id/treat', (req, res) => {
  ensureProgression(req.params.id);
  const prog = db.prepare('SELECT * FROM pet_progression WHERE profile_id = ?').get(req.params.id) as any;
  if (prog.treats <= 0) return res.status(400).json({ error: 'No treats available' });

  db.prepare('UPDATE pet_progression SET treats = treats - 1 WHERE profile_id = ?').run(req.params.id);

  // Apply treat bonus to pet stats
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (rawStats) {
    const weights = getWeights(req.params.id);
    const current = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date(), weights);

    const interaction_bonus = Math.min(current.interaction_bonus + 15, 20);
    // Use the same weighted happiness formula
    const total = weights.food + weights.exercise + weights.interaction;
    const wF = total > 0 ? weights.food / total : 0.4;
    const wE = total > 0 ? weights.exercise / total : 0.4;
    const wI = total > 0 ? weights.interaction / total : 0.2;
    const happiness = Math.max(10, Math.min(100, current.fullness * wF + current.fitness * wE + (interaction_bonus * 5) * wI));

    db.prepare(`
      UPDATE pet_stats SET interaction_bonus = ?, happiness = ?, last_updated = ?
      WHERE profile_id = ?
    `).run(interaction_bonus, happiness, new Date().toISOString(), req.params.id);

    const updated = { ...current, interaction_bonus, happiness, last_updated: new Date().toISOString() };
    return res.json({ pet_stats: updated, mood: deriveMood(updated), treats: prog.treats - 1 });
  }

  res.json({ treats: prog.treats - 1 });
});

// ─── Achievements ───

app.get('/api/profiles/:id/achievements', (req, res) => {
  res.json(getProfileAchievements(req.params.id));
});

// ─── Accessories ───

app.get('/api/profiles/:id/accessories', (req, res) => {
  res.json(getAccessories(req.params.id));
});

app.get('/api/profiles/:id/accessories/equipped', (req, res) => {
  res.json(getEquipped(req.params.id));
});

app.put('/api/profiles/:id/accessories/equip', (req, res) => {
  const { category, accessory_key } = req.body;
  if (!category) return res.status(400).json({ error: 'category required' });
  equipAccessory(req.params.id, category, accessory_key || null);
  res.json(getEquipped(req.params.id));
});

// ─── Checklists ───

app.get('/api/profiles/:id/checklist', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date(date + 'T12:00:00').getDay().toString(); // 0=Sun

  // Get all non-archived items for this profile
  const items = db.prepare(`
    SELECT * FROM checklist_items WHERE profile_id = ? AND archived = 0
  `).all(req.params.id) as any[];

  // Filter to items applicable on this date
  const applicable = items.filter(item => {
    if (item.recurrence === 'once') {
      return item.scheduled_date === date || (!item.scheduled_date && date === new Date().toISOString().split('T')[0]);
    }
    if (item.recurrence === 'daily') return true;
    if (item.recurrence === 'weekly') {
      const days = item.recurrence_days.split(',');
      return days.includes(dayOfWeek);
    }
    return false;
  });

  // Check completions
  const completions = db.prepare(`
    SELECT item_id FROM checklist_completions WHERE profile_id = ? AND completed_date = ?
  `).all(req.params.id, date) as any[];
  const completedSet = new Set(completions.map((c: any) => c.item_id));

  const result = applicable.map(item => ({
    ...item,
    completed: completedSet.has(item.id),
  }));

  res.json(result);
});

app.post('/api/profiles/:id/checklist', (req, res) => {
  const { title, icon, recurrence, recurrence_days, scheduled_date } = req.body;
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO checklist_items (id, profile_id, title, icon, recurrence, recurrence_days, scheduled_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, title, icon || 'check', recurrence || 'once', recurrence_days || '', scheduled_date || null);

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id);
  res.json(item);
});

app.put('/api/checklist/:id', (req, res) => {
  const { title, icon, recurrence, recurrence_days, scheduled_date } = req.body;
  const fields: string[] = [];
  const values: any[] = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
  if (recurrence !== undefined) { fields.push('recurrence = ?'); values.push(recurrence); }
  if (recurrence_days !== undefined) { fields.push('recurrence_days = ?'); values.push(recurrence_days); }
  if (scheduled_date !== undefined) { fields.push('scheduled_date = ?'); values.push(scheduled_date); }

  if (fields.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
  res.json(item);
});

app.delete('/api/checklist/:id', (req, res) => {
  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/checklist/:id/complete', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id) as any;
  if (!item) return res.status(404).json({ error: 'Item not found' });

  // Insert completion
  const compId = crypto.randomUUID();
  db.prepare('INSERT OR IGNORE INTO checklist_completions (id, item_id, profile_id, completed_date) VALUES (?, ?, ?, ?)')
    .run(compId, req.params.id, item.profile_id, date);

  // Auto-archive one-time items
  if (item.recurrence === 'once') {
    db.prepare('UPDATE checklist_items SET archived = 1 WHERE id = ?').run(req.params.id);
  }

  // Award pet rewards
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(item.profile_id) as any;
  let petResponse: any = {};
  if (rawStats) {
    const weights = getWeights(item.profile_id);
    const current = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date(), weights);

    const fullness = Math.min(100, current.fullness + 5);
    const interaction_bonus = Math.min(20, current.interaction_bonus + 3);
    const total = weights.food + weights.exercise + weights.interaction;
    const wF = total > 0 ? weights.food / total : 0.4;
    const wE = total > 0 ? weights.exercise / total : 0.4;
    const wI = total > 0 ? weights.interaction / total : 0.2;
    const happiness = Math.max(10, Math.min(100, fullness * wF + current.fitness * wE + (interaction_bonus * 5) * wI));

    db.prepare(`UPDATE pet_stats SET fullness = ?, interaction_bonus = ?, happiness = ?, last_updated = ? WHERE profile_id = ?`)
      .run(fullness, interaction_bonus, happiness, new Date().toISOString(), item.profile_id);

    const updated = { ...current, fullness, interaction_bonus, happiness, last_updated: new Date().toISOString() };
    petResponse = { pet_stats: updated, mood: deriveMood(updated) };
  }

  // Award XP
  const progression = awardXp(item.profile_id, 8);

  // Update streak
  updateStreak(item.profile_id);

  res.json({ completed: true, ...petResponse, xp_gained: 8, ...progression });
});

app.delete('/api/checklist/:id/complete', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  db.prepare('DELETE FROM checklist_completions WHERE item_id = ? AND completed_date = ?').run(req.params.id, date);

  // Un-archive if it was a one-time item
  db.prepare('UPDATE checklist_items SET archived = 0 WHERE id = ? AND recurrence = ?').run(req.params.id, 'once');

  res.json({ completed: false });
});

// ─── Settings ───

app.get('/api/profiles/:id/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE profile_id = ?').get(req.params.id);
  if (!settings) return res.status(404).json({ error: 'Settings not found' });
  res.json(settings);
});

app.put('/api/profiles/:id/settings', (req, res) => {
  const existing = db.prepare('SELECT * FROM settings WHERE profile_id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Settings not found' });

  const fields = [
    'calorie_goal', 'exercise_goal', 'tracking_mode',
    'protein_target', 'carbs_target', 'fat_target', 'meal_frequency',
    'track_calories', 'track_macros', 'track_exercise',
    'ntfy_enabled', 'ntfy_server', 'ntfy_topic', 'ntfy_pet_alerts', 'ntfy_goal_reminders',
    'blocker_enabled', 'blocker_mode',
  ];

  const updates: string[] = [];
  const values: any[] = [];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE profile_id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM settings WHERE profile_id = ?').get(req.params.id);
  res.json(updated);
});

// ─── App Blocker ───

app.get('/api/profiles/:id/food-status', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const foodCount = db.prepare(
    "SELECT COUNT(*) as count FROM food_entries WHERE profile_id = ? AND date(created_at) = ?"
  ).get(req.params.id, today) as any;

  const lastEntry = db.prepare(
    "SELECT created_at FROM food_entries WHERE profile_id = ? AND date(created_at) = ? ORDER BY created_at DESC LIMIT 1"
  ).get(req.params.id, today) as any;

  const bypass = db.prepare(
    "SELECT 1 FROM blocker_bypasses WHERE profile_id = ? AND bypass_date = ?"
  ).get(req.params.id, today);

  const settings = db.prepare(
    "SELECT blocker_enabled, blocker_mode FROM settings WHERE profile_id = ?"
  ).get(req.params.id) as any;

  res.json({
    logged_today: foodCount.count > 0,
    entry_count: foodCount.count,
    last_logged_at: lastEntry?.created_at || null,
    blocker_mode: settings?.blocker_mode || 'gentle',
    bypass_active: !!bypass,
    blocker_enabled: !!settings?.blocker_enabled,
  });
});

app.post('/api/profiles/:id/food-status/bypass', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.prepare(
    "INSERT OR IGNORE INTO blocker_bypasses (profile_id, bypass_date) VALUES (?, ?)"
  ).run(req.params.id, today);
  res.json({ bypassed: true, date: today });
});

// ─── Exercise Import ───

// Store last webhook payload for debugging
let lastWebhookPayload: { timestamp: string; profileId: string; body: any; result?: any; error?: string } | null = null;

// GET endpoint to verify the webhook URL is reachable
app.get('/api/profiles/:id/exercise/import/health-auto-export', (req, res) => {
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(req.params.id);
  res.json({ ok: true, profile_found: !!profile, message: 'Webhook URL is reachable. Send a POST request with workout data.' });
});

// Debug endpoint: see last webhook payload and parse result
app.get('/api/debug/last-webhook', (_req, res) => {
  res.json(lastWebhookPayload || { message: 'No webhook received yet since last server restart' });
});

app.post('/api/profiles/:id/exercise/import/health-auto-export', (req, res) => {
  console.log('[Health Import] Received webhook for profile:', req.params.id);
  console.log('[Health Import] Body:', JSON.stringify(req.body).slice(0, 2000));
  console.log('[Health Import] Top-level keys:', Object.keys(req.body || {}));
  if (req.body?.data) console.log('[Health Import] data keys:', Object.keys(req.body.data));

  lastWebhookPayload = { timestamp: new Date().toISOString(), profileId: req.params.id, body: req.body };

  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(req.params.id);
  if (!profile) {
    console.log('[Health Import] Profile not found:', req.params.id);
    return res.status(404).json({ error: 'Profile not found' });
  }

  try {
    const { workouts, metrics } = parseHealthAutoExport(req.body);
    console.log('[Health Import] Parsed workouts:', workouts.length, workouts.map(e => ({ name: e.name, duration: e.duration_minutes, cal: e.calories_burned })));
    console.log('[Health Import] Parsed metrics:', metrics.length, metrics.map(m => ({ metric: m.metric, value: m.value })));
    const result = importExerciseEntries(req.params.id, workouts);
    const metricsResult = importActivityMetrics(req.params.id, metrics);
    const response = { ...result, metrics_imported: metricsResult.imported };
    lastWebhookPayload!.result = { workouts_parsed: workouts.length, metrics_parsed: metrics.length, ...response };
    console.log('[Health Import] Result:', response);
    res.json(response);
  } catch (err: any) {
    console.error('[Health Import] Error:', err.message);
    if (lastWebhookPayload) lastWebhookPayload.error = err.message;
    res.status(400).json({ error: 'Import failed', details: err.message });
  }
});

// ─── Activity Metrics ───

app.get('/api/profiles/:id/activity', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const rows = db.prepare(
    'SELECT metric, value, updated_at FROM activity_metrics WHERE profile_id = ? AND date = ?'
  ).all(req.params.id, date) as any[];
  const activity: Record<string, { value: number; updated_at: string }> = {};
  for (const row of rows) {
    activity[row.metric] = { value: Math.round(row.value), updated_at: row.updated_at };
  }
  res.json({ date, activity });
});

// ─── Notifications ───

app.post('/api/profiles/:id/notifications/test', async (req, res) => {
  const settings = db.prepare('SELECT ntfy_server, ntfy_topic FROM settings WHERE profile_id = ?').get(req.params.id) as any;
  if (!settings || !settings.ntfy_topic) return res.status(400).json({ error: 'ntfy not configured' });

  const success = await sendNotification(
    settings.ntfy_server,
    settings.ntfy_topic,
    '🐾 Test from Critter!',
    'Notifications are working! Your pet says hi!',
    3,
  );

  res.json({ success });
});

// ─── Food Search (Open Food Facts) ───

app.get('/api/food-search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);
  try {
    const results = await searchFoods(query);
    res.json(results);
  } catch {
    res.json([]);
  }
});

app.get('/api/food-barcode/:barcode', async (req, res) => {
  try {
    const result = await lookupBarcodeAPI(req.params.barcode);
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Food app server running on port ${PORT}`);
  startNotificationScheduler();
});
