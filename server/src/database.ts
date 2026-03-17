import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'food-app.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pet_type TEXT NOT NULL CHECK(pet_type IN ('red-panda', 'cat', 'hamster', 'frog')),
    pet_name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#E07A5F',
    calorie_goal INTEGER NOT NULL DEFAULT 2000,
    exercise_goal INTEGER NOT NULL DEFAULT 30,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pet_stats (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    fullness REAL NOT NULL DEFAULT 50,
    fitness REAL NOT NULL DEFAULT 50,
    happiness REAL NOT NULL DEFAULT 50,
    interaction_bonus REAL NOT NULL DEFAULT 0,
    is_stuffed INTEGER NOT NULL DEFAULT 0,
    is_exhausted INTEGER NOT NULL DEFAULT 0,
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),
    last_petted TEXT
  );

  CREATE TABLE IF NOT EXISTS food_entries (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    fiber REAL NOT NULL DEFAULT 0,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercise_entries (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exercise_type TEXT NOT NULL CHECK(exercise_type IN ('cardio', 'strength', 'flexibility', 'sports', 'walking')),
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER NOT NULL DEFAULT 0,
    intensity TEXT NOT NULL CHECK(intensity IN ('light', 'moderate', 'intense')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_food_profile_date ON food_entries(profile_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_exercise_profile_date ON exercise_entries(profile_id, created_at);

  CREATE TABLE IF NOT EXISTS settings (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    calorie_goal INTEGER NOT NULL DEFAULT 2000,
    exercise_goal INTEGER NOT NULL DEFAULT 30,
    tracking_mode TEXT NOT NULL DEFAULT 'casual' CHECK(tracking_mode IN ('casual', 'structured')),
    protein_target INTEGER NOT NULL DEFAULT 0,
    carbs_target INTEGER NOT NULL DEFAULT 0,
    fat_target INTEGER NOT NULL DEFAULT 0,
    meal_frequency INTEGER NOT NULL DEFAULT 3,
    track_calories INTEGER NOT NULL DEFAULT 1,
    track_macros INTEGER NOT NULL DEFAULT 0,
    track_exercise INTEGER NOT NULL DEFAULT 1,
    ntfy_enabled INTEGER NOT NULL DEFAULT 0,
    ntfy_server TEXT NOT NULL DEFAULT 'https://ntfy.sh',
    ntfy_topic TEXT NOT NULL DEFAULT '',
    ntfy_pet_alerts INTEGER NOT NULL DEFAULT 1,
    ntfy_goal_reminders INTEGER NOT NULL DEFAULT 0,
    blocker_enabled INTEGER NOT NULL DEFAULT 0,
    blocker_mode TEXT NOT NULL DEFAULT 'gentle' CHECK(blocker_mode IN ('gentle', 'hard'))
  );

  CREATE TABLE IF NOT EXISTS blocker_bypasses (
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bypass_date TEXT NOT NULL,
    PRIMARY KEY (profile_id, bypass_date)
  );
`);

// Migrate existing profiles that don't have settings rows
const profilesWithoutSettings = db.prepare(`
  SELECT p.id, p.calorie_goal, p.exercise_goal FROM profiles p
  LEFT JOIN settings s ON p.id = s.profile_id
  WHERE s.profile_id IS NULL
`).all() as any[];

for (const p of profilesWithoutSettings) {
  db.prepare('INSERT INTO settings (profile_id, calorie_goal, exercise_goal) VALUES (?, ?, ?)').run(p.id, p.calorie_goal, p.exercise_goal);
}

// Add source column to exercise_entries if it doesn't exist
const exerciseCols = db.prepare("PRAGMA table_info(exercise_entries)").all() as any[];
if (!exerciseCols.find((c: any) => c.name === 'source')) {
  db.prepare("ALTER TABLE exercise_entries ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'").run();
}

export default db;
