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

  CREATE TABLE IF NOT EXISTS streaks (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_logged_date TEXT
  );

  CREATE TABLE IF NOT EXISTS pet_progression (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    treats INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, achievement_key)
  );

  CREATE TABLE IF NOT EXISTS pet_equipped (
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    accessory_key TEXT NOT NULL,
    PRIMARY KEY (profile_id, category)
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'check',
    recurrence TEXT NOT NULL DEFAULT 'once' CHECK(recurrence IN ('once', 'daily', 'weekly')),
    recurrence_days TEXT NOT NULL DEFAULT '',
    scheduled_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS checklist_completions (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    completed_date TEXT NOT NULL,
    UNIQUE(item_id, completed_date)
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

// Add quantity/unit columns to food_entries if they don't exist
const foodCols = db.prepare("PRAGMA table_info(food_entries)").all() as any[];
if (!foodCols.find((c: any) => c.name === 'quantity')) {
  db.prepare("ALTER TABLE food_entries ADD COLUMN quantity REAL NOT NULL DEFAULT 1").run();
  db.prepare("ALTER TABLE food_entries ADD COLUMN quantity_unit TEXT NOT NULL DEFAULT 'serving'").run();
  db.prepare("ALTER TABLE food_entries ADD COLUMN serving_grams REAL").run();
}

// Add happiness weight settings columns
const settingsCols = db.prepare("PRAGMA table_info(settings)").all() as any[];
if (!settingsCols.find((c: any) => c.name === 'happiness_food')) {
  db.prepare("ALTER TABLE settings ADD COLUMN happiness_food INTEGER NOT NULL DEFAULT 50").run();
  db.prepare("ALTER TABLE settings ADD COLUMN happiness_exercise INTEGER NOT NULL DEFAULT 30").run();
  db.prepare("ALTER TABLE settings ADD COLUMN happiness_interaction INTEGER NOT NULL DEFAULT 20").run();
}

export default db;
