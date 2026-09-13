import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { store } from '../store/inMemory';

const router = Router();
router.use(authenticate);

router.patch('/profile', async (req: Request, res: Response) => {
  const { avatarUrl } = req.body as { avatarUrl?: unknown };

  if (typeof avatarUrl !== 'string' || !avatarUrl.trim()) {
    return res.status(400).json({ error: 'avatarUrl is required.' });
  }

  try {
    const user = await store.updateUser(req.user!.userId, { avatarUrl: avatarUrl.trim() });
    return res.json({
      status: 'success',
      user: {
        id: user.id,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('[User] Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;