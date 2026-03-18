import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Profile } from '../stores/appStore';
import PetSVG from '../components/pet/PetSVG';
import SpeechBubble from '../components/pet/SpeechBubble';
import LevelUpOverlay from '../components/pet/LevelUpOverlay';
import WardrobeModal from '../components/WardrobeModal';
import { Flame, Cookie, Star, Shirt } from 'lucide-react';
import { useState, useMemo } from 'react';
import { getSeasonTheme } from '../lib/themes';
import { api } from '../lib/api';

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

function TogetherScene({ profiles, equippedMap }: { profiles: Profile[]; equippedMap: Record<string, Record<string, string>> }) {
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
          <PetSVG type={profiles[0].pet_type} mood={mood1} size={130} equipped={equippedMap[profiles[0].id] || {}} />
        </motion.div>
        {profiles[1] && (
          <motion.div
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <PetSVG type={profiles[1].pet_type} mood={mood2} size={130} equipped={equippedMap[profiles[1].id] || {}} />
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
  const { profiles, activeProfileId, setActiveProfile, petPet, petReaction, clearReaction, loadSummary, summary, progression, loadProgression, loadStreaks, streaks, useTreat, levelUpTriggered, clearLevelUp } = useAppStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  useEffect(() => {
    loadSummary();
    loadProgression();
    loadStreaks();
  }, [activeProfileId, loadSummary, loadProgression, loadStreaks]);

  useEffect(() => {
    if (petReaction) {
      const t = setTimeout(clearReaction, 3000);
      return () => clearTimeout(t);
    }
  }, [petReaction, clearReaction]);

  const handlePet = useCallback(() => {
    petPet();
  }, [petPet]);

  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [equippedMap, setEquippedMap] = useState<Record<string, Record<string, string>>>({});
  const seasonTheme = useMemo(() => getSeasonTheme(), []);

  useEffect(() => {
    // Load equipped for all profiles
    profiles.forEach(p => {
      api.getEquipped(p.id).then(eq => setEquippedMap(prev => ({ ...prev, [p.id]: eq })));
    });
  }, [profiles]);

  const equipped = activeProfileId ? equippedMap[activeProfileId] || {} : {};

  // Refresh equipped when wardrobe closes
  const handleWardrobeClose = useCallback(() => {
    setWardrobeOpen(false);
    if (activeProfileId) {
      api.getEquipped(activeProfileId).then(eq => setEquippedMap(prev => ({ ...prev, [activeProfileId]: eq })));
    }
  }, [activeProfileId]);

  if (!activeProfile) return null;

  const stats = activeProfile.pet_stats;

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24 relative overflow-hidden">
      {/* Floating Seasonal Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {seasonTheme.particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute text-lg opacity-20"
            style={{ left: `${15 + i * 30}%`, top: -20 }}
            animate={{ y: [0, 400], x: [0, (i % 2 ? 20 : -20)], rotate: [0, 360] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, delay: i * 3, ease: 'linear' }}
          >
            {p}
          </motion.span>
        ))}
      </div>

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
          <TogetherScene profiles={profiles} equippedMap={equippedMap} />
        ) : (
          <div className="text-center" onClick={handlePet}>
            <PetSVG type={activeProfile.pet_type} mood={activeProfile.mood} size={200} reaction={petReaction?.type || null} equipped={equipped} />
          </div>
        )}

        {/* Speech Bubble */}
        <div className="mt-3 min-h-[48px] flex items-center justify-center">
          <SpeechBubble mood={activeProfile.mood} reaction={petReaction} />
        </div>

        {/* Pet Name + Wardrobe */}
        <div className="flex items-center gap-2 mt-2">
          <p className="font-heading font-bold text-lg text-brown">
            {activeProfile.pet_name}
          </p>
          <button
            onClick={() => setWardrobeOpen(true)}
            className="p-1.5 rounded-lg hover:bg-cream-dark btn-press"
            title="Wardrobe"
          >
            <Shirt size={14} className="text-brown-light" />
          </button>
        </div>

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

      {/* Level / XP / Streak / Treats */}
      {progression && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-4 shadow-sm mt-3"
        >
          {/* Level + XP bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-terracotta/15 flex items-center justify-center">
              <Star size={18} className="text-terracotta" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brown">Level {progression.level}</span>
                <span className="text-[10px] text-brown-light">{progression.current}/{progression.needed} XP</span>
              </div>
              <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-terracotta"
                  initial={{ width: 0 }}
                  animate={{ width: `${progression.progress * 100}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                />
              </div>
            </div>
          </div>

          {/* Streak + Treats row */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-cream rounded-xl px-3 py-2">
              <Flame size={16} className="text-terracotta" />
              <div>
                <p className="text-sm font-bold text-brown">{streaks?.current_streak || 0}</p>
                <p className="text-[9px] text-brown-light">streak</p>
              </div>
            </div>
            <button
              onClick={() => progression.treats > 0 && useTreat()}
              disabled={progression.treats <= 0}
              className="flex-1 flex items-center gap-2 bg-cream rounded-xl px-3 py-2 btn-press disabled:opacity-40 transition-opacity"
            >
              <Cookie size={16} className="text-mustard" />
              <div className="text-left">
                <p className="text-sm font-bold text-brown">{progression.treats}</p>
                <p className="text-[9px] text-brown-light">treats</p>
              </div>
            </button>
          </div>
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
              {summary.activity?.active_energy ? (
                <>
                  <p className="text-2xl font-bold text-sage">{summary.activity.active_energy}</p>
                  <p className="text-xs text-brown-light">active cal</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-sage">{summary.exercise.total_minutes}</p>
                  <p className="text-xs text-brown-light">/ {summary.goals.exercise_goal} min</p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Level Up Overlay */}
      <LevelUpOverlay
        level={progression?.level || 1}
        visible={levelUpTriggered}
        onDismiss={clearLevelUp}
      />

      {/* Wardrobe */}
      <WardrobeModal open={wardrobeOpen} onClose={handleWardrobeClose} />
    </div>
  );
}
