import React from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Lightbulb,
  Pencil,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const weeklyHours = [40, 64, 84, 55, 95, 70, 100];
const badges = [
  { title: 'Priority Finisher', detail: '10 priority tasks', icon: CheckCircle2, gradient: 'from-success-green to-primary-container' },
  { title: 'Consistency Builder', detail: 'One week streak', icon: Flame, gradient: 'from-motivation-orange to-rose-500' },
  { title: 'Workspace Wizard', detail: 'Deep work pro', icon: Sparkles, gradient: 'from-sky-active to-primary' },
];

export const Profile: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const name = user?.name || 'BroFocus User';
  const level = user?.level || 4;
  const points = user?.productivity_points || 2450;
  const nextLevelPoints = 3000;
  const progress = Math.min(100, Math.round((points / nextLevelPoints) * 100));

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      <div className="grid grid-cols-12 gap-6 lg:gap-10">
        <section className="col-span-12 space-y-6 lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card primary-tint-shadow flex flex-col items-center p-8 text-center sm:p-10"
          >
            <div className="group relative mb-6">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary via-primary-container to-sky-active text-5xl font-extrabold text-white shadow-2xl">
                {name.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                aria-label="Edit profile photo"
                className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-sky-active text-white shadow-lg transition hover:scale-110"
              >
                <Pencil size={16} />
              </button>
            </div>

            <h1 className="text-2xl font-extrabold text-on-surface">{name}</h1>
            <p className="mt-3 max-w-xs text-sm leading-6 text-on-surface-variant">
              Optimizing cognitive cycles and protecting deep-work blocks with intention.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-5 py-2.5 text-primary">
              <Lightbulb size={17} fill="currentColor" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]">Morning focus</span>
            </div>

            <div className="mt-8 w-full space-y-3">
              <div className="flex justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
                <span>Level {level}</span>
                <span>{points.toLocaleString()} / {nextLevelPoints.toLocaleString()} XP</span>
              </div>
              <div className="xp-bar-pulse h-2.5 overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-electric-yellow shadow-[0_0_15px_rgba(255,214,0,0.4)]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card flex flex-col items-center justify-center gap-1 p-6 text-center">
              <span className="text-3xl font-extrabold text-sky-active">142</span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Focus hours</span>
            </div>
            <div className="glass-card flex flex-col items-center justify-center gap-1 p-6 text-center">
              <span className="text-3xl font-extrabold text-motivation-orange">89%</span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">Consistency</span>
            </div>
          </div>
        </section>

        <section className="col-span-12 space-y-6 lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card primary-tint-shadow p-6 sm:p-10"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-on-surface">Badges gallery</h2>
              <button type="button" className="text-sm font-bold text-primary hover:underline">View all (24)</button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {badges.map(({ title, detail, icon: Icon, gradient }) => (
                <motion.div
                  key={title}
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center rounded-3xl border border-transparent bg-surface-container-low/70 p-6 text-center transition hover:border-primary/20 hover:bg-white hover:shadow-xl"
                >
                  <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white shadow-xl`}>
                    <Icon size={38} />
                  </div>
                  <span className="text-base font-bold text-on-surface">{title}</span>
                  <span className="mt-2 text-sm text-on-surface-variant">{detail}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card primary-tint-shadow p-6 sm:p-10"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-on-surface">Focus analytics</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Your performance data for the last 7 days.</p>
              </div>
              <div className="flex w-fit rounded-2xl bg-surface-container p-1">
                <button type="button" className="rounded-xl bg-white px-5 py-2 text-xs font-bold text-primary shadow-sm">Week</button>
                <button type="button" className="px-5 py-2 text-xs font-bold text-on-surface-variant">Month</button>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="text-base font-bold text-on-surface">Productivity hours</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-success-green"><TrendingUp size={17} />+12% vs last week</span>
                </div>
                <div className="flex h-52 items-end gap-2 px-1 sm:gap-3 sm:px-4">
                  {weeklyHours.map((height, index) => (
                    <div key={index} className={`group relative flex-1 rounded-2xl transition hover:bg-primary/30 ${index === 6 ? 'bg-primary shadow-[0_15px_30px_rgba(58,71,209,0.2)]' : 'bg-surface-container-high'}`} style={{ height: `${height}%` }}>
                      {index === 6 && <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-on-background px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xl">10.2 hrs</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70 sm:px-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-base font-bold text-on-surface">Goal completion rate</span>
                  <span className="text-sm font-bold text-sky-active">92% completion</span>
                </div>
                <div className="relative h-20 w-full">
                  <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20" role="img" aria-label="Goal completion trend">
                    <path d="M0,15 L15,12 L30,18 L45,5 L60,8 L75,2 L100,6" fill="none" stroke="#00A3FF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    {[15, 30, 45, 60, 75].map((x, index) => <circle key={x} cx={x} cy={[12, 18, 5, 8, 2][index]} fill="#00A3FF" r="1.5" />)}
                    <circle cx="100" cy="6" fill="#00A3FF" r="2.5" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Active goals', value: '08', icon: Target, color: 'text-primary' },
          { label: 'Tasks completed', value: '126', icon: Award, color: 'text-motivation-orange' },
          { label: 'Best focus block', value: '3h 42m', icon: Clock3, color: 'text-success-green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ${color}`}><Icon size={20} /></div>
            <div><p className="text-xl font-extrabold text-on-surface">{value}</p><p className="text-sm text-on-surface-variant">{label}</p></div>
          </div>
        ))}
      </section>
    </div>
  );
};
