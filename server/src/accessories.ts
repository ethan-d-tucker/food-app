import db from './database.js';

export interface AccessoryDef {
  key: string;
  name: string;
  category: 'hat' | 'glasses' | 'scarf' | 'necklace';
  unlock_type: 'level' | 'achievement' | 'streak' | 'default';
  unlock_value: string;
  emoji: string;
}

export const ACCESSORIES: AccessoryDef[] = [
  // Hats
  { key: 'baseball_cap', name: 'Baseball Cap', category: 'hat', unlock_type: 'default', unlock_value: '', emoji: '🧢' },
  { key: 'party_hat', name: 'Party Hat', category: 'hat', unlock_type: 'level', unlock_value: '2', emoji: '🎉' },
  { key: 'flower_crown', name: 'Flower Crown', category: 'hat', unlock_type: 'streak', unlock_value: '7', emoji: '🌸' },
  { key: 'chef_hat', name: 'Chef Hat', category: 'hat', unlock_type: 'achievement', unlock_value: 'meals_50', emoji: '👨‍🍳' },
  { key: 'crown', name: 'Crown', category: 'hat', unlock_type: 'level', unlock_value: '10', emoji: '👑' },
  { key: 'beanie', name: 'Beanie', category: 'hat', unlock_type: 'level', unlock_value: '3', emoji: '🧶' },

  // Glasses
  { key: 'round_glasses', name: 'Round Glasses', category: 'glasses', unlock_type: 'level', unlock_value: '3', emoji: '👓' },
  { key: 'sunglasses', name: 'Sunglasses', category: 'glasses', unlock_type: 'streak', unlock_value: '14', emoji: '🕶️' },
  { key: 'star_glasses', name: 'Star Glasses', category: 'glasses', unlock_type: 'achievement', unlock_value: 'level_5', emoji: '⭐' },
  { key: 'monocle', name: 'Monocle', category: 'glasses', unlock_type: 'level', unlock_value: '7', emoji: '🧐' },

  // Scarves
  { key: 'red_scarf', name: 'Red Scarf', category: 'scarf', unlock_type: 'level', unlock_value: '4', emoji: '🧣' },
  { key: 'rainbow_scarf', name: 'Rainbow Scarf', category: 'scarf', unlock_type: 'achievement', unlock_value: 'variety_5', emoji: '🌈' },
  { key: 'bow_tie', name: 'Bow Tie', category: 'scarf', unlock_type: 'level', unlock_value: '6', emoji: '🎀' },

  // Necklaces
  { key: 'star_pendant', name: 'Star Pendant', category: 'necklace', unlock_type: 'achievement', unlock_value: 'first_meal', emoji: '⭐' },
  { key: 'heart_pendant', name: 'Heart Pendant', category: 'necklace', unlock_type: 'level', unlock_value: '5', emoji: '❤️' },
  { key: 'medal', name: 'Gold Medal', category: 'necklace', unlock_type: 'achievement', unlock_value: 'workouts_25', emoji: '🏅' },
];

function isUnlocked(profileId: string, acc: AccessoryDef): boolean {
  switch (acc.unlock_type) {
    case 'default':
      return true;
    case 'level': {
      const prog = db.prepare('SELECT level FROM pet_progression WHERE profile_id = ?').get(profileId) as any;
      return prog && prog.level >= Number(acc.unlock_value);
    }
    case 'streak': {
      const streak = db.prepare('SELECT longest_streak FROM streaks WHERE profile_id = ?').get(profileId) as any;
      return streak && streak.longest_streak >= Number(acc.unlock_value);
    }
    case 'achievement': {
      const ach = db.prepare('SELECT 1 FROM achievements WHERE profile_id = ? AND achievement_key = ?').get(profileId, acc.unlock_value);
      return !!ach;
    }
    default:
      return false;
  }
}

export function getAccessories(profileId: string) {
  const equipped = db.prepare('SELECT * FROM pet_equipped WHERE profile_id = ?').all(profileId) as any[];
  const equippedMap = new Map(equipped.map(e => [e.category, e.accessory_key]));

  return ACCESSORIES.map(acc => ({
    ...acc,
    unlocked: isUnlocked(profileId, acc),
    equipped: equippedMap.get(acc.category) === acc.key,
  }));
}

export function getEquipped(profileId: string) {
  const equipped = db.prepare('SELECT * FROM pet_equipped WHERE profile_id = ?').all(profileId) as any[];
  const result: Record<string, string> = {};
  equipped.forEach(e => { result[e.category] = e.accessory_key; });
  return result;
}

export function equipAccessory(profileId: string, category: string, accessoryKey: string | null) {
  if (accessoryKey === null) {
    db.prepare('DELETE FROM pet_equipped WHERE profile_id = ? AND category = ?').run(profileId, category);
  } else {
    db.prepare('INSERT OR REPLACE INTO pet_equipped (profile_id, category, accessory_key) VALUES (?, ?, ?)').run(profileId, category, accessoryKey);
  }
}
