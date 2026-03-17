import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Profile } from '../stores/appStore';
import PetSVG from '../components/pet/PetSVG';
import SpeechBubble from '../components/pet/SpeechBubble';

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-brown-light w-16">{label}</span>
      <div className="flex-1 h-3 bg-cream-dark rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>
      <span className="text-xs font-medium text-brown w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

function ProfileChip({ profile, active, onClick }: { profile: Profile; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all btn-press ${
        active ? 'bg-white shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: profile.avatar_color }}>
        {profile.name[0]}
      </div>
      <span className="text-sm font-medium text-brown">{profile.name}</span>
    </button>
  );
}

function TogetherScene({ profiles }: { profiles: Profile[] }) {
  const mood1 = profiles[0]?.mood || 'content';
  const mood2 = profiles[1]?.mood || 'content';

  // Determine interaction text based on both moods
  let sceneText = '';
  if (mood1 === 'ecstatic' && mood2 === 'ecstatic') sceneText = 'Best friends having a blast!';
  else if (mood1 === 'sad' || mood2 === 'sad') sceneText = 'Cheering each other up~';
  else if (mood1 === 'sick' || mood2 === 'sick') sceneText = 'Taking care of each other...';
  else if (mood1 === 'sleeping' || mood2 === 'sleeping') sceneText = 'Shhh... naptime...';
  else sceneText = 'Hanging out together!';

  return (
    <div className="text-center">
      <div className="flex items-end justify-center gap-0 -mb-2">
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PetSVG type={profiles[0].pet_type} mood={mood1} size={130} />
        </motion.div>
        {profiles[1] && (
          <motion.div
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <PetSVG type={profiles[1].pet_type} mood={mood2} size={130} />
          </motion.div>
        )}
      </div>
      {profiles.length > 1 && (
        <p className="font-pet text-sm text-brown-light mt-1">{sceneText}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const { profiles, activeProfileId, setActiveProfile, petPet, petReaction, clearReaction, loadSummary, summary } = useAppStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  useEffect(() => {
    loadSummary();
  }, [activeProfileId, loadSummary]);

  useEffect(() => {
    if (petReaction) {
      const t = setTimeout(clearReaction, 3000);
      return () => clearTimeout(t);
    }
  }, [petReaction, clearReaction]);

  const handlePet = useCallback(() => {
    petPet();
  }, [petPet]);

  if (!activeProfile) return null;

  const stats = activeProfile.pet_stats;

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      {/* Profile Switcher */}
      {profiles.length > 1 && (
        <div className="flex justify-center gap-2 mb-4 bg-cream-dark/50 rounded-full p-1 mx-auto">
          {profiles.map((p) => (
            <ProfileChip key={p.id} profile={p} active={p.id === activeProfileId} onClick={() => setActiveProfile(p.id)} />
          ))}
        </div>
      )}

      {/* Together Scene or Single Pet */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {profiles.length > 1 ? (
          <TogetherScene profiles={profiles} />
        ) : (
          <div className="text-center" onClick={handlePet}>
            <PetSVG type={activeProfile.pet_type} mood={activeProfile.mood} size={200} />
          </div>
        )}

        {/* Speech Bubble */}
        <div className="mt-3 min-h-[48px] flex items-center justify-center">
          <SpeechBubble mood={activeProfile.mood} reaction={petReaction} />
        </div>

        {/* Pet Name */}
        <p className="font-heading font-bold text-lg text-brown mt-2">
          {activeProfile.pet_name}
        </p>

        {/* Tap hint for single pet */}
        {profiles.length === 1 && (
          <p className="text-xs text-brown-light mt-1">tap to pet!</p>
        )}

        {/* For together view, show which pet to tap */}
        {profiles.length > 1 && (
          <button onClick={handlePet} className="mt-2 text-xs text-terracotta font-medium btn-press">
            Pet {activeProfile.pet_name}!
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm space-y-2"
        >
          <StatBar label="Fullness" value={stats.fullness} color="#E07A5F" />
          <StatBar label="Fitness" value={stats.fitness} color="#81B29A" />
          <StatBar label="Happy" value={stats.happiness} color="#F2CC8F" />
        </motion.div>
      )}

      {/* Daily Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm mt-3"
        >
          <h3 className="font-heading font-bold text-sm text-brown mb-3">Today</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              {summary.goals.tracking_mode === 'casual' ? (
                <>
                  <p className="text-2xl font-bold text-terracotta">{summary.food.meal_count}</p>
                  <p className="text-xs text-brown-light">meals logged</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-terracotta">{summary.food.total_calories}</p>
                  <p className="text-xs text-brown-light">/ {summary.goals.calorie_goal} cal</p>
                </>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-sage">{summary.exercise.total_minutes}</p>
              <p className="text-xs text-brown-light">/ {summary.goals.exercise_goal} min</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
