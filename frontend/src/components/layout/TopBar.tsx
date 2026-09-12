// BroFocus - Top Bar Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, X, Check, Cpu, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { format } from 'date-fns';
import BrandLogo from '../ui/BrandLogo';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title = 'BroFocus', subtitle }) => {

  const { notifications, unreadCount, markNotificationRead } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const notifTypeColors: Record<string, string> = {
    info: 'text-cyan-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
    ai: 'text-violet-400',
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 h-20 z-30 flex items-center justify-between px-4 sm:px-8 lg:px-12 bg-white/95 backdrop-blur-xl border-b border-white/70 shadow-sm"
      style={{
        left: 0,
      }}
    >
      {/* Page Title */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Toggle navigation"
          className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-primary lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-3">
          <BrandLogo compact />
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-primary leading-tight">BroFocus</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-active">{subtitle || title}</p>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Quick search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-4 py-2 w-48 text-sm h-9 rounded-full border border-[#dfe6ff] bg-white/60 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* AI Shortcut */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary py-2 px-3 text-sm gap-2 hidden sm:flex"
          onClick={() => window.location.href = '/assistant'}
        >
          <Cpu className="w-4 h-4" />
          <span className="hidden lg:inline">Ask AI</span>
        </motion.button>

        <div className="hidden items-center gap-2 rounded-full border border-motivation-orange/20 bg-motivation-orange/10 px-3 py-1.5 text-sm font-bold text-motivation-orange sm:flex">
          <span className="text-base">12</span>
          <span className="hidden xl:inline text-[11px] uppercase tracking-wider">day streak</span>
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNotifications((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe6ff] bg-white/80 text-on-surface-variant shadow-sm"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-80 rounded-2xl border border-[#dfe6ff] bg-white/90 shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#dfe6ff]">
                  <span className="text-sm font-semibold text-on-surface">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {unreadCount} new
                      </span>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-on-surface-variant hover:text-on-surface">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-on-surface-variant">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => markNotificationRead(n.id)}
                        className={`px-4 py-3 border-b border-[#edf1ff] cursor-pointer transition-all hover:bg-slate-50 ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold mb-0.5 ${notifTypeColors[n.type]}`}>{n.title}</p>
                            <p className="text-xs leading-relaxed text-on-surface-variant">{n.message}</p>
                            <p className="text-[10px] mt-1 text-on-surface-variant/70">
                              {format(new Date(n.created_at), 'h:mm a')}
                            </p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                          {n.read && <Check className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date */}
        <div className="hidden lg:block text-right">
          <p className="text-xs font-medium text-on-surface">{format(new Date(), 'EEE, MMM d')}</p>
          <p className="text-[10px] text-on-surface-variant">{format(new Date(), 'h:mm a')}</p>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
