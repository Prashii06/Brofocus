// BroFocus - Schedule Routes (/api/v1/schedule)
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { store, TimeBlockType } from '../store/inMemory';
import { scanEmailContext, smartPlanSchedule } from '../services/geminiService';

const router = Router();
router.use(authenticate);

router.post('/blocks', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, start, end, type } = req.body as {
    title?: string;
    start?: string;
    end?: string;
    type?: TimeBlockType;
  };

  if (!title?.trim() || !start || !end || !type || !['task', 'meeting', 'focus', 'break'].includes(type)) {
    return res.status(400).json({ error: 'Title, start, end, and a valid block type are required.' });
  }

  try {
    const timeBlock = await store.createTimeBlock({
      user_id: userId,
      title: title.trim(),
      start,
      end,
      type,
    });

    return res.status(201).json({ status: 'success', time_block: timeBlock });
  } catch (error) {
    console.error('[Schedule] create block error:', error);
    return res.status(500).json({ error: 'Failed to create schedule block' });
  }
});

// POST /api/v1/schedule/scan-context
// Gemini AI scans Gmail + Calendar for tasks and commitments
router.post('/scan-context', aiLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Respond immediately; scan continues in the background.
  res.json({
    status: 'processing',
    message: 'Contextual scan initiated for emails and calendar events.',
    estimated_time_ms: 3000,
  });

  try {
    // Background processing (would use a job queue in production)
    const result = await scanEmailContext();
    const notification = await store.createNotification({
      user_id: userId,
      type: 'ai',
      title: '📧 Gmail Context Scan Complete',
      message: result.summary,
    });

    console.log(`[Schedule] Context scan complete. Tasks found: ${result.tasks_found}. Notification: ${notification.id}`);
  } catch (error) {
    console.error('[Schedule] scan-context error:', error);
  }
});

// POST /api/v1/schedule/smart-plan
// AI rebalances tasks, resolves overlaps
router.post('/smart-plan', aiLimiter, async (req: Request, res: Response) => {
  try {
    const result = await smartPlanSchedule();

    res.json({
      status: 'success',
      optimized_slots: result.optimized_slots,
      changes: result.changes,
      message: `Schedule successfully rebalanced. ${result.optimized_slots} slots optimized.`,
      ai_powered: result.ai_used,
    });
  } catch (error) {
    console.error('[Schedule] smart-plan error:', error);
    res.status(500).json({ error: 'Schedule optimization failed' });
  }
});

// GET /api/v1/schedule/timeline
// Fetch time-block data for Routine Planner
router.get('/timeline', async (req: Request, res: Response) => {
  const { view = 'day', date } = req.query;
  const userId = req.user!.userId;

  const targetDate = typeof date === 'string' ? date : new Date().toISOString().split('T')[0];

  let timeBlocks;

  if (view === 'week') {
    const startDate = new Date(targetDate);
    const dayStrings = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      return day.toISOString().split('T')[0];
    });
    const perDayBlocks = await Promise.all(dayStrings.map(d => store.getTimeBlocks(userId, d)));
    timeBlocks = perDayBlocks.flat();
  } else {
    timeBlocks = await store.getTimeBlocks(userId, targetDate);
  }

  res.json({
    status: 'success',
    view,
    date: targetDate,
    time_blocks: timeBlocks,
    total: timeBlocks.length,
  });
});

export default router;