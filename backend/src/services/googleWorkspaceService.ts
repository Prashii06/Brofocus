import { decrypt } from '../lib/crypto';
import { store } from '../store/inMemory';

export interface GmailMessageSummary {
  id: string;
  thread_id: string;
  subject: string;
  sender: string;
  received_at?: string;
  snippet: string;
}

export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees: string[];
  html_link?: string;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timezone?: string;
  attendees?: string[];
}

interface StoredGoogleToken {
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
}

class WorkspaceAuthError extends Error {
  constructor(message = 'Google Workspace is not connected') {
    super(message);
    this.name = 'WorkspaceAuthError';
  }
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function getGoogleAccessToken(userId: string, provider: 'gmail' | 'google_calendar'): Promise<string> {
  const integration = await store.getIntegration(userId, provider);
  if (!integration?.connected || !integration.encrypted_token) {
    throw new WorkspaceAuthError(`Connect ${provider === 'gmail' ? 'Gmail' : 'Google Calendar'} in Integrations first.`);
  }

  const decryptedToken = decrypt(integration.encrypted_token);
  let storedToken: StoredGoogleToken;
  try {
    storedToken = JSON.parse(decryptedToken) as StoredGoogleToken;
  } catch {
    storedToken = { refresh_token: decryptedToken };
  }

  if (storedToken.access_token && storedToken.expires_at && storedToken.expires_at > Date.now() + 60_000) {
    return storedToken.access_token;
  }

  if (!storedToken.refresh_token) {
    throw new WorkspaceAuthError('Google authorization is incomplete. Reconnect the integration.');
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new WorkspaceAuthError('Google OAuth client credentials are not configured.');
  }

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: storedToken.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (refreshResponse.ok) {
    const refreshed = await refreshResponse.json() as { access_token?: string };
    if (refreshed.access_token) return refreshed.access_token;
  }

  throw new WorkspaceAuthError('Google authorization expired. Reconnect the integration.');
}

async function googleRequest<T>(url: string, init: RequestInit, userId: string, provider: 'gmail' | 'google_calendar'): Promise<T> {
  const accessToken = await getGoogleAccessToken(userId, provider);
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (response.status === 401) throw new WorkspaceAuthError('Google authorization expired. Reconnect the integration.');
  if (!response.ok) throw new Error(`Google API request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export async function searchGmail(userId: string, query: string, maxResults = 10): Promise<GmailMessageSummary[]> {
  const params = new URLSearchParams({ q: query, maxResults: String(Math.min(Math.max(maxResults, 1), 20)) });
  const list = await googleRequest<{ messages?: { id: string; threadId: string }[] }>(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {}, userId, 'gmail',
  );
  const messages = await Promise.all((list.messages || []).slice(0, maxResults).map(({ id }) => googleRequest<{
    id: string;
    threadId: string;
    snippet?: string;
    internalDate?: string;
    payload?: { headers?: { name: string; value: string }[] };
  }>(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {}, userId, 'gmail')));

  return messages.map((message) => {
    const headers = message.payload?.headers || [];
    const header = (name: string) => headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value || '';
    return {
      id: message.id,
      thread_id: message.threadId,
      subject: header('subject'),
      sender: header('from'),
      received_at: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : undefined,
      snippet: message.snippet || '',
    };
  });
}

export async function getCalendarEvents(userId: string, timeMin: string, timeMax: string, query?: string): Promise<CalendarEventSummary[]> {
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '50' });
  if (query) params.set('q', query);
  const data = await googleRequest<{ items?: any[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {}, userId, 'google_calendar',
  );
  return (data.items || []).map((event) => ({
    id: event.id,
    summary: event.summary || '(Untitled event)',
    description: event.description,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    attendees: (event.attendees || []).map((attendee: { email?: string }) => attendee.email).filter(Boolean),
    html_link: event.htmlLink,
  }));
}

export async function createCalendarEvent(userId: string, input: CalendarEventInput): Promise<CalendarEventSummary> {
  const data = await googleRequest<any>('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start, timeZone: input.timezone || 'UTC' },
      end: { dateTime: input.end, timeZone: input.timezone || 'UTC' },
      attendees: (input.attendees || []).map((email) => ({ email })),
    }),
  }, userId, 'google_calendar');

  return {
    id: data.id,
    summary: data.summary,
    description: data.description,
    start: data.start?.dateTime || data.start?.date,
    end: data.end?.dateTime || data.end?.date,
    attendees: (data.attendees || []).map((attendee: { email?: string }) => attendee.email).filter(Boolean),
    html_link: data.htmlLink,
  };
}

export { WorkspaceAuthError };