// BroFocus - Tasks Routes (/api/v1/tasks)
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { store, TaskStatus, TaskPriority } from '../store/inMemory';

const router = Router();
router.use(authenticate);

const XP_PER_COMPLETION: Record<TaskPriority, number> = {
  low: 25,
  medium: 50,
  high: 100,
  urgent: 150,
};

// GET /api/v1/tasks
router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { status } = req.query;

  let tasks = await store.getTasks(userId);

  if (status && typeof status === 'string') {
    tasks = tasks.filter(t => t.status === status);
  }

  // Group by status for Kanban
  const grouped = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  res.json({
    status: 'success',
    tasks: status ? tasks : grouped,
    total: tasks.length,
  });
});

// POST /api/v1/tasks
router.post('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title, priority = 'medium', due_date, description, status = 'pending' } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const task = await store.createTask({
    title: title.trim(),
    description,
    priority: priority as TaskPriority,
    status: status as TaskStatus,
    due_date,
    user_id: userId,
  });

  return res.status(201).json({
    status: 'success',
    task,
    message: 'Task created successfully',
  });
});

// PATCH /api/v1/tasks/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const updates = req.body;

  const task = await store.getTask(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (task.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if task is being completed for first time
  const isBeingCompleted = updates.status === 'completed' && task.status !== 'completed';
  let xpAwarded = 0;
  let updatedUser = null;

  const updatedTask = await store.updateTask(id, {
    ...updates,
    xp_awarded: isBeingCompleted ? true : task.xp_awarded,
  });

  // Auto-increment gamification points on completion
  if (isBeingCompleted && !task.xp_awarded) {
    xpAwarded = XP_PER_COMPLETION[task.priority] || 50;
    updatedUser = await store.awardXP(userId, xpAwarded);

    // Create success notification
    await store.createNotification({
      user_id: userId,
      type: 'success',
      title: '✅ Task Completed!',
      message: `"${task.title}" done! +${xpAwarded} XP earned. ${updatedUser?.productivity_points} total points.`,
    });
  }

  return res.json({
    status: 'success',
    task: updatedTask,
    xp_awarded: xpAwarded,
    user_points: updatedUser?.productivity_points,
    message: isBeingCompleted ? `Task completed! +${xpAwarded} XP` : 'Task updated',
  });
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const task = await store.getTask(id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (task.user_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await store.deleteTask(id);

  res.json({ status: 'success', message: 'Task deleted', task_id: id });
});

export default router;