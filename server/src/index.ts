import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import { calculateDecay, applyFood, applyExercise, applyPetting, deriveMood } from './pet-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3003;

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
    }, now);

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

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
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

// ─── Pet Interaction ───

app.post('/api/profiles/:id/pet', (req, res) => {
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (!rawStats) return res.status(404).json({ error: 'Profile not found' });

  const current = calculateDecay({
    fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
    interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
    is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
  }, new Date());

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

  res.json({ pet_stats: updated, mood: deriveMood(updated) });
});

// ─── Food Entries ───

app.get('/api/profiles/:id/food', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const entries = db.prepare(
    "SELECT * FROM food_entries WHERE profile_id = ? AND date(created_at) = ? ORDER BY created_at DESC"
  ).all(req.params.id, date);
  res.json(entries);
});

app.post('/api/profiles/:id/food', (req, res) => {
  const { name, calories, protein, carbs, fat, fiber, meal_type } = req.body;
  const id = crypto.randomUUID();

  db.prepare(
    'INSERT INTO food_entries (id, profile_id, name, calories, protein, carbs, fat, fiber, meal_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, name, calories, protein || 0, carbs || 0, fat || 0, fiber || 0, meal_type);

  // Update pet stats
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (rawStats) {
    const current = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date());

    const updated = applyFood(current, calories, protein || 0, fiber || 0);

    db.prepare(`
      UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
        interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?
      WHERE profile_id = ?
    `).run(
      updated.fullness, updated.fitness, updated.happiness,
      updated.interaction_bonus, updated.is_stuffed ? 1 : 0, updated.is_exhausted ? 1 : 0,
      updated.last_updated, req.params.id
    );

    const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(id);
    return res.json({ entry, pet_stats: updated, mood: deriveMood(updated) });
  }

  const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(id);
  res.json({ entry });
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

  // Update pet stats
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(req.params.id) as any;
  if (rawStats) {
    const current = calculateDecay({
      fullness: rawStats.fullness, fitness: rawStats.fitness, happiness: rawStats.happiness,
      interaction_bonus: rawStats.interaction_bonus, is_stuffed: !!rawStats.is_stuffed,
      is_exhausted: !!rawStats.is_exhausted, last_updated: rawStats.last_updated, last_petted: rawStats.last_petted,
    }, new Date());

    const updated = applyExercise(current, duration_minutes, intensity);

    db.prepare(`
      UPDATE pet_stats SET fullness = ?, fitness = ?, happiness = ?,
        interaction_bonus = ?, is_stuffed = ?, is_exhausted = ?, last_updated = ?
      WHERE profile_id = ?
    `).run(
      updated.fullness, updated.fitness, updated.happiness,
      updated.interaction_bonus, updated.is_stuffed ? 1 : 0, updated.is_exhausted ? 1 : 0,
      updated.last_updated, req.params.id
    );

    const entry = db.prepare('SELECT * FROM exercise_entries WHERE id = ?').get(id);
    return res.json({ entry, pet_stats: updated, mood: deriveMood(updated) });
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
      COALESCE(SUM(calories), 0) as total_calories,
      COALESCE(SUM(protein), 0) as total_protein,
      COALESCE(SUM(carbs), 0) as total_carbs,
      COALESCE(SUM(fat), 0) as total_fat,
      COALESCE(SUM(fiber), 0) as total_fiber
    FROM food_entries WHERE profile_id = ? AND date(created_at) = ?
  `).get(req.params.id, date);

  const exerciseSummary = db.prepare(`
    SELECT
      COUNT(*) as exercise_count,
      COALESCE(SUM(duration_minutes), 0) as total_minutes,
      COALESCE(SUM(calories_burned), 0) as total_burned
    FROM exercise_entries WHERE profile_id = ? AND date(created_at) = ?
  `).get(req.params.id, date);

  const profile = db.prepare('SELECT calorie_goal, exercise_goal FROM profiles WHERE id = ?').get(req.params.id) as any;

  res.json({ food: foodSummary, exercise: exerciseSummary, goals: profile });
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Food app server running on port ${PORT}`);
});
