// BroFocus - App Root & Router Configuration
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './pages/Dashboard';
import { SchedulePlanner } from './pages/SchedulePlanner';
import { KanbanBoard } from './pages/KanbanBoard';
import { Analytics } from './pages/Analytics';
import { Assistant } from './pages/Assistant';
import { Integrations } from './pages/Integrations';
import { Engagement } from './pages/Engagement';
import { Landing } from './pages/Landing';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import FloatingChatbot from './components/ui/FloatingChatbot';
import { useAppStore } from './store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

const ToastOverlay: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.slice(0, 3).map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${
              n.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : n.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : n.type === 'ai'
                ? 'bg-violet-950/90 border-violet-500/40 text-violet-200'
                : 'bg-slate-900/90 border-cyan-500/40 text-slate-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {n.type === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
              {n.type === 'error' && <AlertCircle size={16} className="text-rose-400" />}
              {n.type === 'ai' && <Zap size={16} className="text-violet-400" />}
              {n.type === 'info' && <Info size={16} className="text-cyan-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-snug">{n.title}</h4>
              <p className="text-[11px] opacity-90 line-clamp-2 mt-0.5">{n.message}</p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded-lg hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-shell min-h-screen bg-background text-on-surface font-sans flex antialiased selection:bg-sky-active selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-24 sm:px-6 lg:px-10 bg-[radial-gradient(circle_at_top_left,_rgba(58,71,209,0.06),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(0,163,255,0.06),_transparent_35%)]">
          {children}
        </main>
      </div>
      <ToastOverlay />
    </div>
  );
};

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Wraps every real app route. Redirects to /landing if there's no valid
// session, once we've actually finished checking (avoids a flash-redirect
// while fetchUser() is still resolving on first load).
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const authLoading = useAppStore((state) => state.authLoading);

  if (authLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  const fetchUser = useAppStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FloatingChatbot />
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Navigate to="/landing" replace />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/schedule"
            element={
              <RequireAuth>
                <AppLayout>
                  <SchedulePlanner />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/kanban"
            element={
              <RequireAuth>
                <AppLayout>
                  <KanbanBoard />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/assistant"
            element={
              <RequireAuth>
                <AppLayout>
                  <Assistant />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/integrations"
            element={
              <RequireAuth>
                <AppLayout>
                  <Integrations />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/engagement"
            element={
              <RequireAuth>
                <AppLayout>
                  <Engagement />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
