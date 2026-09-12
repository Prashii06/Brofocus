// BroFocus - Engagement Routes (/api/v1/engagement)
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { store } from '../store/inMemory';
import { getCalendarEvents, searchGmail, WorkspaceAuthError } from '../services/googleWorkspaceService';

const router = Router();
router.use(authenticate);
const activeWorkspaceSyncs = new Set<string>();

router.post('/auto-sync', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  if (activeWorkspaceSyncs.has(userId)) {
    return res.json({ status: 'already_syncing' });
  }
  activeWorkspaceSyncs.add(userId);

  try {
  const syncTitle = 'Workspace context refreshed';
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const existingSync = await store.getRecentNotification(userId, syncTitle, startOfDay);
  if (existingSync) {
    return res.json({ status: 'already_synced', scanned: { emails: 0, events: 0 } });
  }
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  try {
    const [emails, events] = await Promise.all([
      searchGmail(userId, 'newer_than:2d', 10),
      getCalendarEvents(userId, now.toISOString(), end.toISOString()),
    ]);
    await store.createNotification({
      user_id: userId,
      type: 'ai',
      title: syncTitle,
      message: `BroFocus scanned ${emails.length} recent emails and ${events.length} upcoming calendar events for your kickoff and planning guidance.`,
    });
    return res.json({ status: 'success', scanned: { emails: emails.length, events: events.length } });
  } catch (error) {
    if (error instanceof WorkspaceAuthError) return res.status(409).json({ error: error.message, code: 'WORKSPACE_AUTH_REQUIRED' });
    console.error('[Engagement] automatic Workspace sync failed:', error);
    return res.status(502).json({ error: 'Workspace context could not be refreshed.' });
  } finally {
    activeWorkspaceSyncs.delete(userId);
  }
  } finally {
    activeWorkspaceSyncs.delete(userId);
  }
});

// GET /api/v1/engagement/morning-kickoff
router.get('/morning-kickoff', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await store.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const tasks = await store.getTasks(userId);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  const dueTodayTasks = tasks.filter(t => t.due_date === todayStr && t.status !== 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const timeBlocks = await store.getTimeBlocks(userId, todayStr);
  const meetings = timeBlocks.filter(b => b.type === 'meeting');

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  res.json({
    status: 'success',
    kickoff: {
      greeting: `${greeting}, ${user.name.split(' ')[0]}! 🚀`,
      date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      summary: `You have ${dueTodayTasks.length} tasks due today and ${meetings.length} meetings scheduled.`,
      priorities: urgentTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
      })),
      in_progress: inProgressTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
      })),
      meetings: meetings.slice(0, 5).map(m => ({
        title: m.title,
        start: m.start,
        end: m.end,
      })),
      productivity_score: user.productivity_points,
      level: user.level,
      motivational_message: getMotivationalMessage(user.level),
    },
  });
});

// GET /api/v1/engagement/evening-wrap
router.get('/evening-wrap', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await store.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const tasks = await store.getTasks(userId);
  const sessions = await store.getFocusSessions(userId);
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySession = sessions.find(s => s.date === todayStr);

  const completedToday = tasks.filter(t =>
    t.status === 'completed' &&
    t.updated_at.toISOString().startsWith(todayStr)
  );

  const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
  const pendingTomorrow = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => priorities[b.priority] - priorities[a.priority])
    .slice(0, 5);

  res.json({
    status: 'success',
    wrap: {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      completed_today: completedToday.length,
      focus_hours: todaySession?.focus_hours ?? 0,
      productivity_score: todaySession?.productivity_score ?? 0,
      xp_earned_today: completedToday.reduce((acc) => acc + 75, 0),
      completed_tasks: completedToday.map(t => ({ id: t.id, title: t.title, priority: t.priority })),
      pending_tomorrow: pendingTomorrow.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
      })),
      message: `Great work today! You completed ${completedToday.length} tasks and logged ${todaySession?.focus_hours ?? 0}h of focus time. 🎯`,
    },
  });
});

// POST /api/v1/engagement/notifications
router.post('/notifications', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { type = 'info', title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const notification = await store.createNotification({
    user_id: userId,
    type,
    title,
    message,
  });

  return res.status(201).json({
    status: 'success',
    notification,
    message: 'Notification dispatched',
  });
});

// GET /api/v1/engagement/notifications
router.get('/notifications', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const notifications = await store.getNotifications(userId);

  res.json({
    status: 'success',
    notifications,
    unread_count: notifications.filter(n => !n.read).length,
  });
});

function getMotivationalMessage(level: number): string {
  const messages = [
    "Every task you complete brings you closer to greatness. Let's make today count! 💪",
    "You're in the zone! Your consistency is building something remarkable. Keep pushing!",
    "Level up mentality: tackle the hardest thing first. The rest will feel easy.",
    "Your productivity streak is on fire 🔥. Don't let today be the day it breaks.",
    "Champions are built in the ordinary moments. This is your moment.",
  ];
  return messages[level % messages.length];
}

export default router;