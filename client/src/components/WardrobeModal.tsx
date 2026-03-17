import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAppStore } from '../stores/appStore';
import PetSVG from './pet/PetSVG';

const CATEGORIES = ['hat', 'glasses', 'scarf', 'necklace'] as const;
const CATEGORY_LABELS: Record<string, string> = { hat: 'Hats', glasses: 'Glasses', scarf: 'Scarves & Ties', necklace: 'Necklaces' };

function unlockHint(item: any): string {
  switch (item.unlock_type) {
    case 'level': return `Reach level ${item.unlock_value}`;
    case 'streak': return `${item.unlock_value}-day streak`;
    case 'achievement': return `Unlock: ${item.unlock_value.replace(/_/g, ' ')}`;
    default: return '';
  }
}

export default function WardrobeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activeProfileId, profiles } = useAppStore();
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('hat');

  useEffect(() => {
    if (open && activeProfileId) {
      api.getAccessories(activeProfileId).then(setAccessories);
      api.getEquipped(activeProfileId).then(setEquipped);
    }
  }, [open, activeProfileId]);

  const handleEquip = async (category: string, key: string) => {
    if (!activeProfileId) return;
    const newKey = equipped[category] === key ? null : key;
    const result = await api.equipAccessory(activeProfileId, category, newKey);
    setEquipped(result);
  };

  const categoryItems = accessories.filter(a => a.category === selectedCategory);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-brown/40 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-[430px] bg-cream rounded-t-3xl p-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-brown">Wardrobe</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-dark btn-press">
                <X size={18} className="text-brown-light" />
              </button>
            </div>

            {/* Pet Preview */}
            {activeProfile && (
              <div className="flex justify-center mb-4">
                <PetSVG type={activeProfile.pet_type} mood={activeProfile.mood} size={120} />
              </div>
            )}

            {/* Currently Equipped */}
            {Object.keys(equipped).length > 0 && (
              <div className="flex gap-2 justify-center mb-4">
                {Object.entries(equipped).map(([cat, key]) => {
                  const acc = accessories.find(a => a.key === key);
                  if (!acc) return null;
                  return (
                    <span key={cat} className="bg-white rounded-full px-3 py-1 text-xs font-medium text-brown flex items-center gap-1">
                      <span>{acc.emoji}</span> {acc.name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap btn-press transition-colors ${
                    selectedCategory === cat ? 'bg-terracotta text-white' : 'bg-white text-brown-light'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-3 gap-2">
              {categoryItems.map(item => {
                const isEquipped = equipped[item.category] === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => item.unlocked && handleEquip(item.category, item.key)}
                    disabled={!item.unlocked}
                    className={`p-3 rounded-2xl text-center transition-all btn-press ${
                      isEquipped
                        ? 'bg-terracotta/15 border-2 border-terracotta'
                        : item.unlocked
                        ? 'bg-white border-2 border-transparent hover:border-cream-dark'
                        : 'bg-cream-dark/50 border-2 border-transparent opacity-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{item.emoji}</span>
                    <p className="text-[10px] font-medium text-brown">{item.name}</p>
                    {!item.unlocked && (
                      <div className="flex items-center gap-0.5 justify-center mt-1">
                        <Lock size={8} className="text-brown-light" />
                        <p className="text-[8px] text-brown-light">{unlockHint(item)}</p>
                      </div>
                    )}
                    {isEquipped && (
                      <p className="text-[8px] text-terracotta font-bold mt-0.5">Equipped</p>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
