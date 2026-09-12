import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  Clock3,
  Edit3,
  Focus,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-surface-variant'}`}
  >
    <span className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const SettingCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`glass-card border border-outline-variant p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}>{children}</div>
);

export const Settings: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const [energyMapping, setEnergyMapping] = useState(true);
  const [voiceFeedback, setVoiceFeedback] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [morningBlitz, setMorningBlitz] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState('daily');
  const [volume, setVolume] = useState(65);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-12">
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-background">System Preferences</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Configure your AI assistant's core behavior.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SettingCard>
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><SlidersHorizontal size={22} /></div>
              <Toggle checked={energyMapping} onChange={() => setEnergyMapping((value) => !value)} label="AI Energy Mapping" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-on-surface">AI Energy Mapping</h2>
            <p className="mb-6 text-sm text-on-surface-variant">Analyze your productivity patterns to suggest optimal work hours.</p>
            <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
              <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-secondary"><span>Focus peak</span><span className="text-primary">94%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full w-[94%] bg-primary" /></div>
            </div>
          </SettingCard>

          <SettingCard>
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-motivation-orange/10 p-3 text-motivation-orange"><Waves size={22} /></div>
              <Toggle checked={voiceFeedback} onChange={() => setVoiceFeedback((value) => !value)} label="Voice Feedback" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-on-surface">Voice Feedback</h2>
            <p className="mb-6 text-sm text-on-surface-variant">Real-time audio coaching during deep work.</p>
            <div className="flex items-center gap-3">
              <VolumeX size={16} className="text-secondary" />
              <input aria-label="Voice feedback volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-primary" />
              <Volume2 size={16} className="text-secondary" />
            </div>
          </SettingCard>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-on-background">Notifications</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Control how and when you receive updates.</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container px-4 py-2">
            <span className="text-sm font-bold text-on-surface">Push notifications</span>
            <Toggle checked={pushNotifications} onChange={() => setPushNotifications((value) => !value)} label="Push notifications" />
          </div>
        </div>
        <SettingCard className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-xl bg-success-green/10 p-3 text-success-green"><Mail size={22} /></div>
            <h3 className="text-lg font-semibold text-on-surface">Email summary frequency</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[['daily', 'Daily', 'Savage mode'], ['weekly', 'Weekly', 'Strategist'], ['monthly', 'Monthly', 'Visionary'], ['never', 'Never', 'Zen flow']].map(([value, title, detail]) => (
              <button key={value} type="button" onClick={() => setEmailFrequency(value)} className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${emailFrequency === value ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary'}`}>
                <span className={`mb-1 font-bold uppercase ${emailFrequency === value ? 'text-primary' : 'text-on-surface'}`}>{title}</span>
                <span className="text-[10px] uppercase text-on-surface-variant">{detail}</span>
              </button>
            ))}
          </div>
        </SettingCard>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-on-background">Account Details</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Manage your identity and security settings.</p>
        </div>
        <SettingCard className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary to-sky-active p-1 text-3xl font-extrabold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'B'}</div>
              <button type="button" aria-label="Edit account avatar" className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-primary p-1.5 text-white shadow-sm"><Edit3 size={13} /></button>
            </div>
            <div className="w-full flex-1 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Status</p><div className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-on-surface">Level {user?.level || 4} Focus Builder</div></div>
                <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Email address</p><div className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-on-surface">{user?.email || 'user@brofocus.ai'}</div></div>
              </div>
              <div className="flex justify-end pt-2"><button type="button" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"><Lock size={14} /> Change password</button></div>
            </div>
          </div>
        </SettingCard>
      </section>

      <section>
        <div className="mb-6"><h2 className="text-2xl font-bold text-on-background">Deep Work Windows</h2><p className="mt-1 text-sm text-on-surface-variant">Schedule your most intense focus sessions.</p></div>
        <div className="grid gap-6 md:grid-cols-2">
          <SettingCard className="flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="rounded-xl bg-electric-yellow/10 p-3 text-electric-yellow"><Sun size={22} /></div><div><h3 className="font-bold text-on-surface">Morning Blitz</h3><p className="text-xs text-on-surface-variant">Peak cognitive performance</p></div></div>
            <div className="text-right"><span className="text-sm font-bold text-primary">08:00 - 11:00</span><p className="text-[10px] font-bold uppercase text-success-green">{morningBlitz ? 'Active' : 'Off'}</p></div>
          </SettingCard>
          <SettingCard className={`flex items-center justify-between ${morningBlitz ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4"><div className="rounded-xl bg-surface-variant p-3 text-on-surface-variant"><Moon size={22} /></div><div><h3 className="font-bold text-on-surface">Night Owl</h3><p className="text-xs text-on-surface-variant">Quiet flow time</p></div></div>
            <button type="button" onClick={() => setMorningBlitz((value) => !value)} className="text-right"><span className="text-sm font-bold uppercase text-on-surface-variant">{morningBlitz ? 'Off' : 'Active'}</span></button>
          </SettingCard>
        </div>
      </section>

      <section className="rounded-2xl border border-error/20 bg-error-container/30 p-6 sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-error">Account continuity</h2>
        <p className="mb-8 text-sm text-on-surface-variant">Permanently delete your progress, streaks, and focus history. This action cannot be undone.</p>
        <button type="button" className="flex items-center gap-2 rounded-xl bg-error px-6 py-3 font-bold text-white shadow-md transition hover:brightness-90"><Trash2 size={16} /> Delete BroFocus data</button>
      </section>
    </div>
  );
};
