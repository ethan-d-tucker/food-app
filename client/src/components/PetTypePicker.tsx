import { motion } from 'framer-motion';
import PetSVG from './pet/PetSVG';

export const PET_TYPES = [
  { id: 'red-panda' as const, name: 'Red Panda', emoji: '🔴' },
  { id: 'cat' as const, name: 'Cat', emoji: '🐱' },
  { id: 'hamster' as const, name: 'Hamster', emoji: '🐹' },
  { id: 'frog' as const, name: 'Frog', emoji: '🐸' },
];

export type PetType = typeof PET_TYPES[number]['id'];

export default function PetTypePicker({ value, onChange, size = 100 }: { value: PetType; onChange: (v: PetType) => void; size?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PET_TYPES.map((pet) => (
        <motion.button
          key={pet.id}
          onClick={() => onChange(pet.id)}
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-2xl border-2 transition-all ${
            value === pet.id
              ? 'border-terracotta bg-terracotta/10'
              : 'border-cream-dark bg-white'
          }`}
        >
          <div className="flex justify-center mb-1">
            <PetSVG type={pet.id} mood="happy" size={size} />
          </div>
          <p className="font-heading font-bold text-sm text-brown">{pet.name}</p>
        </motion.button>
      ))}
    </div>
  );
}
