// BroFocus - Engagement Hub Page (Morning Kickoff & Evening Wrap)
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Sun,
  Moon,
  Sparkles,
  Award,
  CheckCircle2,
  Zap,
  Target,
  Flame,
  Clock,
} from 'lucide-react';
import { engagementApi } from '../api/client';

export const Engagement: React.FC = () => {
  const { data: morningBrief } = useQuery({
    queryKey: ['morning-kickoff'],
    queryFn: engagementApi.getMorningKickoff,
  });

  const { data: eveningWrap } = useQuery({
    queryKey: ['evening-wrap'],
    queryFn: engagementApi.getEveningWrap,
  });

  const morning = morningBrief || {
    greeting: 'Your morning brief is being prepared',
    quote: 'Connect Workspace services to generate a brief from your live email and calendar context.',
    top_priorities: [],
    peak_focus_window: 'Awaiting your schedule',
    weather_focus_score: 0,
  };

  const evening = eveningWrap || {
    headline: 'Your evening wrap is being prepared',
    tasks_completed: 0,
    total_xp_gained: 0,
    focus_hours: 0,
    streak_days: 0,
    highlights: ['Complete tasks or focus sessions to build your evening summary.'],
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-cyan-500" size={26} />
            Daily Engagement & Briefings
          </h1>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">
            Gamified AI Briefs
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Automated morning alignment and evening achievement wraps based on the latest focus data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-2xl bg-white/90 border border-amber-200 shadow-[0_12px_28px_rgba(251,191,36,0.08)] space-y-4 relative overflow-hidden backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <Sun size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{morning.greeting}</h2>
                <span className="text-xs text-amber-600 font-medium">Morning Alignment Brief</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Zap size={12} />
              Score: {morning.weather_focus_score}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs italic text-slate-700 leading-relaxed">
            "{morning.quote}"
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-amber-600" />
              Target Focus Priorities
            </h3>
            <div className="space-y-1.5">
              {(morning.top_priorities || []).map((pri: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{pri}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-amber-600" />
              Peak Window: <strong className="text-slate-800">{morning.peak_focus_window}</strong>
            </span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-2xl bg-white/90 border border-violet-200 shadow-[0_12px_28px_rgba(139,92,246,0.08)] space-y-4 relative overflow-hidden backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 border border-violet-200">
                <Moon size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{evening.headline}</h2>
                <span className="text-xs text-violet-600 font-medium">Evening EOD Summary</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1">
              <Award size={12} />
              +{evening.total_xp_gained} XP
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Completed</span>
              <span className="text-lg font-bold text-slate-800">{evening.tasks_completed} Tasks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Focus Hours</span>
              <span className="text-lg font-bold text-cyan-600">{evening.focus_hours} hrs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Streak</span>
              <span className="text-lg font-bold text-amber-600 flex items-center justify-center gap-1">
                <Flame size={14} />
                {evening.streak_days}d
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Today's Key Highlights</h3>
            <div className="space-y-1.5">
              {(evening.highlights || []).map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
