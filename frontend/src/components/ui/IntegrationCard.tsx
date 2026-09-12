// BroFocus - Integration Card Component
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, HardDrive, Video, CheckCircle2, Link as LinkIcon, Unlink, Loader2 } from 'lucide-react';
import { IntegrationProvider } from '../../types';

interface IntegrationCardProps {
  provider: IntegrationProvider;
  name?: string;
  description?: string;
  connected?: boolean;
  email?: string;
  status?: { connected: boolean; email?: string; connected_at?: string };
  onConnect: (provider?: any) => void;
  onDisconnect: (provider?: any) => void;
  isLoading?: boolean;
  loading?: boolean;
}

const PROVIDER_METADATA: Record<
  IntegrationProvider,
  { name: string; description: string; icon: React.ReactNode; color: string }
> = {
  gmail: {
    name: 'Gmail AI Sync',
    description: 'Scan emails for task commitments, context, and follow-ups.',
    icon: <Mail className="w-5 h-5 text-rose-400" />,
    color: 'border-rose-500/30 bg-rose-950/20',
  },
  google_calendar: {
    name: 'Google Calendar',
    description: 'Auto-sync time blocks and align focus windows with events.',
    icon: <Calendar className="w-5 h-5 text-cyan-400" />,
    color: 'border-cyan-500/30 bg-cyan-950/20',
  },
  google_drive: {
    name: 'Google Drive Intelligence',
    description: 'Scan project documentation and spec sheets for context.',
    icon: <HardDrive className="w-5 h-5 text-amber-400" />,
    color: 'border-amber-500/30 bg-amber-950/20',
  },
  google_meet: {
    name: 'Google Meet Summaries',
    description: 'Auto-schedule meeting prep and post-call action items.',
    icon: <Video className="w-5 h-5 text-emerald-400" />,
    color: 'border-emerald-500/30 bg-emerald-950/20',
  },
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  provider,
  name,
  description,
  connected: propConnected,
  email: propEmail,
  status,
  onConnect,
  onDisconnect,
  isLoading,
  loading,
}) => {
  const isConnected = propConnected !== undefined ? propConnected : status?.connected || false;
  const userEmail = propEmail || status?.email || 'bro@brofocus.ai';
  const meta = PROVIDER_METADATA[provider] || PROVIDER_METADATA.gmail;
  const isBusy = isLoading || loading || false;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-5 rounded-2xl border ${meta.color} backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              {meta.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{name || meta.name}</h3>
              <span className="text-[10px] text-slate-400 font-medium capitalize">
                {provider.replace('_', ' ')}
              </span>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <CheckCircle2 size={11} className={isConnected ? 'text-emerald-400' : 'text-slate-500'} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{description || meta.description}</p>

        {isConnected && (
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <Mail size={12} className="text-slate-500" />
            <span className="truncate">{userEmail}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-800/60">
        <button
          onClick={() => (isConnected ? onDisconnect(provider) : onConnect(provider))}
          disabled={isBusy}
          className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl border transition-all ${
            isConnected
              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-rose-950/40 hover:border-rose-500/40 hover:text-rose-300'
              : 'bg-gradient-to-r from-violet-600 to-cyan-600 border-transparent text-white hover:brightness-110 shadow-lg shadow-cyan-500/20'
          }`}
        >
          {isBusy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isConnected ? (
            <>
              <Unlink size={14} /> Disconnect
            </>
          ) : (
            <>
              <LinkIcon size={14} /> Connect OAuth
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default IntegrationCard;
