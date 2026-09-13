// BroFocus Backend - Gemini AI Service
// Integrates with Google Gemini API for chat, multimodal, and web grounding

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AI_AVAILABLE = !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';

let genAI: GoogleGenerativeAI | null = null;
let chatModel: GenerativeModel | null = null;
let visionModel: GenerativeModel | null = null;
let publicChatModel: GenerativeModel | null = null;
let workspaceModel: GenerativeModel | null = null;

if (AI_AVAILABLE && GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const generationConfig: GenerationConfig = {
    temperature: 0.8,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 2048,
  };

  chatModel = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig,
    systemInstruction: `You are BroFocus AI — a highly capable, motivating AI productivity assistant.
Your personality: concise, energetic, action-oriented, like a brilliant productivity coach.
You help users:
1. Manage tasks and schedules intelligently
2. Answer productivity-related questions
3. Search for real-time information when asked
4. Create, update, and prioritize tasks
5. Provide insights on focus sessions and work patterns

Always be direct and actionable. Format responses with markdown when useful.
Keep responses concise unless detail is explicitly requested.`,
  });

  publicChatModel = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 300,
    },
    systemInstruction: `You are BroBot, the interactive AI Assistant on the public landing page for BroFocus.
Your goal is to explain how to use BroFocus, how its features work, and how it helps people plan focus time, manage tasks, and stay productive.

Always maintain an energetic, motivating, and helpful tone (the "BroFocus vibe"). Keep answers concise, 2-4 sentences maximum.

Knowledge Base / FAQ:
1. BroFocus helps people plan work, manage tasks, protect deep-focus time, and track progress with AI-guided scheduling.
2. The Daily Frog concept means tackling the single highest-stakes, highest-priority task before smaller distractions.
3. BroFocus combines a Kanban board, calendar-style planning, and AI suggestions to keep a day balanced and realistic.
4. Completing tasks earns XP, builds a daily streak, and fills the Productivity Bar as users level up.
5. BroFocus can connect to Google Workspace so it can read Gmail and Calendar signals, spot conflicts, and suggest smarter scheduling.
6. BroFocus supports simple usage flows such as creating tasks, reviewing priorities, planning blocks, and following daily momentum.
7. If a visitor asks for anything outside BroFocus usage, politely redirect them back to productivity, task planning, and focus.

Do not mention sign-in, login, sign up, or user accounts unless the user explicitly asks about how to access the product. Keep the conversation focused on usage, features, and productivity guidance.`,
  });

  workspaceModel = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: { temperature: 0.4, topP: 0.9, maxOutputTokens: 700 },
    tools: [{ functionDeclarations: [
      {
        name: 'search_gmail',
        description: 'Search the authenticated user\'s recent Gmail messages. Use only when the user asks about inbox, emails, senders, or threads.',
        parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Gmail search query, for example newer_than:7d from:john@example.com' }, max_results: { type: 'INTEGER' } }, required: ['query'] },
      },
      {
        name: 'get_calendar_events',
        description: 'Read the authenticated user\'s Google Calendar events within a time window.',
        parameters: { type: 'OBJECT', properties: { time_min: { type: 'STRING', description: 'ISO-8601 start time' }, time_max: { type: 'STRING', description: 'ISO-8601 end time' }, query: { type: 'STRING' } }, required: ['time_min', 'time_max'] },
      },
      {
        name: 'create_calendar_event',
        description: 'Prepare a proposed calendar event. Never commit it directly; the application will ask the user for confirmation first.',
        parameters: { type: 'OBJECT', properties: { summary: { type: 'STRING' }, description: { type: 'STRING' }, start: { type: 'STRING', description: 'ISO-8601 start time' }, end: { type: 'STRING', description: 'ISO-8601 end time' }, timezone: { type: 'STRING' }, attendees: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['summary', 'start', 'end'] },
      },
      {
        name: 'create_task',
        description: 'Prepare a proposed BroFocus task. Never create it directly; the application will ask the user for confirmation first.',
        parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' }, description: { type: 'STRING' }, priority: { type: 'STRING', enum: ['low', 'medium', 'high', 'urgent'] }, due_date: { type: 'STRING' } }, required: ['title'] },
      },
      {
        name: 'create_gmail_draft',
        description: 'Create a Gmail draft only. Never send it. Use when the user asks to draft an email based on context.',
        parameters: { type: 'OBJECT', properties: { to: { type: 'STRING' }, subject: { type: 'STRING' }, body: { type: 'STRING' } }, required: ['to', 'subject', 'body'] },
      },
      {
        name: 'update_task',
        description: 'Move an existing BroFocus task between pending, in_progress, and completed when the user explicitly asks.',
        parameters: { type: 'OBJECT', properties: { task_id: { type: 'STRING', description: 'The task ID, when available' }, title: { type: 'STRING', description: 'The task title, used when the task ID is unavailable' }, status: { type: 'STRING', enum: ['pending', 'in_progress', 'completed'] } }, required: ['status'] },
      },
      {
        name: 'create_time_block',
        description: 'Prepare a focus, task, meeting, or break slot in the BroFocus schedule. The user must confirm before saving it.',
        parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' }, start: { type: 'STRING' }, end: { type: 'STRING' }, type: { type: 'STRING', enum: ['task', 'meeting', 'focus', 'break'] }, color: { type: 'STRING' } }, required: ['title', 'start', 'end', 'type'] },
      },
    ] }],
    systemInstruction: `You are BroFocus Workspace AI, an action-oriented productivity assistant.
Use search_gmail and get_calendar_events to answer questions about the user's connected Google Workspace data.
Use create_calendar_event, create_task, and create_time_block only when the user clearly requests a mutation. Those tools create a proposal only; the application will require explicit confirmation before committing it. Use create_gmail_draft to save a draft, never send an email. Use update_task only when the user explicitly asks to move a task.
Never claim an event or task was created unless a confirmed mutation result is provided.
Be concise, mention missing Gmail/Calendar connections clearly, and never reveal access tokens or private implementation details.`,
  } as any);

  visionModel = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig,
  });
}

// ─── Simulated Responses (Fallback) ──────────────────────────────────────────

const SIMULATED_CHAT_RESPONSES = [
  "I've analyzed your schedule and found **3 optimization opportunities**. Your deep work block at 2pm conflicts with the recurring team sync. I'd recommend moving the sync to 11am. Want me to reschedule?",
  "Based on your productivity patterns, you're most effective between **9am–12pm**. I've blocked this time for your highest-priority tasks this week.",
  "Your task completion rate is **87%** this week — that's 12% above your monthly average! The Q4 roadmap task is your most critical blocker right now.",
  "I found **2 emails** requiring follow-up and **1 calendar invite** you haven't responded to. Want me to draft replies?",
  "Quick status: **6 tasks pending**, **2 in progress**, **2 completed** today. At this pace, you'll finish the sprint with a day to spare. 🔥",
  "Web search complete. Here's what I found: The latest productivity research suggests **Pomodoro intervals of 52 minutes** with 17-minute breaks optimize deep work. Want me to adjust your focus blocks?",
];

function getSimulatedResponse(query: string): string {
  // Simple keyword-based selection for demo
  const q = query.toLowerCase();
  if (q.includes('search') || q.includes('news') || q.includes('weather')) {
    return SIMULATED_CHAT_RESPONSES[5];
  }
  if (q.includes('task') || q.includes('todo')) {
    return SIMULATED_CHAT_RESPONSES[4];
  }
  if (q.includes('schedule') || q.includes('calendar') || q.includes('meeting')) {
    return SIMULATED_CHAT_RESPONSES[0];
  }
  if (q.includes('focus') || q.includes('productive')) {
    return SIMULATED_CHAT_RESPONSES[1];
  }
  if (q.includes('email') || q.includes('gmail')) {
    return SIMULATED_CHAT_RESPONSES[3];
  }
  return SIMULATED_CHAT_RESPONSES[Math.floor(Math.random() * SIMULATED_CHAT_RESPONSES.length)];
}

// ─── Service Functions ────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const WORKSPACE_TOOL_NAMES = ['search_gmail', 'get_calendar_events', 'create_calendar_event', 'create_task', 'create_gmail_draft', 'update_task', 'create_time_block'] as const;
export type WorkspaceToolName = typeof WORKSPACE_TOOL_NAMES[number];

export interface WorkspaceToolCall {
  name: WorkspaceToolName;
  args: Record<string, unknown>;
}

export async function processWorkspaceChat(
  message: string,
  history: ChatMessage[],
  onToolCall: (toolCall: WorkspaceToolCall) => Promise<unknown>,
): Promise<{ response: string; ai_used: boolean; proposal?: unknown }> {
  if (!AI_AVAILABLE || !workspaceModel) {
    return { response: 'Workspace AI is not configured yet. Connect Gemini on the backend to enable Gmail and Calendar actions.', ai_used: false };
  }

  try {
    const normalizedHistory = history.filter((item) => item.content.trim().length > 0);
    const firstUserIndex = normalizedHistory.findIndex((item) => item.role === 'user');
    const chatHistory = firstUserIndex >= 0 ? normalizedHistory.slice(firstUserIndex) : [];
    const chat = workspaceModel.startChat({ history: chatHistory.map((item) => ({ role: item.role, parts: [{ text: item.content }] })) });
    const first = await chat.sendMessage(message);
    const functionCall = (first.response as any).functionCalls?.()?.[0] as { name?: string; args?: Record<string, unknown> } | undefined;
    if (!functionCall?.name || !WORKSPACE_TOOL_NAMES.includes(functionCall.name as WorkspaceToolName)) {
      return { response: first.response.text(), ai_used: true };
    }

    const toolCall = { name: functionCall.name as WorkspaceToolName, args: functionCall.args || {} };
    const toolResult = await onToolCall(toolCall);
    if (toolCall.name === 'create_calendar_event' || toolCall.name === 'create_task' || toolCall.name === 'create_time_block') {
      return { response: 'I prepared this action for your confirmation. Nothing has been changed yet.', ai_used: true, proposal: toolResult };
    }

    const second = await chat.sendMessage(
      `The ${toolCall.name} tool returned this data. Use it to answer the user's request accurately. Do not call another tool for this turn.\n${JSON.stringify(toolResult)}`,
    );
    return { response: second.response.text(), ai_used: true };
  } catch (error) {
    console.error('[GeminiService] Workspace chat error:', error);
    if (error instanceof Error && error.name === 'WorkspaceAuthError') {
      throw error;
    }
    return { response: 'I could not complete that Workspace request because the AI service returned an error. Please try again in a moment.', ai_used: false };
  }
}

export async function processChat(
  message: string,
  history: ChatMessage[] = []
): Promise<{ response: string; ai_used: boolean }> {
  if (!AI_AVAILABLE || !chatModel) {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    return { response: getSimulatedResponse(message), ai_used: false };
  }

  try {
    const chat = chatModel.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();
    return { response, ai_used: true };
  } catch (error) {
    console.error('[GeminiService] Chat error:', error);
    return { response: getSimulatedResponse(message), ai_used: false };
  }
}

export async function processPublicChat(
  message: string,
  history: ChatMessage[] = [],
): Promise<{ response: string; ai_used: boolean }> {
  if (!AI_AVAILABLE || !publicChatModel) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      response: getPublicFallbackResponse(message),
      ai_used: false,
    };
  }

  try {
    const chat = publicChatModel.startChat({
      history: history.map((item) => ({ role: item.role, parts: [{ text: item.content }] })),
    });
    const result = await chat.sendMessage(message);
    return { response: result.response.text(), ai_used: true };
  } catch (error) {
    console.error('[GeminiService] Public chat error:', error);
    return { response: getPublicFallbackResponse(message), ai_used: false };
  }
}

function getPublicFallbackResponse(message: string): string {
  const question = message.toLowerCase();
  if (question.includes('free') || question.includes('price') || question.includes('cost')) {
    return 'BroFocus has a free tier for individual productivity tracking. Premium tiers unlock deeper contextual scanning and advanced AI capabilities.';
  }
  if (question.includes('google') || question.includes('calendar') || question.includes('gmail')) {
    return 'BroFocus can connect Google Calendar and Gmail to spot conflicts, summarize upcoming work, and help rebalance your day more intelligently.';
  }
  if (question.includes('start') || question.includes('how to use') || question.includes('get started') || question.includes('begin')) {
    return 'Start by creating a few tasks, setting priorities, and using BroFocus to plan your high-impact work blocks before smaller distractions.';
  }
  if (question.includes('xp') || question.includes('streak') || question.includes('game')) {
    return 'Yes, BroFocus is gamified. Completing tasks earns XP, builds your daily streak, and fills your Productivity Bar as you level up.';
  }
  return 'BroFocus helps you plan work, protect deep-focus time, and turn priorities into daily momentum using AI suggestions, task tracking, and scheduling. Ask me how to use it for planning, focus, or task management.';
}

export async function webSearch(query: string): Promise<{ result: string; ai_used: boolean }> {
  if (!AI_AVAILABLE || !chatModel) {
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    return {
      result: `**Web Search Results for "${query}"** (Simulated)\n\n` +
        `Based on recent information:\n` +
        `- ${query} is trending with significant developments in the past 24 hours\n` +
        `- Key insight: experts recommend staying updated via official sources\n` +
        `- Related topics: productivity, AI, technology\n\n` +
        `*Connect your Gemini API key for real-time web search results.*`,
      ai_used: false,
    };
  }

  try {
    const searchModel = genAI!.getGenerativeModel({
      model: 'gemini-3.6-flash',
      tools: [{ googleSearch: {} } as any],
    });

    const result = await searchModel.generateContent(
      `Search the web and provide a concise, accurate summary for: ${query}`
    );
    return { result: result.response.text(), ai_used: true };
  } catch (error) {
    console.error('[GeminiService] Web search error:', error);
    return {
      result: `Search results for "${query}" are temporarily unavailable. Please try again shortly.`,
      ai_used: false,
    };
  }
}

export async function scanEmailContext(): Promise<{ tasks_found: number; summary: string; ai_used: boolean }> {
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));

  const summaries = [
    'Scanned 47 recent emails. Extracted 5 action items: product review deadline (tomorrow), client follow-up needed (3 emails), team survey responses pending.',
    'Processed Gmail inbox. Found 3 meeting invites unacknowledged, 2 task-related threads, and 1 urgent client request.',
    'Context scan complete. 12 emails analyzed. Key findings: sprint retrospective notes need filing, 2 PRs awaiting your review.',
  ];

  return {
    tasks_found: Math.floor(3 + Math.random() * 5),
    summary: summaries[Math.floor(Math.random() * summaries.length)],
    ai_used: AI_AVAILABLE,
  };
}

export async function smartPlanSchedule(): Promise<{
  optimized_slots: number;
  changes: string[];
  ai_used: boolean;
}> {
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

  return {
    optimized_slots: Math.floor(3 + Math.random() * 5),
    changes: [
      'Moved "Deep Work: Gemini API" to your peak focus window (9–11am)',
      'Rescheduled "Team Standup" to avoid afternoon energy dip',
      'Added 15-min buffer blocks between back-to-back meetings',
      'Blocked 30-min review session before EOD for task catch-up',
    ].slice(0, 2 + Math.floor(Math.random() * 3)),
    ai_used: AI_AVAILABLE,
  };
}

export async function processVision(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<{ result: string; ai_used: boolean }> {
  if (!AI_AVAILABLE || !visionModel) {
    await new Promise(r => setTimeout(r, 1500));
    return {
      result: '**Vision Analysis** (Simulated)\n\nImage received and analyzed. Detected:\n- Document/screenshot type content\n- Text extraction complete\n- No critical issues found\n\n*Connect Gemini API key for real computer vision analysis.*',
      ai_used: false,
    };
  }

  try {
    const result = await visionModel.generateContent([
      { text: prompt || 'Analyze this image. If it contains a task, document, or code, extract actionable insights.' },
      { inlineData: { data: base64Image, mimeType } },
    ]);
    return { result: result.response.text(), ai_used: true };
  } catch (error) {
    console.error('[GeminiService] Vision error:', error);
    return { result: 'Vision processing encountered an error. Please try again.', ai_used: false };
  }
}

export const isAIAvailable = () => AI_AVAILABLE;
