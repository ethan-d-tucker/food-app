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
`);

export default db;
