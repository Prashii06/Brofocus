// BroFocus - Analytics Hub Page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  Target,
  Clock,
  Sparkles,
  Calendar,
  Flame,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { analyticsApi, tasksApi } from '../api/client';
import { FocusChart } from '../components/charts/FocusChart';
import { CompletionDonut } from '../components/charts/CompletionDonut';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Query Analytics Trends
  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['analytics-trends', timeRange],
    queryFn: async () => {
      const res = await analyticsApi.getTrends();
      return res.trends;
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ['analytics-progress'],
    queryFn: async () => {
      const res = await analyticsApi.getProgressBar();
      return res.progress;
    },
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const res = await tasksApi.getTasks();
      return Array.isArray(res.tasks) ? res.tasks : res.data?.tasks || [];
    },
  });

  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const taskCounts = {
    pending: tasks.filter((t: any) => t.status === 'pending').length,
    in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
  };

  const focusData = trendsData?.focus_trend || [];
  const weeklySummary = trendsData?.weekly_summary || {
    avg_focus_hours: 0,
    total_tasks_completed: 0,
    avg_productivity_score: 0,
    days_tracked: 0,
  };

  return (
    <div className="space-y-6 pb-12 overflow-hidden min-w-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="text-cyan-400" size={26} />
              Productivity & Focus Analytics
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Metrics
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time breakdown of deep focus hours, task execution velocity, and AI time optimization.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last Quarter'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-white via-sky-50 to-indigo-50 border border-sky-100 shadow-[0_12px_30px_rgba(59,130,246,0.08)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Focus Time</span>
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700 border border-violet-200">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{weeklySummary.avg_focus_hours || 0} hrs</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              {weeklySummary.days_tracked ? 'Tracked' : '0d'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{weeklySummary.days_tracked || 0} days tracked</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-white via-cyan-50 to-indigo-50 border border-cyan-100 shadow-[0_12px_30px_rgba(59,130,246,0.08)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Focus Efficiency</span>
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700 border border-cyan-200">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{weeklySummary.avg_productivity_score || 0}%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              {progressData?.fill_percent || 0}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on recent focus sessions</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-white via-amber-50 to-orange-50 border border-amber-100 shadow-[0_12px_30px_rgba(251,146,60,0.08)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{progressData?.current_level || 1} lvl</span>
            <span className="text-xs font-semibold text-amber-600 font-mono">⚡ {progressData?.rank || 'Rookie Bro'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{progressData?.points_to_next_milestone || 0} pts to next milestone</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-white via-emerald-50 to-cyan-50 border border-emerald-100 shadow-[0_12px_30px_rgba(16,185,129,0.08)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Time Saved</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{progressData?.fill_percent || 0} %</span>
            <span className="text-xs font-semibold text-cyan-600">Gemini</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Efficiency from AI-assisted planning</p>
        </motion.div>
      </div>

      {/* Main Charts Grid (2 columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Hours Trend Area Chart (2/3 width) */}
        <div className="lg:col-span-2">
          <FocusChart data={focusData} title="Daily Focus Hours & Tasks Velocity" />
        </div>

        {/* Task Completion Donut Chart (1/3 width) */}
        <div>
          <CompletionDonut data={taskCounts} />
        </div>
      </div>

      {/* Bottom Insights Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-white via-sky-50 to-indigo-50 border border-sky-200 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md shadow-[0_12px_30px_rgba(59,130,246,0.08)] overflow-hidden min-w-0">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Gemini AI Productivity Recommendation
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              You execute deep work 28% faster between 09:00 AM and 11:30 AM. Consider scheduling high-priority coding and architecture tasks during this window to boost your daily XP gain by ~250 pts.
            </p>
          </div>
        </div>

        <button className="whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 text-white border border-cyan-600 hover:bg-cyan-600 transition-all shadow-md">
          Apply Recommendation
        </button>
      </div>
    </div>
  );
};
