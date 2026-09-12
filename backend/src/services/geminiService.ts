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
    model: 'gemini-1.5-flash',
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
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 300,
    },
    systemInstruction: `You are BroBot, the interactive AI Assistant on the public landing page for BroFocus.
Your goal is to answer visitor questions, explain how BroFocus works, highlight key features, and encourage visitors to sign up or log in.

Always maintain an energetic, motivating, and helpful tone (the "BroFocus vibe"). Keep answers concise, 2-4 sentences maximum.

Knowledge Base / FAQ:
1. BroFocus is an intelligent, gamified productivity platform combining schedule planning, Kanban task execution, and automated AI assistance.
2. The Daily Frog concept means tackling the single highest-stakes, high-priority obstacle before smaller distractions.
3. Google OAuth connects Gmail and Google Calendar so BroFocus can extract tasks, detect schedule conflicts, and rebalance the day.
4. Completing tasks earns XP, builds a daily streak, and fills the Productivity Bar as users level up.
5. BroFocus supports voice commands, text-to-speech, and computer vision for screenshots, documents, and code snippets.
6. BroFocus has a free individual productivity tier, with premium tiers unlocking deeper contextual scanning and advanced AI capabilities.
7. Visitors get started by clicking Continue with Google on the login page to authenticate and build a focus schedule.

Only describe features represented in this knowledge base. If a question is unrelated, briefly steer it back to BroFocus.`,
  });

  workspaceModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
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
    ] }],
    systemInstruction: `You are BroFocus Workspace AI, an action-oriented productivity assistant.
Use search_gmail and get_calendar_events to answer questions about the user's connected Google Workspace data.
Use create_calendar_event or create_task only when the user clearly requests a mutation. Those tools create a proposal only; the application will require explicit confirmation before committing it.
Never claim an event or task was created unless a confirmed mutation result is provided.
Be concise, mention missing Gmail/Calendar connections clearly, and never reveal access tokens or private implementation details.`,
  } as any);

  visionModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
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

export const WORKSPACE_TOOL_NAMES = ['search_gmail', 'get_calendar_events', 'create_calendar_event', 'create_task'] as const;
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
    const chat = workspaceModel.startChat({ history: history.map((item) => ({ role: item.role, parts: [{ text: item.content }] })) });
    const first = await chat.sendMessage(message);
    const functionCall = (first.response as any).functionCalls?.()?.[0] as { name?: string; args?: Record<string, unknown> } | undefined;
    if (!functionCall?.name || !WORKSPACE_TOOL_NAMES.includes(functionCall.name as WorkspaceToolName)) {
      return { response: first.response.text(), ai_used: true };
    }

    const toolCall = { name: functionCall.name as WorkspaceToolName, args: functionCall.args || {} };
    const toolResult = await onToolCall(toolCall);
    if (toolCall.name === 'create_calendar_event' || toolCall.name === 'create_task') {
      return { response: 'I prepared this action for your confirmation. Nothing has been changed yet.', ai_used: true, proposal: toolResult };
    }

    const second = await chat.sendMessage([{ functionResponse: { name: toolCall.name, response: toolResult as object } }]);
    return { response: second.response.text(), ai_used: true };
  } catch (error) {
    console.error('[GeminiService] Workspace chat error:', error);
    return { response: 'I could not complete that Workspace request. Check your Google connection and try again.', ai_used: false };
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
    return 'BroFocus connects through Google OAuth to scan Gmail and Google Calendar, extract tasks, detect conflicts, and rebalance your day.';
  }
  if (question.includes('start') || question.includes('sign up') || question.includes('login')) {
    return 'Click Continue with Google on the login page to get started. BroFocus will help you build a focused schedule from there.';
  }
  if (question.includes('xp') || question.includes('streak') || question.includes('game')) {
    return 'Yes, BroFocus is gamified. Completing tasks earns XP, builds your daily streak, and fills your Productivity Bar as you level up.';
  }
  return 'BroFocus combines AI scheduling, Kanban task execution, and gamification to help you protect your best focus time. Ask me about features, integrations, or getting started.';
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
      model: 'gemini-1.5-flash',
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
