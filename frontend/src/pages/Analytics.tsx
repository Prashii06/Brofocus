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
      return res.data;
    },
  });

  // Query Tasks for Donut Breakdown
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const res = await tasksApi.getTasks();
      return res.data.tasks;
    },
  });

  const tasks = tasksData || [];
  const taskCounts = {
    pending: tasks.filter((t: any) => t.status === 'pending').length || 4,
    in_progress: tasks.filter((t: any) => t.status === 'in_progress').length || 3,
    completed: tasks.filter((t: any) => t.status === 'completed').length || 8,
  };


  const focusData = trendsData?.trend || [
    { date: 'Mon', focus_hours: 5.5, tasks_completed: 6 },
    { date: 'Tue', focus_hours: 7.2, tasks_completed: 9 },
    { date: 'Wed', focus_hours: 6.8, tasks_completed: 7 },
    { date: 'Thu', focus_hours: 8.4, tasks_completed: 11 },
    { date: 'Fri', focus_hours: 6.1, tasks_completed: 8 },
    { date: 'Sat', focus_hours: 3.5, tasks_completed: 4 },
    { date: 'Sun', focus_hours: 4.0, tasks_completed: 5 },
  ];

  return (
    <div className="space-y-6 pb-12">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Focus Time</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">41.4 hrs</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              +14%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Avg 6.9 hrs / workday</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus Efficiency</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">92.4%</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              +3.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on uninterrupted work blocks</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">12 Days</span>
            <span className="text-xs font-semibold text-amber-400 font-mono">⚡ Hot</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Best record: 18 days</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Time Saved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">6.5 hrs</span>
            <span className="text-xs font-semibold text-cyan-400">Gemini</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Via automated scheduling & briefings</p>
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-cyan-950/40 border border-violet-500/20 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Gemini AI Productivity Recommendation
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              You execute deep work 28% faster between 09:00 AM and 11:30 AM. Consider scheduling high-priority coding and architecture tasks during this window to boost your daily XP gain by ~250 pts.
            </p>
          </div>
        </div>

        <button className="whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all shadow-md">
          Apply Recommendation
        </button>
      </div>
    </div>
  );
};
