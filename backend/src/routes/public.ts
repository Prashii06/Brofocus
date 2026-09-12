import { Router, Request, Response } from 'express';
import { aiLimiter } from '../middleware/rateLimiter';
import { ChatMessage, processPublicChat } from '../services/geminiService';

const router = Router();
const conversationHistories = new Map<string, ChatMessage[]>();

router.post('/chat', aiLimiter, async (req: Request, res: Response) => {
  const { message, session_id = 'landing' } = req.body as { message?: unknown; session_id?: string };

  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const sessionKey = `${req.ip}:${session_id}`;
  const history = conversationHistories.get(sessionKey) || [];

  try {
    const result = await processPublicChat(message.trim(), history);
    history.push({ role: 'user', content: message.trim() }, { role: 'model', content: result.response });
    if (history.length > 12) history.splice(0, history.length - 12);
    conversationHistories.set(sessionKey, history);

    return res.json({
      status: 'success',
      response: result.response,
      ai_powered: result.ai_used,
      session_id: session_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Public] Chat error:', error);
    return res.status(500).json({ error: 'Public assistant processing failed' });
  }
});

export default router;