// BroFocus - API Client (Axios)
import axios from 'axios';

const BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brofocus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('brofocus_token', data.access_token);
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return api.request(error.config);
      } catch {
        localStorage.removeItem('brofocus_token');
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  google: (credential: string) => api.post('/auth/google', { credential }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const userApi = {
  updateProfile: (data: { avatarUrl: string }) => api.patch('/user/profile', data).then((r) => r.data),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: () => api.get('/tasks').then((r) => r.data),
  getTasks: () => api.get('/tasks').then((r) => r.data),
  create: (data: { title: string; priority?: string; due_date?: string; description?: string }) =>
    api.post('/tasks', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const scheduleApi = {
  scanContext: () => api.post('/schedule/scan-context').then((r) => r.data),
  smartPlan: () => api.post('/schedule/smart-plan').then((r) => r.data),
  getTimeline: (view: 'day' | 'week' = 'day', date?: string) =>
    api.get('/schedule/timeline', { params: { view, date } }).then((r) => r.data),
  createBlock: (data: { title: string; start: string; end: string; type: 'focus' | 'meeting' | 'task' | 'break' }) =>
    api.post('/schedule/blocks', data).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getTrends: () => api.get('/analytics/trends').then((r) => r.data),
  getProgressBar: () => api.get('/analytics/progress-bar').then((r) => r.data),
};

// ─── Engagement ───────────────────────────────────────────────────────────────
export const engagementApi = {
  autoSync: () => api.post('/engagement/auto-sync').then((r) => r.data),
  getMorningKickoff: () => api.get('/engagement/morning-kickoff').then((r) => r.data),
  getEveningWrap: () => api.get('/engagement/evening-wrap').then((r) => r.data),
  sendNotification: (data: { type: string; title: string; message: string }) =>
    api.post('/engagement/notifications', data).then((r) => r.data),
  dispatchNotification: (title: string, message: string, type: string) =>
    api.post('/engagement/notifications', { title, message, type }).then((r) => r.data),
  getNotifications: () => api.get('/engagement/notifications').then((r) => r.data),
};

// ─── Assistant ────────────────────────────────────────────────────────────────
export const assistantApi = {
  chat: (message: string, sessionId?: string) =>
    api.post('/assistant/chat', { message, session_id: sessionId }).then((r) => r.data),
  sendMessage: (message: string, webSearchMode = false) =>
    api.post('/assistant/chat', { message, web_search: webSearchMode }).then((r) => r.data),
  webSearch: (query: string) => api.post('/assistant/web-search', { query }).then((r) => r.data),
  getHistory: (sessionId?: string) =>
    api.get('/assistant/history', { params: { session_id: sessionId } }).then((r) => r.data),
};

export const publicChatApi = {
  chat: (message: string, sessionId = 'landing') =>
    api.post('/public/chat', { message, session_id: sessionId }).then((r) => r.data),
};

export const contactApi = {
  send: (data: { name: string; email: string; message: string }) =>
    api.post('/contact', data).then((r) => r.data),
};

export const workspaceApi = {
  chat: (message: string, sessionId = 'dashboard') =>
    api.post('/workspace/chat', { message, session_id: sessionId }).then((r) => r.data),
  confirm: (proposalId: string, confirmed: boolean) =>
    api.post('/workspace/confirm', { proposal_id: proposalId, confirmed }).then((r) => r.data),
};

// ─── Multimodal ───────────────────────────────────────────────────────────────
export const multimodalApi = {
  processVoice: (audioData: string | File, prompt?: string) => {
    return api.post('/multimodal/voice', { audio: audioData, prompt }).then((r) => r.data);
  },
  analyzeVision: (base64Image: string, mimeType: string, prompt?: string) => {
    return api.post('/multimodal/vision', { base64Image, mimeType, prompt }).then((r) => r.data);
  },
  processVision: (imageFile: File, prompt?: string) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (prompt) formData.append('prompt', prompt);
    return api
      .post('/multimodal/vision', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};

// ─── Integrations ─────────────────────────────────────────────────────────────
export const integrationsApi = {
  getStatus: () => api.get('/integrations/status', { params: { _ts: Date.now() } }).then((r) => r.data),
  connect: (provider: string) => api.post(`/integrations/connect/${provider}`).then((r) => r.data),
  connectProvider: (provider: string) =>
    api.post(`/integrations/connect/${provider}`).then((r) => r.data),
  disconnect: (provider: string) =>
    api.delete(`/integrations/disconnect/${provider}`).then((r) => r.data),
  disconnectProvider: (provider: string) =>
    api.delete(`/integrations/disconnect/${provider}`).then((r) => r.data),
};

export default api;