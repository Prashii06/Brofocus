// BroFocus - Assistant Routes (/api/v1/assistant)
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { processChat, webSearch, ChatMessage } from '../services/geminiService';

const router = Router();
router.use(authenticate);

// In-memory conversation histories (would be in DB/Redis in production)
const conversationHistories = new Map<string, ChatMessage[]>();

// POST /api/v1/assistant/chat
router.post('/chat', aiLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { message, session_id, clear_history = false } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const historyKey = `${userId}:${session_id || 'default'}`;

  if (clear_history) {
    conversationHistories.delete(historyKey);
  }

  const history = conversationHistories.get(historyKey) || [];

  try {
    const { response, ai_used } = await processChat(message.trim(), history);

    // Update history
    history.push({ role: 'user', content: message.trim() });
    history.push({ role: 'model', content: response });

    // Keep last 20 messages (10 exchanges) to manage context window
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    conversationHistories.set(historyKey, history);

    return res.json({
      status: 'success',
      response,
      ai_powered: ai_used,
      session_id: session_id || 'default',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Assistant] Chat error:', error);
    return res.status(500).json({ error: 'Assistant processing failed' });
  }
});

// POST /api/v1/assistant/web-search
router.post('/web-search', aiLimiter, async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const { result, ai_used } = await webSearch(query.trim());

    return res.json({
      status: 'success',
      query: query.trim(),
      result,
      ai_powered: ai_used,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Assistant] Web search error:', error);
    return res.status(500).json({ error: 'Web search failed' });
  }
});

// GET /api/v1/assistant/history
router.get('/history', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { session_id = 'default' } = req.query;

  const historyKey = `${userId}:${session_id}`;
  const history = conversationHistories.get(historyKey) || [];

  res.json({
    status: 'success',
    session_id,
    history,
    message_count: history.length,
  });
});

export default router;
