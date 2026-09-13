// BroFocus - Integrations Hub Page
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link as LinkIcon,
  CheckCircle2,
  Mail,
  Calendar,
  HardDrive,
  Video,
  ShieldCheck,
  RefreshCw,
  Zap,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { integrationsApi } from '../api/client';
import { IntegrationCard } from '../components/ui/IntegrationCard';
import { useAppStore } from '../store/useAppStore';

export const Integrations: React.FC = () => {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  const [selectedProviderModal, setSelectedProviderModal] = useState<string | null>(null);

  // Query status
  const { data: statusMap, isLoading, refetch } = useQuery({
    queryKey: ['integrations-status'],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await integrationsApi.getStatus();
      const integrations = res?.integrations ?? res?.data?.integrations ?? {};
      return integrations as Record<
        string,
        { connected: boolean; email?: string; connected_at?: string }
      >;
    },
  });

  useEffect(() => {
    const refreshStatus = async () => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    const detail = params.get('detail');

    if (connected) {
      const connectedProviders = connected.split(',').filter(Boolean);
      const providerName = connectedProviders.map((provider) => provider.replace('_', ' ')).join(' and ');
      addNotification({
        title: 'Integration connected',
        message: `${providerName} is connected and ready to use.`,
        type: 'success',
      });

      await queryClient.invalidateQueries({ queryKey: ['integrations-status'], refetchType: 'none' });
      await refetch({ cancelRefetch: false });
      window.history.replaceState({}, '', '/integrations');
    }

    if (error) {
      addNotification({
        title: 'Connection failed',
        message: detail || `Google authorization failed: ${error}`,
        type: 'error',
      });
      await queryClient.invalidateQueries({ queryKey: ['integrations-status'], refetchType: 'none' });
      await refetch({ cancelRefetch: false });
      window.history.replaceState({}, '', '/integrations');
    }
    };

    void refreshStatus();
  }, [addNotification, queryClient, refetch]);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: (provider: string) => integrationsApi.connectProvider(provider),
    onSuccess: (data) => {
      if (!data?.auth_url) {
        addNotification({ title: 'Connection failed', message: 'The server did not return a Google authorization URL.', type: 'error' });
        return;
      }
      window.location.assign(data.auth_url);
    },
    onError: (error: any) => {
      addNotification({ title: 'Connection failed', message: error?.response?.data?.error || 'Google OAuth could not be started.', type: 'error' });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => integrationsApi.disconnectProvider(provider),
    onSuccess: (_, provider) => {
      addNotification({
        title: 'Integration Disconnected',
        message: `Disconnected ${provider.replace('_', ' ')}.`,
        type: 'info',
      });
      void queryClient.refetchQueries({ queryKey: ['integrations-status'], type: 'active' });
    },
  });

  const providersConfig = [
    {
      id: 'gmail',
      name: 'Gmail AI Sync',
      description: 'Extract tasks, action items, and deadline commitments directly from incoming emails.',
      icon: Mail,
      accentColor: 'rose',
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar Sync',
      description: 'Auto-sync time blocks, prevent meeting collisions, and align peak energy windows.',
      icon: Calendar,
      accentColor: 'cyan',
    },
    {
      id: 'google_drive',
      name: 'Google Drive Intelligence',
      description: 'Scan project documentation, spec sheets, and notes to contextualize tasks.',
      icon: HardDrive,
      accentColor: 'amber',
    },
    {
      id: 'google_meet',
      name: 'Google Meet Context',
      description: 'Auto-schedule meeting prep slots and generate post-meeting action summaries.',
      icon: Video,
      accentColor: 'emerald',
    },
  ];

  const currentStatus = statusMap || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="text-cyan-400" size={26} />
              Ecosystem Integrations
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              OAuth 2.0
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Connect your Google Workspace services to grant Gemini AI permission for contextual context scanning.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-sm">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Enterprise Token Encryption (AES-256)</span>
        </div>
      </div>

      {/* Grid of Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providersConfig.map((config) => {
          const providerStatus = currentStatus[config.id] || { connected: false };
          return (
            <IntegrationCard
              key={config.id}
              provider={config.id as any}
              name={config.name}
              description={config.description}
              connected={providerStatus.connected}
              email={providerStatus.email}
              onConnect={() => setSelectedProviderModal(config.id)}
              onDisconnect={() => disconnectMutation.mutate(config.id)}
              isLoading={connectMutation.isPending || disconnectMutation.isPending}
            />
          );
        })}
      </div>

      {/* OAuth Connection Modal */}
      <AnimatePresence>
        {selectedProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <ShieldCheck size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    Connect {selectedProviderModal.replace('_', ' ').toUpperCase()}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProviderModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  BroFocus will request read-only access to synchronize schedule context and task commitments.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200">Permissions Requested:</div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Read calendar events & free/busy slots</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Extract actionable task metadata</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedProviderModal(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => connectMutation.mutate(selectedProviderModal)}
                  disabled={connectMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {connectMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>Authorize Integration</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
