import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { processWorkspaceChat, ChatMessage, WorkspaceToolCall } from '../services/geminiService';
import { createCalendarEvent, getCalendarEvents, searchGmail, WorkspaceAuthError } from '../services/googleWorkspaceService';
import { store, TaskPriority } from '../store/inMemory';

const router = Router();
router.use(authenticate);

interface PendingProposal {
  userId: string;
  type: 'calendar_event' | 'task';
  payload: Record<string, unknown>;
  expiresAt: number;
}

const histories = new Map<string, ChatMessage[]>();
const proposals = new Map<string, PendingProposal>();

function cleanExpiredProposals() {
  const now = Date.now();
  for (const [id, proposal] of proposals) {
    if (proposal.expiresAt < now) proposals.delete(id);
  }
}

async function runWorkspaceTool(userId: string, toolCall: WorkspaceToolCall): Promise<unknown> {
  const args = toolCall.args;
  if (toolCall.name === 'search_gmail') {
    return { type: 'gmail_results', messages: await searchGmail(userId, String(args.query || 'newer_than:7d'), Number(args.max_results || 10)) };
  }
  if (toolCall.name === 'get_calendar_events') {
    return {
      type: 'calendar_results',
      events: await getCalendarEvents(userId, String(args.time_min), String(args.time_max), args.query ? String(args.query) : undefined),
    };
  }
  if (toolCall.name === 'create_calendar_event') {
    const payload = {
      summary: String(args.summary || ''),
      description: args.description ? String(args.description) : undefined,
      start: String(args.start || ''),
      end: String(args.end || ''),
      timezone: args.timezone ? String(args.timezone) : 'UTC',
      attendees: Array.isArray(args.attendees) ? args.attendees.map(String) : [],
    };
    if (!payload.summary || !payload.start || !payload.end) throw new Error('Calendar proposal needs a title, start time, and end time.');
    const proposalId = randomUUID();
    proposals.set(proposalId, { userId, type: 'calendar_event', payload, expiresAt: Date.now() + 10 * 60 * 1000 });
    return { proposal_id: proposalId, type: 'calendar_event', payload, requires_confirmation: true };
  }

  const priority = ['low', 'medium', 'high', 'urgent'].includes(String(args.priority)) ? String(args.priority) as TaskPriority : 'medium';
  const payload = {
    title: String(args.title || ''),
    description: args.description ? String(args.description) : undefined,
    priority,
    due_date: args.due_date ? String(args.due_date) : undefined,
  };
  if (!payload.title) throw new Error('Task proposal needs a title.');
  const proposalId = randomUUID();
  proposals.set(proposalId, { userId, type: 'task', payload, expiresAt: Date.now() + 10 * 60 * 1000 });
  return { proposal_id: proposalId, type: 'task', payload, requires_confirmation: true };
}

router.post('/chat', aiLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { message, session_id = 'dashboard' } = req.body as { message?: unknown; session_id?: string };
  if (typeof message !== 'string' || message.trim().length === 0) return res.status(400).json({ error: 'Message is required' });

  const historyKey = `${userId}:${session_id}`;
  const history = histories.get(historyKey) || [];
  try {
    const result = await processWorkspaceChat(message.trim(), history, (toolCall) => runWorkspaceTool(userId, toolCall));
    history.push({ role: 'user', content: message.trim() }, { role: 'model', content: result.response });
    if (history.length > 20) history.splice(0, history.length - 20);
    histories.set(historyKey, history);
    return res.json({ status: 'success', response: result.response, proposal: result.proposal, ai_powered: result.ai_used, session_id });
  } catch (error) {
    if (error instanceof WorkspaceAuthError) return res.status(409).json({ error: error.message, code: 'WORKSPACE_AUTH_REQUIRED' });
    console.error('[Workspace] Chat error:', error);
    return res.status(500).json({ error: 'Workspace assistant failed' });
  }
});

router.post('/confirm', async (req: Request, res: Response) => {
  cleanExpiredProposals();
  const userId = req.user!.userId;
  const { proposal_id: proposalId, confirmed } = req.body as { proposal_id?: string; confirmed?: boolean };
  if (!proposalId || confirmed !== true) return res.status(400).json({ error: 'Explicit confirmation is required.' });

  const proposal = proposals.get(proposalId);
  if (!proposal || proposal.userId !== userId) return res.status(404).json({ error: 'Proposal expired or not found.' });

  try {
    const result = proposal.type === 'calendar_event'
      ? await createCalendarEvent(userId, proposal.payload as any)
      : await store.createTask({
        title: String(proposal.payload.title),
        description: proposal.payload.description ? String(proposal.payload.description) : undefined,
        priority: proposal.payload.priority as TaskPriority,
        status: 'pending',
        due_date: proposal.payload.due_date ? String(proposal.payload.due_date) : undefined,
        user_id: userId,
      });
    proposals.delete(proposalId);
    return res.json({ status: 'success', type: proposal.type, result });
  } catch (error) {
    if (error instanceof WorkspaceAuthError) return res.status(409).json({ error: error.message, code: 'WORKSPACE_AUTH_REQUIRED' });
    console.error('[Workspace] Confirmation error:', error);
    return res.status(500).json({ error: 'Confirmed action failed' });
  }
});

export default router;
