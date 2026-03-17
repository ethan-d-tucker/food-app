import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/appStore';
import PetSVG from '../components/pet/PetSVG';
import PetTypePicker from '../components/PetTypePicker';
import ColorPicker, { COLORS } from '../components/ColorPicker';
import type { PetType } from '../components/PetTypePicker';

export default function OnboardingPage() {
  const { createProfile, profiles } = useAppStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [petType, setPetType] = useState<PetType>('red-panda');
  const [petName, setPetName] = useState('');
  const [avatarColor, setAvatarColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const isAdding = profiles.length > 0;

  const handleSubmit = async () => {
    if (!name.trim() || !petName.trim()) return;
    setLoading(true);
    await createProfile({
      name: name.trim(),
      pet_type: petType,
      pet_name: petName.trim(),
      avatar_color: avatarColor,
    });
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="text-6xl mb-6"
            >
              🥚
            </motion.div>
            <h1 className="font-heading text-3xl font-bold text-brown mb-3">
              {isAdding ? 'New Friend!' : 'Welcome!'}
            </h1>
            <p className="text-brown-light mb-8">
              {isAdding
                ? "Let's set up another profile"
                : "Let's get you a little buddy to keep you healthy"}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-light mb-2 text-left">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown font-body text-lg transition-colors"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-light mb-2 text-left">Pick your color</label>
              <ColorPicker value={avatarColor} onChange={setAvatarColor} />
            </div>

            <button
              onClick={() => name.trim() && setStep(1)}
              disabled={!name.trim()}
              className="w-full py-3 rounded-2xl bg-terracotta text-white font-heading font-bold text-lg btn-press disabled:opacity-40 transition-opacity"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="pet-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full"
          >
            <h1 className="font-heading text-2xl font-bold text-brown mb-2">Choose Your Pet</h1>
            <p className="text-brown-light mb-6">They'll grow with you!</p>

            <div className="mb-6">
              <PetTypePicker value={petType} onChange={setPetType} />
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-2xl bg-terracotta text-white font-heading font-bold text-lg btn-press"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="pet-name"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full"
          >
            <div className="flex justify-center mb-4">
              <PetSVG type={petType} mood="ecstatic" size={160} />
            </div>
            <h1 className="font-heading text-2xl font-bold text-brown mb-2">Name Your Pet!</h1>

            <div className="mb-8">
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Give them a name..."
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-cream-dark focus:border-terracotta outline-none text-brown font-heading text-xl text-center transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!petName.trim() || loading}
              className="w-full py-3 rounded-2xl bg-terracotta text-white font-heading font-bold text-lg btn-press disabled:opacity-40 transition-opacity"
            >
              {loading ? 'Hatching...' : "Let's Go!"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step dots */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              s === step ? 'bg-terracotta' : 'bg-cream-dark'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
