// BroFocus - Analytics Routes (/api/v1/analytics)
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { store } from '../store/inMemory';

const router = Router();
router.use(authenticate);

// GET /api/v1/analytics/trends
router.get('/trends', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const sessions = await store.getFocusSessions(userId);
  const tasks = await store.getTasks(userId);

  // Build chart-ready data
  const focusTrend = sessions.map(s => ({
    date: s.date,
    focus_hours: s.focus_hours,
    tasks_completed: s.tasks_completed,
    productivity_score: s.productivity_score,
  }));

  // Task status breakdown
  const taskBreakdown = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  // Priority breakdown
  const priorityBreakdown = {
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  // Weekly summary (last 7 days)
  const last7 = sessions.slice(-7);
  const avgFocusHours = last7.length > 0
    ? Math.round((last7.reduce((sum, s) => sum + s.focus_hours, 0) / last7.length) * 10) / 10
    : 0;
  const totalCompleted = last7.reduce((sum, s) => sum + s.tasks_completed, 0);
  const avgProductivity = last7.length > 0
    ? Math.round(last7.reduce((sum, s) => sum + s.productivity_score, 0) / last7.length)
    : 0;

  res.json({
    status: 'success',
    trends: {
      focus_trend: focusTrend,
      task_breakdown: taskBreakdown,
      priority_breakdown: priorityBreakdown,
      weekly_summary: {
        avg_focus_hours: avgFocusHours,
        total_tasks_completed: totalCompleted,
        avg_productivity_score: avgProductivity,
        days_tracked: last7.length,
      },
    },
  });
});

// GET /api/v1/analytics/progress-bar
router.get('/progress-bar', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await store.getUser(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const pointsPerLevel = 500;
  const currentLevelPoints = user.productivity_points % pointsPerLevel;
  const fillPercent = Math.round((currentLevelPoints / pointsPerLevel) * 100);

  const nextMilestone = Math.ceil(user.productivity_points / 250) * 250;
  const pointsToNextMilestone = nextMilestone - user.productivity_points;

  res.json({
    status: 'success',
    progress: {
      total_points: user.productivity_points,
      current_level: user.level,
      current_level_points: currentLevelPoints,
      points_per_level: pointsPerLevel,
      fill_percent: fillPercent,
      next_level_points: pointsPerLevel - currentLevelPoints,
      next_milestone: nextMilestone,
      points_to_next_milestone: pointsToNextMilestone,
      rank: getLevelRank(user.level),
      badges: getEarnedBadges(user.productivity_points, user.level),
    },
  });
});

function getLevelRank(level: number): string {
  if (level >= 20) return 'Legendary Bro 🏆';
  if (level >= 15) return 'Elite Bro 💎';
  if (level >= 10) return 'Pro Bro 🥇';
  if (level >= 7) return 'Senior Bro 🥈';
  if (level >= 4) return 'Rising Bro 🥉';
  return 'Rookie Bro 🌱';
}

function getEarnedBadges(points: number, level: number): string[] {
  const badges = [];
  if (points >= 500) badges.push('🎯 First 500');
  if (points >= 1000) badges.push('🔥 1K Club');
  if (points >= 2000) badges.push('💎 2K Legend');
  if (level >= 5) badges.push('⚡ Level 5');
  if (level >= 10) badges.push('🏆 Level 10');
  return badges;
}

export default router;