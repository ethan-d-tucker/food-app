import db from './database.js';

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_meal', name: 'First Bite', description: 'Log your first food entry', icon: '🍽️' },
  { key: 'first_workout', name: 'Get Moving', description: 'Log your first exercise', icon: '💪' },
  { key: 'streak_3', name: 'Committed', description: 'Reach a 3-day streak', icon: '🔥' },
  { key: 'streak_7', name: 'Weekly Warrior', description: 'Reach a 7-day streak', icon: '⚡' },
  { key: 'streak_14', name: 'Two Weeks Strong', description: 'Reach a 14-day streak', icon: '🏆' },
  { key: 'streak_30', name: 'Monthly Champion', description: 'Reach a 30-day streak', icon: '👑' },
  { key: 'meals_25', name: 'Regular Eater', description: 'Log 25 meals', icon: '🥗' },
  { key: 'meals_50', name: 'Foodie', description: 'Log 50 meals', icon: '🧑‍🍳' },
  { key: 'meals_100', name: 'Master Chef', description: 'Log 100 meals', icon: '🏅' },
  { key: 'workouts_10', name: 'Getting Fit', description: 'Log 10 workouts', icon: '🏋️' },
  { key: 'workouts_25', name: 'Athlete', description: 'Log 25 workouts', icon: '🎽' },
  { key: 'level_5', name: 'Growing Up', description: 'Reach level 5', icon: '🌱' },
  { key: 'level_10', name: 'Seasoned', description: 'Reach level 10', icon: '🌳' },
  { key: 'early_bird', name: 'Early Bird', description: 'Log breakfast before 8 AM', icon: '🌅' },
  { key: 'night_owl', name: 'Night Owl', description: 'Log food after 10 PM', icon: '🦉' },
  { key: 'variety_5', name: 'Diverse Plate', description: 'Log 5 different exercise types', icon: '🎯' },
];

function hasAchievement(profileId: string, key: string): boolean {
  const row = db.prepare('SELECT 1 FROM achievements WHERE profile_id = ? AND achievement_key = ?').get(profileId, key);
  return !!row;
}

function unlockAchievement(profileId: string, key: string): AchievementDef | null {
  if (hasAchievement(profileId, key)) return null;
  const def = ACHIEVEMENTS.find(a => a.key === key);
  if (!def) return null;
  db.prepare('INSERT INTO achievements (id, profile_id, achievement_key) VALUES (?, ?, ?)').run(crypto.randomUUID(), profileId, key);
  return def;
}

export function checkAchievements(profileId: string, context: {
  event: 'food' | 'exercise' | 'level_up';
  streak?: number;
  level?: number;
  meal_type?: string;
  hour?: number;
}): AchievementDef[] {
  const unlocked: AchievementDef[] = [];

  const tryUnlock = (key: string) => {
    const result = unlockAchievement(profileId, key);
    if (result) unlocked.push(result);
  };

  if (context.event === 'food') {
    // First meal
    const foodCount = db.prepare("SELECT COUNT(*) as c FROM food_entries WHERE profile_id = ?").get(profileId) as any;
    if (foodCount.c >= 1) tryUnlock('first_meal');
    if (foodCount.c >= 25) tryUnlock('meals_25');
    if (foodCount.c >= 50) tryUnlock('meals_50');
    if (foodCount.c >= 100) tryUnlock('meals_100');

    // Time-based
    if (context.hour !== undefined) {
      if (context.hour < 8 && context.meal_type === 'breakfast') tryUnlock('early_bird');
      if (context.hour >= 22) tryUnlock('night_owl');
    }
  }

  if (context.event === 'exercise') {
    const exerciseCount = db.prepare("SELECT COUNT(*) as c FROM exercise_entries WHERE profile_id = ?").get(profileId) as any;
    if (exerciseCount.c >= 1) tryUnlock('first_workout');
    if (exerciseCount.c >= 10) tryUnlock('workouts_10');
    if (exerciseCount.c >= 25) tryUnlock('workouts_25');

    // Variety check
    const types = db.prepare("SELECT COUNT(DISTINCT exercise_type) as c FROM exercise_entries WHERE profile_id = ?").get(profileId) as any;
    if (types.c >= 5) tryUnlock('variety_5');
  }

  // Streak achievements
  if (context.streak) {
    if (context.streak >= 3) tryUnlock('streak_3');
    if (context.streak >= 7) tryUnlock('streak_7');
    if (context.streak >= 14) tryUnlock('streak_14');
    if (context.streak >= 30) tryUnlock('streak_30');
  }

  // Level achievements
  if (context.level) {
    if (context.level >= 5) tryUnlock('level_5');
    if (context.level >= 10) tryUnlock('level_10');
  }

  return unlocked;
}

export function getProfileAchievements(profileId: string) {
  const unlocked = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE profile_id = ? ORDER BY unlocked_at DESC').all(profileId) as any[];
  const unlockedMap = new Map(unlocked.map(a => [a.achievement_key, a.unlocked_at]));

  return ACHIEVEMENTS.map(def => ({
    ...def,
    unlocked: unlockedMap.has(def.key),
    unlocked_at: unlockedMap.get(def.key) || null,
  }));
}
