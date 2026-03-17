import db from './database.js';
import { calculateDecay, deriveMood, type PetStats } from './pet-engine.js';

// Cooldown tracking: profileId -> { mood, sentAt }
const cooldowns = new Map<string, { mood: string; sentAt: number }>();
const goalRemindersSent = new Map<string, string>(); // profileId -> date

export async function sendNotification(
  server: string,
  topic: string,
  title: string,
  message: string,
  priority: number = 3,
): Promise<boolean> {
  if (!topic) return false;
  try {
    const url = server.replace(/\/+$/, '');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        title,
        message,
        priority,
        tags: ['paw_prints'],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getPetStatsForProfile(profileId: string): PetStats | null {
  const rawStats = db.prepare('SELECT * FROM pet_stats WHERE profile_id = ?').get(profileId) as any;
  if (!rawStats) return null;

  return calculateDecay({
    fullness: rawStats.fullness,
    fitness: rawStats.fitness,
    happiness: rawStats.happiness,
    interaction_bonus: rawStats.interaction_bonus,
    is_stuffed: !!rawStats.is_stuffed,
    is_exhausted: !!rawStats.is_exhausted,
    last_updated: rawStats.last_updated,
    last_petted: rawStats.last_petted,
  }, new Date());
}

const moodMessages: Record<string, { title: string; body: string }> = {
  sad: { title: '😢 Your pet is feeling sad', body: 'Log some food or exercise to cheer them up!' },
  starving: { title: '😿 Your pet is starving!', body: "They're really hungry — time to log a meal!" },
  sick: { title: '🤢 Your pet feels sick', body: "They might be overfed or overworked. Give them a break!" },
};

export function checkPetAlerts(): void {
  const profiles = db.prepare(`
    SELECT s.profile_id, s.ntfy_server, s.ntfy_topic, s.ntfy_pet_alerts, s.ntfy_goal_reminders,
           s.calorie_goal, s.exercise_goal
    FROM settings s WHERE s.ntfy_enabled = 1 AND s.ntfy_topic != ''
  `).all() as any[];

  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();

  for (const profile of profiles) {
    // Pet mood alerts
    if (profile.ntfy_pet_alerts) {
      const stats = getPetStatsForProfile(profile.profile_id);
      if (stats) {
        const mood = deriveMood(stats);
        const alert = moodMessages[mood];

        if (alert) {
          const cooldown = cooldowns.get(profile.profile_id);
          const twoHours = 2 * 60 * 60 * 1000;

          if (!cooldown || cooldown.mood !== mood || now - cooldown.sentAt > twoHours) {
            sendNotification(profile.ntfy_server, profile.ntfy_topic, alert.title, alert.body, 4);
            cooldowns.set(profile.profile_id, { mood, sentAt: now });
          }
        }
      }
    }

    // Evening goal reminders (6 PM - 10 PM, once per day)
    if (profile.ntfy_goal_reminders && hour >= 18 && hour <= 22) {
      const lastReminder = goalRemindersSent.get(profile.profile_id);
      if (lastReminder === today) continue;

      const foodSummary = db.prepare(`
        SELECT COALESCE(SUM(calories * quantity), 0) as total_calories
        FROM food_entries WHERE profile_id = ? AND date(created_at) = ?
      `).get(profile.profile_id, today) as any;

      const exerciseSummary = db.prepare(`
        SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
        FROM exercise_entries WHERE profile_id = ? AND date(created_at) = ?
      `).get(profile.profile_id, today) as any;

      const caloriesMet = foodSummary.total_calories >= profile.calorie_goal;
      const exerciseMet = exerciseSummary.total_minutes >= profile.exercise_goal;

      if (!caloriesMet || !exerciseMet) {
        const parts: string[] = [];
        if (!caloriesMet) parts.push(`${profile.calorie_goal - foodSummary.total_calories} cal remaining`);
        if (!exerciseMet) parts.push(`${profile.exercise_goal - exerciseSummary.total_minutes} min exercise left`);

        sendNotification(
          profile.ntfy_server,
          profile.ntfy_topic,
          "📊 Daily goal reminder",
          `You still have: ${parts.join(', ')}. Your pet is counting on you!`,
          3,
        );
        goalRemindersSent.set(profile.profile_id, today);
      }
    }
  }
}

export function startNotificationScheduler(): void {
  // Run every 15 minutes
  setInterval(() => {
    try {
      checkPetAlerts();
    } catch (err) {
      console.error('Notification scheduler error:', err);
    }
  }, 15 * 60 * 1000);

  // Also run once on startup after a short delay
  setTimeout(() => {
    try { checkPetAlerts(); } catch {}
  }, 5000);
}
