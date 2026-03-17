import { useAppStore } from '../stores/appStore';
import PetSVG from '../components/pet/PetSVG';
import { UserPlus } from 'lucide-react';

export default function SettingsPage() {
  const { profiles, activeProfileId, setPage } = useAppStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      <h1 className="font-heading text-2xl font-bold text-brown mb-4">Settings</h1>

      {/* Current Profile */}
      {activeProfile && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: activeProfile.avatar_color }}>
              {activeProfile.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-heading font-bold text-brown">{activeProfile.name}</p>
              <p className="text-sm text-brown-light">
                {activeProfile.pet_name} the {activeProfile.pet_type.replace('-', ' ')}
              </p>
            </div>
            <PetSVG type={activeProfile.pet_type} mood="happy" size={50} />
          </div>
        </div>
      )}

      {/* All Profiles */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="font-heading font-bold text-sm text-brown mb-3">Profiles</h3>
        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: p.avatar_color }}>
                {p.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brown">{p.name}</p>
                <p className="text-xs text-brown-light">{p.pet_name}</p>
              </div>
              <PetSVG type={p.pet_type} mood={p.mood} size={36} />
            </div>
          ))}
        </div>

        {profiles.length < 2 && (
          <button
            onClick={() => setPage('onboarding')}
            className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-cream-dark text-brown-light font-medium text-sm flex items-center justify-center gap-2 btn-press hover:border-terracotta hover:text-terracotta transition-colors"
          >
            <UserPlus size={16} />
            Add Partner
          </button>
        )}
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-heading font-bold text-sm text-brown mb-2">About</h3>
        <p className="text-sm text-brown-light">
          Track your food & exercise with your pet buddy! Take care of them and they'll motivate you to stay healthy.
        </p>
        <p className="text-xs text-brown-light mt-2 font-pet">Made with love 💕</p>
      </div>
    </div>
  );
}
