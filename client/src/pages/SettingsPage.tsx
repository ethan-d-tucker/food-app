import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Settings } from '../stores/appStore';
import PetSVG from '../components/pet/PetSVG';
import PetTypePicker from '../components/PetTypePicker';
import ColorPicker from '../components/ColorPicker';
import type { PetType } from '../components/PetTypePicker';
import { UserPlus, Bell, BellOff, Shield, ChevronDown, ChevronUp, Watch, Send, Copy, Check, Pencil } from 'lucide-react';

function ToggleSwitch({ on, onChange, color = 'bg-terracotta' }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? color : 'bg-cream-dark'}`}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ left: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function Section({ title, icon, children, collapsible = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full flex items-center gap-2 p-4 ${collapsible ? 'btn-press' : ''}`}
      >
        {icon}
        <h3 className="font-heading font-bold text-sm text-brown flex-1 text-left">{title}</h3>
        {collapsible && (open ? <ChevronUp size={16} className="text-brown-light" /> : <ChevronDown size={16} className="text-brown-light" />)}
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{children}</div>}
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, max = 9999, suffix }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-brown-light block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number" value={value} min={min} max={max}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className="w-full px-3 py-2 rounded-lg bg-cream border-2 border-cream-dark focus:border-terracotta outline-none text-brown text-sm font-medium"
        />
        {suffix && <span className="text-xs text-brown-light whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { profiles, activeProfileId, setPage, settings, loadSettings, updateSettings, updateProfile } = useAppStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const [local, setLocal] = useState<Partial<Settings>>({});
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPetName, setEditPetName] = useState('');
  const [editPetType, setEditPetType] = useState<PetType>('red-panda');
  const [editColor, setEditColor] = useState('#E07A5F');

  useEffect(() => {
    loadSettings();
  }, [activeProfileId, loadSettings]);

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  useEffect(() => {
    if (activeProfile) {
      setEditName(activeProfile.name);
      setEditPetName(activeProfile.pet_name);
      setEditPetType(activeProfile.pet_type);
      setEditColor(activeProfile.avatar_color);
    }
  }, [activeProfile, editing]);

  const save = async (updates: Partial<Settings>) => {
    setLocal((prev) => ({ ...prev, ...updates }));
    await updateSettings(updates);
  };

  const saveProfile = async () => {
    await updateProfile({
      name: editName.trim(),
      pet_name: editPetName.trim(),
      pet_type: editPetType,
      avatar_color: editColor,
    });
    setEditing(false);
  };

  const s = { ...settings, ...local } as Settings;
  if (!s || !activeProfile) return null;

  const webhookUrl = `${window.location.origin}/api/profiles/${activeProfileId}/exercise/import/health-auto-export`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24">
      <h1 className="font-heading text-2xl font-bold text-brown mb-4">Settings</h1>

      {/* Current Profile */}
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
          <button onClick={() => setEditing(!editing)} className="p-2 rounded-xl hover:bg-cream btn-press transition-colors">
            <Pencil size={16} className={editing ? 'text-terracotta' : 'text-brown-light'} />
          </button>
        </div>

        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4 border-t border-cream-dark pt-4"
          >
            <div>
              <label className="text-xs font-medium text-brown-light block mb-1">Your Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cream border-2 border-cream-dark focus:border-terracotta outline-none text-brown text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light block mb-1">Pet Name</label>
              <input
                type="text"
                value={editPetName}
                onChange={(e) => setEditPetName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cream border-2 border-cream-dark focus:border-terracotta outline-none text-brown text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light block mb-2">Your Color</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light block mb-2">Pet Type</label>
              <PetTypePicker value={editPetType} onChange={setEditPetType} size={70} />
            </div>
            <button
              onClick={saveProfile}
              disabled={!editName.trim() || !editPetName.trim()}
              className="w-full py-2.5 rounded-xl bg-terracotta text-white font-heading font-bold text-sm btn-press disabled:opacity-40 transition-opacity"
            >
              Save Changes
            </button>
          </motion.div>
        )}
      </div>

      {/* Goals */}
      <Section title="Daily Goals" icon={<span className="text-lg">🎯</span>}>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Calorie Goal"
            value={s.calorie_goal}
            onChange={(v) => save({ calorie_goal: v })}
            min={500} max={10000} suffix="cal"
          />
          <NumberInput
            label="Exercise Goal"
            value={s.exercise_goal}
            onChange={(v) => save({ exercise_goal: v })}
            min={5} max={300} suffix="min"
          />
        </div>
      </Section>

      {/* Tracking Mode */}
      <Section title="Tracking Style" icon={<span className="text-lg">📋</span>}>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => save({ tracking_mode: 'casual' })}
            className={`flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-colors btn-press ${
              s.tracking_mode === 'casual' ? 'bg-sage text-white' : 'bg-cream text-brown-light'
            }`}
          >
            <p className="font-bold">Casual</p>
            <p className="text-[10px] mt-0.5 opacity-80">Just log & go</p>
          </button>
          <button
            onClick={() => save({ tracking_mode: 'structured' })}
            className={`flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-colors btn-press ${
              s.tracking_mode === 'structured' ? 'bg-terracotta text-white' : 'bg-cream text-brown-light'
            }`}
          >
            <p className="font-bold">Structured</p>
            <p className="text-[10px] mt-0.5 opacity-80">Hit specific targets</p>
          </button>
        </div>
        <p className="text-xs text-brown-light">
          {s.tracking_mode === 'casual'
            ? 'Your pet gets happy just from you logging food — no pressure on hitting exact numbers!'
            : 'Your pet rewards you more for hitting your nutrition targets. Set your macro goals below.'}
        </p>

        {s.tracking_mode === 'structured' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-2"
          >
            <div className="grid grid-cols-3 gap-2">
              <NumberInput label="Protein" value={s.protein_target} onChange={(v) => save({ protein_target: v })} suffix="g" />
              <NumberInput label="Carbs" value={s.carbs_target} onChange={(v) => save({ carbs_target: v })} suffix="g" />
              <NumberInput label="Fat" value={s.fat_target} onChange={(v) => save({ fat_target: v })} suffix="g" />
            </div>
          </motion.div>
        )}

        <div className="mt-3">
          <NumberInput
            label="Meals per day"
            value={s.meal_frequency}
            onChange={(v) => save({ meal_frequency: v })}
            min={1} max={6}
          />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={s.ntfy_enabled ? <Bell size={16} className="text-terracotta" /> : <BellOff size={16} className="text-brown-light" />} collapsible>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-brown">Enable notifications</span>
          <ToggleSwitch on={!!s.ntfy_enabled} onChange={(v) => save({ ntfy_enabled: v ? 1 : 0 })} />
        </div>

        {!!s.ntfy_enabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-brown-light block mb-1">ntfy Server</label>
              <input
                type="text" value={s.ntfy_server}
                onChange={(e) => setLocal((prev) => ({ ...prev, ntfy_server: e.target.value }))}
                onBlur={() => save({ ntfy_server: s.ntfy_server })}
                className="w-full px-3 py-2 rounded-lg bg-cream border-2 border-cream-dark focus:border-terracotta outline-none text-brown text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brown-light block mb-1">Topic Name</label>
              <input
                type="text" value={s.ntfy_topic} placeholder="critter-yourname"
                onChange={(e) => setLocal((prev) => ({ ...prev, ntfy_topic: e.target.value }))}
                onBlur={() => save({ ntfy_topic: s.ntfy_topic })}
                className="w-full px-3 py-2 rounded-lg bg-cream border-2 border-cream-dark focus:border-terracotta outline-none text-brown text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brown">Pet mood alerts</span>
              <ToggleSwitch on={!!s.ntfy_pet_alerts} onChange={(v) => save({ ntfy_pet_alerts: v ? 1 : 0 })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brown">Daily goal reminders</span>
              <ToggleSwitch on={!!s.ntfy_goal_reminders} onChange={(v) => save({ ntfy_goal_reminders: v ? 1 : 0 })} />
            </div>
            <button
              onClick={() => api.testNotification(activeProfileId!)}
              className="w-full py-2 rounded-xl bg-cream text-brown text-sm font-medium btn-press flex items-center justify-center gap-2 hover:bg-cream-dark transition-colors"
            >
              <Send size={14} />
              Send Test Notification
            </button>
          </motion.div>
        )}
      </Section>

      {/* App Blocker */}
      <Section title="App Blocker" icon={<Shield size={16} className="text-brown-light" />} collapsible>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-brown">Enable app blocker</span>
          <ToggleSwitch on={!!s.blocker_enabled} onChange={(v) => save({ blocker_enabled: v ? 1 : 0 })} />
        </div>

        {!!s.blocker_enabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-brown-light block mb-2">Block Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => save({ blocker_mode: 'gentle' })}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors btn-press ${
                    s.blocker_mode === 'gentle' ? 'bg-mustard text-brown' : 'bg-cream text-brown-light'
                  }`}
                >
                  Gentle
                </button>
                <button
                  onClick={() => save({ blocker_mode: 'hard' })}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors btn-press ${
                    s.blocker_mode === 'hard' ? 'bg-terracotta text-white' : 'bg-cream text-brown-light'
                  }`}
                >
                  Hard Block
                </button>
              </div>
            </div>
            <p className="text-xs text-brown-light">
              {s.blocker_mode === 'gentle'
                ? 'Shows a reminder notification when you open blocked apps without logging food.'
                : 'Uses Screen Time to prevent app access until food is logged.'}
            </p>
            <button
              onClick={() => api.bypassBlocker(activeProfileId!)}
              className="w-full py-2 rounded-xl bg-cream text-brown text-sm font-medium btn-press hover:bg-cream-dark transition-colors"
            >
              Bypass — I haven't eaten yet
            </button>
            <div className="bg-cream rounded-xl p-3">
              <p className="text-xs font-bold text-brown mb-2">iOS Shortcuts Setup</p>
              <ol className="text-[11px] text-brown-light space-y-1 list-decimal list-inside">
                <li>Open the Shortcuts app on your iPhone</li>
                <li>Create a new automation triggered when opening your chosen apps</li>
                <li>Add "Get Contents of URL" action with this endpoint:</li>
              </ol>
              <div className="mt-2 flex items-center gap-1">
                <code className="flex-1 text-[10px] bg-white p-2 rounded-lg text-brown break-all">
                  {`${window.location.origin}/api/profiles/${activeProfileId}/food-status`}
                </code>
                <button onClick={copyUrl} className="p-2 rounded-lg hover:bg-white btn-press">
                  {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} className="text-brown-light" />}
                </button>
              </div>
              <ol start={4} className="text-[11px] text-brown-light space-y-1 list-decimal list-inside mt-2">
                <li>Add an "If" action: check if "logged_today" is false</li>
                <li>Show notification or open Critter to log food</li>
              </ol>
            </div>
          </motion.div>
        )}
      </Section>

      {/* Apple Watch */}
      <Section title="Apple Watch" icon={<Watch size={16} className="text-brown-light" />} collapsible>
        <p className="text-xs text-brown-light mb-3">
          Sync exercise data from your Apple Watch using the Health Auto Export app.
        </p>
        <div className="bg-cream rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-brown">Setup Instructions</p>
          <ol className="text-[11px] text-brown-light space-y-1 list-decimal list-inside">
            <li>Install "Health Auto Export" from the App Store</li>
            <li>Open the app and go to Automations</li>
            <li>Create a new automation for Workouts</li>
            <li>Set the API URL to:</li>
          </ol>
          <div className="flex items-center gap-1">
            <code className="flex-1 text-[10px] bg-white p-2 rounded-lg text-brown break-all">{webhookUrl}</code>
            <button onClick={copyUrl} className="p-2 rounded-lg hover:bg-white btn-press">
              {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} className="text-brown-light" />}
            </button>
          </div>
          <ol start={5} className="text-[11px] text-brown-light space-y-1 list-decimal list-inside">
            <li>Set format to JSON and enable auto-sync</li>
          </ol>
        </div>
      </Section>

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
        <p className="text-xs text-brown-light mt-2 font-pet">Made with love</p>
      </div>
    </div>
  );
}

// Need to import api for test notification/bypass buttons
import { api } from '../lib/api';
