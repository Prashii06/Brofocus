// BroFocus - Engagement Hub Page (Morning Kickoff & Evening Wrap)
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sun,
  Moon,
  Bell,
  Sparkles,
  Award,
  CheckCircle2,
  Zap,
  Target,
  Flame,
  Send,
  Loader2,
  Clock,
} from 'lucide-react';
import { engagementApi } from '../api/client';
import { useAppStore } from '../store/useAppStore';

export const Engagement: React.FC = () => {
  const addNotification = useAppStore((state) => state.addNotification);
  const [customNotifyTitle, setCustomNotifyTitle] = useState('');
  const [customNotifyMessage, setCustomNotifyMessage] = useState('');

  // Query Morning Kickoff
  const { data: morningBrief, isLoading: isMorningLoading } = useQuery({
    queryKey: ['morning-kickoff'],
    queryFn: async () => {
      const res = await engagementApi.getMorningKickoff();
      return res.data;
    },
  });

  // Query Evening Wrap
  const { data: eveningWrap, isLoading: isEveningLoading } = useQuery({
    queryKey: ['evening-wrap'],
    queryFn: async () => {
      const res = await engagementApi.getEveningWrap();
      return res.data;
    },
  });

  // Dispatch notification mutation
  const dispatchMutation = useMutation({
    mutationFn: (data: { title: string; message: string; type: any }) =>
      engagementApi.dispatchNotification(data.title, data.message, data.type),
    onSuccess: (_, variables) => {
      addNotification({
        title: variables.title,
        message: variables.message,
        type: variables.type,
      });
      setCustomNotifyTitle('');
      setCustomNotifyMessage('');
    },
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

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotifyTitle.trim()) return;
    dispatchMutation.mutate({
      title: customNotifyTitle,
      message: customNotifyMessage || 'Simulated engagement push notification.',
      type: 'ai',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={26} />
            Daily Engagement & Briefings
          </h1>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Gamified AI Briefs
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Automated morning alignment, evening achievement wraps, and system notification testing.
        </p>
      </div>

      {/* Grid: Morning Kickoff & Evening Wrap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Kickoff Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/20 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sun size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">{morning.greeting}</h2>
                <span className="text-xs text-amber-400 font-medium">Morning Alignment Brief</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <Zap size={12} />
              Score: {morning.weather_focus_score}%
            </span>
          </div>

          {/* Daily Quote */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs italic text-amber-200/90 leading-relaxed">
            "{morning.quote}"
          </div>

          {/* Priorities */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-amber-400" />
              Target Focus Priorities
            </h3>
            <div className="space-y-1.5">
              {morning.top_priorities.map((pri: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-200"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{pri}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-amber-400" />
              Peak Window: <strong className="text-slate-200">{morning.peak_focus_window}</strong>
            </span>
          </div>
        </motion.div>

        {/* Evening Wrap Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/20 via-slate-900 to-slate-950 border border-violet-500/20 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Moon size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">{evening.headline}</h2>
                <span className="text-xs text-violet-400 font-medium">Evening EOD Summary</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1">
              <Award size={12} />
              +{evening.total_xp_gained} XP
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Completed</span>
              <span className="text-lg font-bold text-slate-100">{evening.tasks_completed} Tasks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Focus Hours</span>
              <span className="text-lg font-bold text-cyan-400">{evening.focus_hours} hrs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Streak</span>
              <span className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                <Flame size={14} />
                {evening.streak_days}d
              </span>
            </div>
          </div>

          {/* Key Achievements */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Today's Key Highlights</h3>
            <div className="space-y-1.5">
              {evening.highlights.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300"
                >
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notification Dispatch Testing Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Bell size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">System Notification Dispatcher</h3>
            <p className="text-xs text-slate-400">Trigger real-time alert popups and toast banners for testing.</p>
          </div>
        </div>

        <form onSubmit={handleSendNotification} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={customNotifyTitle}
            onChange={(e) => setCustomNotifyTitle(e.target.value)}
            placeholder="Notification Title (e.g. Schedule Conflict Alert)"
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={customNotifyMessage}
            onChange={(e) => setCustomNotifyMessage(e.target.value)}
            placeholder="Message details..."
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={dispatchMutation.isPending}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {dispatchMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Dispatch Toast Alert</span>
          </button>
        </form>
      </div>
    </div>
  );
};
