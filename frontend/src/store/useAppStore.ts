// BroFocus - Zustand Global Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, User, Notification, ChatMessage, KanbanData } from '../types';
import { authApi, engagementApi } from '../api/client';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;

  // Tasks
  tasks: KanbanData | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Chat
  chatMessages: ChatMessage[];
  chatHistory: ChatMessage[];
  chatSessionId: string;

  // UI State
  sidebarOpen: boolean;
  activePage: string;

  // XP Animation
  xpAnimation: { show: boolean; points: number } | null;

  // Actions
  fetchUser: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (val: boolean) => void;
  setTasks: (tasks: KanbanData) => void;
  updateTaskInStore: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Task, status: keyof KanbanData) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Partial<Notification> & { title: string; message: string }) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateLastChatMessage: (updates: Partial<ChatMessage>) => void;
  clearChat: () => void;
  clearChatHistory: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  triggerXPAnimation: (points: number) => void;
  clearXPAnimation: () => void;
  updateUserPoints: (points: number) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      authLoading: true,
      authError: null,
      tasks: null,
      notifications: [],
      unreadCount: 0,
      chatMessages: [],
      get chatHistory() {
        return get().chatMessages;
      },
      chatSessionId: `session-${Date.now()}`,
      sidebarOpen: true,
      activePage: 'dashboard',
      xpAnimation: null,

      // Auth
      fetchUser: async () => {
        try {
          const res = await authApi.me();
          if (res?.user) {
            set({ user: res.user, isAuthenticated: true, authLoading: false });
            void engagementApi.autoSync().catch(() => undefined);
          } else {
            set({ isAuthenticated: false, authLoading: false });
          }
        } catch {
          // Not logged in (no valid access/refresh token) - this is a normal,
          // expected state for a first-time visitor, not an error to paper
          // over with a fake account.
          set({ user: null, isAuthenticated: false, authLoading: false });
        }
      },
      loginWithGoogle: async (credential) => {
        set({ authError: null });
        try {
          const res = await authApi.google(credential);
          get().setToken(res.access_token);
          set({ user: res.user, isAuthenticated: true, authLoading: false });
          void engagementApi.autoSync().catch(() => undefined);
          return { ok: true };
        } catch (err: any) {
          const message =
            err?.response?.data?.error ||
            'Google sign-in failed. Please try again.';
          const details = err?.response?.data?.details;
          set({ authError: message });
          return { ok: false, error: details ? `${message}: ${details}` : message };
        }
      },
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) localStorage.setItem('brofocus_token', token);
        else localStorage.removeItem('brofocus_token');
        set({ token });
      },
      setAuthenticated: (val) => set({ isAuthenticated: val }),

      // Tasks
      setTasks: (tasks) => set({ tasks }),
      updateTaskInStore: (taskId, updates) => {
        const { tasks } = get();
        if (!tasks) return;

        const newTasks = { ...tasks };
        (['pending', 'in_progress', 'completed'] as const).forEach((status) => {
          newTasks[status] = newTasks[status].map((t) => (t.id === taskId ? { ...t, ...updates } : t));
        });

        if (updates.status) {
          const currentStatus = (['pending', 'in_progress', 'completed'] as const).find((s) =>
            newTasks[s].some((t) => t.id === taskId)
          );

          if (currentStatus && currentStatus !== updates.status) {
            const task = newTasks[currentStatus].find((t) => t.id === taskId)!;
            newTasks[currentStatus] = newTasks[currentStatus].filter((t) => t.id !== taskId);
            newTasks[updates.status as keyof KanbanData] = [
              ...newTasks[updates.status as keyof KanbanData],
              { ...task, ...updates },
            ];
          }
        }

        set({ tasks: newTasks });
      },
      addTask: (task, status) => {
        const { tasks } = get();
        if (!tasks) {
          set({ tasks: { pending: [], in_progress: [], completed: [], [status]: [task] } });
          return;
        }
        set({ tasks: { ...tasks, [status]: [task, ...tasks[status]] } });
      },

      // Notifications
      setNotifications: (notifications) =>
        set({
          notifications: notifications.slice(0, 50),
          unreadCount: notifications.filter((n) => !n.read).length,
        }),
      addNotification: (notification) => {
        const { notifications } = get();
        const fullNotification: Notification = {
          id: notification.id || 'notif-' + Date.now() + Math.random().toString(36).substr(2, 4),
          user_id: notification.user_id || 'user-1',
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          read: notification.read || false,
          created_at: notification.created_at || new Date().toISOString(),
        };
        const duplicate = notifications.some((item) => item.title === fullNotification.title && item.message === fullNotification.message);
        if (duplicate) return;
        const updated = [fullNotification, ...notifications].slice(0, 50);
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },
      removeNotification: (id) => {
        const { notifications } = get();
        const updated = notifications.filter((n) => n.id !== id);
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },
      markNotificationRead: (id) => {
        const { notifications } = get();
        const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
        set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
      },

      // Chat
      addChatMessage: (message) => {
        const { chatMessages } = get();
        set({ chatMessages: [...chatMessages, message] });
      },
      updateLastChatMessage: (updates) => {
        const { chatMessages } = get();
        const updated = [...chatMessages];
        if (updated.length > 0) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], ...updates };
        }
        set({ chatMessages: updated });
      },
      clearChat: () => set({ chatMessages: [], chatSessionId: `session-${Date.now()}` }),
      clearChatHistory: () => set({ chatMessages: [], chatSessionId: `session-${Date.now()}` }),

      // UI
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActivePage: (page) => set({ activePage: page }),

      // XP Animation
      triggerXPAnimation: (points) => {
        set({ xpAnimation: { show: true, points } });
        setTimeout(() => get().clearXPAnimation(), 3000);
      },
      clearXPAnimation: () => set({ xpAnimation: null }),
      updateUserPoints: (points) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, productivity_points: points } });
        }
      },

      // Logout
      logout: () => {
        authApi.logout().catch(() => {
          // Best-effort: even if the network call fails, still clear local
          // state below so the UI doesn't get stuck "logged in".
        });
        localStorage.removeItem('brofocus_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          authLoading: false,
          tasks: null,
          notifications: [],
          chatMessages: [],
        });
      },
    }),
    {
      name: 'brofocus-store',
      partialize: (state) => ({
        token: state.token,
        sidebarOpen: state.sidebarOpen,
        chatMessages: state.chatMessages.slice(-50),
        chatSessionId: state.chatSessionId,
      }),
    }
  )
);