// BroFocus - Schedule Planner Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Zap,
  RefreshCw,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { scheduleApi } from '../api/client';
import { ScheduleSlot } from '../types';
import { TimeBlock } from '../components/ui/TimeBlock';
import { useAppStore } from '../store/useAppStore';

export const SchedulePlanner: React.FC = () => {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'focus' | 'meeting' | 'task' | 'break'>('focus');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');

  // Query Timeline Data
  const { data: timelineData, isLoading, refetch } = useQuery({
    queryKey: ['schedule-timeline'],
    queryFn: async () => {
      const res = await scheduleApi.getTimeline();
      return res.data.slots as ScheduleSlot[];
    },
  });

  // Mutation: Scan Context (Gmail & Calendar AI extraction)
  const scanContextMutation = useMutation({
    mutationFn: () => scheduleApi.scanContext(),
    onSuccess: (res) => {
      addNotification({
        title: 'Context Scan Initiated',
        message: res.data.message || 'Gemini AI is scanning emails & calendar events...',
        type: 'ai',
      });
      queryClient.invalidateQueries({ queryKey: ['schedule-timeline'] });
    },
  });

  // Mutation: Smart Plan (AI schedule rebalancer)
  const smartPlanMutation = useMutation({
    mutationFn: () => scheduleApi.smartPlan(),
    onSuccess: (res) => {
      const slots = res.data.optimized_slots || 4;
      addNotification({
        title: 'Schedule Rebalanced',
        message: `Gemini AI rebalanced ${slots} task slots to eliminate overlaps and optimize energy windows.`,
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['schedule-timeline'] });
    },
  });

  const slots = timelineData || [];

  const filteredSlots = slots.filter((slot) => {
    if (selectedCategory === 'all') return true;
    return slot.category === selectedCategory;
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Simulate adding slot
    const mockSlot: ScheduleSlot = {
      id: 'slot-' + Date.now(),
      title: newTitle,
      category: newCategory,
      start_time: newStartTime,
      end_time: newEndTime,
      duration_minutes: 60,
      completed: false,
    };

    queryClient.setQueryData(['schedule-timeline'], (old: ScheduleSlot[] | undefined) => [
      ...(old || []),
      mockSlot,
    ]);

    addNotification({
      title: 'Time Block Created',
      message: `Added "${newTitle}" to your schedule for ${newStartTime}`,
      type: 'info',
    });

    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const hoursList = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <CalendarIcon className="text-cyan-400" size={26} />
              Smart Schedule Planner
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Gemini Powered
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            AI-driven timetable optimization, conflict resolution, and peak-focus window alignment.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scan Context Button */}
          <button
            onClick={() => scanContextMutation.mutate()}
            disabled={scanContextMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-violet-500/30 text-violet-300 hover:bg-violet-950/40 hover:border-violet-500/60 transition-all shadow-md disabled:opacity-50"
          >
            {scanContextMutation.isPending ? (
              <Loader2 size={14} className="animate-spin text-violet-400" />
            ) : (
              <Sparkles size={14} className="text-violet-400" />
            )}
            <span>Scan Email & Cal</span>
          </button>

          {/* Smart Rebalance Button */}
          <button
            onClick={() => smartPlanMutation.mutate()}
            disabled={smartPlanMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {smartPlanMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Zap size={15} className="text-cyan-200 fill-cyan-200" />
            )}
            <span>AI Smart Plan</span>
          </button>

          {/* New Slot Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 hover:border-slate-600 transition-all"
          >
            <Plus size={15} />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Day/Week Toggle & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Week View
            </button>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <ChevronLeft size={16} className="cursor-pointer hover:text-slate-200" />
            <span>Today, Sep 10</span>
            <ChevronRight size={16} className="cursor-pointer hover:text-slate-200" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={12} />
            Filter:
          </span>
          {['all', 'focus', 'meeting', 'task', 'break'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize border transition-all ${
                selectedCategory === cat
                  ? 'bg-violet-600/30 border-violet-500/50 text-violet-200'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Timeline Column (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
              <Loader2 className="animate-spin mx-auto mb-2 text-cyan-400" size={24} />
              Loading schedule timeline...
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 backdrop-blur-sm space-y-4">
              {filteredSlots.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No slots match your filter. Click "Add Slot" or "AI Smart Plan" to generate items.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSlots.map((slot) => (
                    <TimeBlock
                      key={slot.id}
                      slot={slot}
                      onComplete={(id) => {
                        queryClient.setQueryData(['schedule-timeline'], (old: ScheduleSlot[] | undefined) =>
                          (old || []).map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Recommendations & Peak Window Sidebar (1/4 width) */}
        <div className="space-y-4">
          {/* Peak Focus Energy Window */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 to-cyan-950/20 border border-violet-500/20">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Zap size={14} className="text-violet-400" />
              Peak Energy Window
            </div>
            <p className="text-sm font-bold text-slate-100">09:00 AM – 11:30 AM</p>
            <p className="text-xs text-slate-400 mt-1">
              Gemini model indicates 42% higher focus speed during these hours. Reserved for Deep Work.
            </p>
          </div>

          {/* AI Suggestions Box */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={13} className="text-cyan-400" />
              AI Schedule Insights
            </h3>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-cyan-300 font-medium">
                <span>Overlap Resolved</span>
                <span className="text-[10px] text-cyan-400/80">Auto</span>
              </div>
              <p className="text-slate-400">
                Shifted "Code Review" by 30 mins to prevent collision with Google Meet standup.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-violet-300 font-medium">
                <span>Focus Block Added</span>
                <span className="text-[10px] text-violet-400/80">Recommended</span>
              </div>
              <p className="text-slate-400">
                Created a 45-min buffer block before EOD wrap-up to organize pending tasks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Plus size={18} className="text-cyan-400" />
                  Add Schedule Time Block
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSlot} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Gemini Function Calling Refactor"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="focus">Focus (Deep Work)</option>
                    <option value="meeting">Meeting (Google Meet)</option>
                    <option value="task">Task / Work</option>
                    <option value="break">Break / Buffer</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20"
                  >
                    Create Block
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
