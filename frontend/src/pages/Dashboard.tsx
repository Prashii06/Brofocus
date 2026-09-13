// BroFocus - Dashboard Page
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap, Target, Clock, TrendingUp, CheckCircle2,
  ArrowRight, Calendar, Cpu, Sun, Scan, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tasksApi, engagementApi, scheduleApi } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { KanbanData, MorningKickoff } from '../types';
import ProductivityBar from '../components/ui/ProductivityBar';
import TaskCard from '../components/ui/TaskCard';

export const Dashboard: React.FC = () => {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setTasks, triggerXPAnimation, updateUserPoints, setNotifications, setStreakCount } = useAppStore();

  // Fetch tasks
  const { data: tasksData } = useQuery<{ tasks: KanbanData }>({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  // Fetch morning kickoff
  const { data: kickoffData } = useQuery<{ kickoff: MorningKickoff }>({
    queryKey: ['morning-kickoff'],
    queryFn: engagementApi.getMorningKickoff,
  });

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: engagementApi.getNotifications,
    refetchInterval: 30000,
  });

  const scanContextMutation = useMutation({
    mutationFn: scheduleApi.scanContext,
  });

  const smartPlanMutation = useMutation({
    mutationFn: scheduleApi.smartPlan,
  });

  // Sync notifications to store
  useEffect(() => {
    if (notifData?.notifications) {
      setNotifications(notifData.notifications);
    }
  }, [notifData, setNotifications]);

  // Sync tasks to store
  useEffect(() => {
    if (tasksData?.tasks) {
      setTasks(tasksData.tasks as KanbanData);
    }
  }, [tasksData, setTasks]);

  useEffect(() => {
    const streakDays = kickoffData?.kickoff?.streak_days;
    if (streakDays !== undefined) setStreakCount(streakDays);
  }, [kickoffData?.kickoff?.streak_days, setStreakCount]);

  useEffect(() => {
    const refreshDashboardData = () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['morning-kickoff'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule-timeline'] });
    };
    window.addEventListener('brofocus-data-changed', refreshDashboardData);
    return () => window.removeEventListener('brofocus-data-changed', refreshDashboardData);
  }, [queryClient]);

  const tasks = tasksData?.tasks || { pending: [], in_progress: [], completed: [] };
  const kickoff = kickoffData?.kickoff;
  const totalTasks = tasks.pending.length + tasks.in_progress.length + tasks.completed.length;
  const completionRate = totalTasks > 0 ? Math.round((tasks.completed.length / totalTasks) * 100) : 0;

  const handleCompleteTask = async (task: any) => {
    try {
      const result = await tasksApi.update(task.id, { status: 'completed' });
      if (result.xp_awarded) {
        triggerXPAnimation(result.xp_awarded);
        if (result.user_points) updateUserPoints(result.user_points);
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['progress-bar'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const statCards = [
    {
      label: 'Active Tasks',
      value: tasks.in_progress.length + tasks.pending.length,
      icon: <Layers className="w-5 h-5 text-violet-400" />,
      color: 'from-violet-500/15 to-violet-600/5',
      border: 'border-violet-500/20',
      trend: '+2 from yesterday',
      trendUp: true,
    },
    {
      label: 'Completed Today',
      value: tasks.completed.length,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/15 to-emerald-600/5',
      border: 'border-emerald-500/20',
      trend: `${completionRate}% completion rate`,
      trendUp: true,
    },
    {
      label: 'Focus Hours',
      value: `${kickoff ? 7.5 : '—'}h`,
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/15 to-cyan-600/5',
      border: 'border-cyan-500/20',
      trend: '↑ 12% vs last week',
      trendUp: true,
    },
    {
      label: "Today's Meetings",
      value: kickoff?.meetings?.length || 0,
      icon: <Calendar className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/15 to-amber-600/5',
      border: 'border-amber-500/20',
      trend: 'Next at 10:00 AM',
      trendUp: null,
    },
  ];

  return (
    <>
      <div>
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-6 p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(124,45,244,0.2) 0%, rgba(6,182,212,0.1) 100%)',
            border: '1px solid rgba(139,77,255,0.2)',
          }}
        >
          {/* Ambient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl translate-y-1/2" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-5 h-5 text-amber-400 animate-float" />
                <span className="text-sm text-amber-400 font-medium">Morning Brief</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {kickoff?.greeting || 'Good morning, Bro! 🚀'}
              </h1>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {kickoff?.summary || 'Loading your personalized brief...'}
              </p>
              {kickoff?.motivational_message && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  "{kickoff.motivational_message}"
                </p>
              )}
            </div>
            <div className="flex-shrink-0 hidden md:flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scanContextMutation.mutate()}
                disabled={scanContextMutation.isPending}
                className="btn-secondary text-xs gap-1.5"
              >
                <Scan className="w-3.5 h-3.5" />
                {scanContextMutation.isPending ? 'Scanning...' : 'Scan Context'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => smartPlanMutation.mutate()}
                disabled={smartPlanMutation.isPending}
                className="btn-primary text-xs gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {smartPlanMutation.isPending ? 'Planning...' : 'Smart Plan'}
              </motion.button>
            </div>
          </div>

          {smartPlanMutation.data && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(139,77,255,0.1)', border: '1px solid rgba(139,77,255,0.2)' }}
            >
              <p className="text-violet-300 font-medium mb-1">✅ Smart Plan Applied</p>
              {smartPlanMutation.data.changes?.map((change: string, i: number) => (
                <p key={i} style={{ color: 'var(--text-secondary)' }}>• {change}</p>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`card-sm relative overflow-hidden bg-gradient-to-br ${stat.color} border ${stat.border}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              {stat.trend && (
                <p className={`text-[11px] flex items-center gap-1 ${stat.trendUp ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {stat.trendUp && <TrendingUp className="w-3 h-3" />}
                  {stat.trend}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Tasks + Productivity Bar */}
          <div className="xl:col-span-2 space-y-6">
            {/* Productivity Bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <ProductivityBar />
            </motion.div>

            {/* In Progress Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                  <h3 className="text-sm font-semibold text-white">In Progress</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                    {tasks.in_progress.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/kanban')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-violet-400 transition-colors"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {tasks.in_progress.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    No tasks in progress. Start one!
                  </p>
                )}
                {tasks.in_progress.slice(0, 3).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onStatusChange={(id, status) => {
                      tasksApi.update(id, { status }).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                      });
                    }}
                    compact
                  />
                ))}
              </div>
            </motion.div>

            {/* Urgent/High Priority Pending */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-semibold text-white">Priority Queue</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                    {tasks.pending.filter(t => ['urgent','high'].includes(t.priority)).length}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/kanban')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-400 transition-colors"
                >
                  Kanban <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {tasks.pending
                  .filter(t => ['urgent', 'high'].includes(t.priority))
                  .slice(0, 3)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onStatusChange={(id, status) => {
                        tasksApi.update(id, { status }).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        });
                      }}
                      compact
                    />
                  ))}
                {tasks.pending.filter(t => ['urgent','high'].includes(t.priority)).length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    🎉 No urgent tasks!
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Today's Schedule */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Today's Schedule
                </h3>
                <button
                  onClick={() => navigate('/schedule')}
                  className="text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  Full view →
                </button>
              </div>
              <div className="space-y-2">
                {kickoff?.meetings && kickoff.meetings.length > 0 ? (
                  kickoff.meetings.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.15)' }}
                    >
                      <div className="w-1.5 h-8 bg-cyan-400 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{m.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {m.start ? new Date(m.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''} —{' '}
                          {m.end ? new Date(m.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No meetings today 🎉
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
