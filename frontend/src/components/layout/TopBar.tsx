// BroFocus - Top Bar Component
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Menu, LogOut, ChevronDown, User, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { format } from 'date-fns';
import BrandLogo from '../ui/BrandLogo';
import { signOutCurrentUser } from '../../utils/auth';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title = 'BroFocus', subtitle }) => {

  const { notifications, unreadCount, markNotificationRead, user, logout, streakCount } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await signOutCurrentUser();
    logout();
    window.location.href = '/landing';
  };

  const notifTypeColors: Record<string, string> = {
    info: 'text-cyan-700',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    error: 'text-rose-700',
    ai: 'text-violet-700',
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
          <BrandLogo />
          {subtitle && <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-active">{subtitle}</span>}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-motivation-orange/20 bg-motivation-orange/10 px-3 py-1.5 text-sm font-bold text-motivation-orange sm:flex">
          <span className="text-base">{streakCount}</span>
          <span className="hidden xl:inline text-[11px] uppercase tracking-wider">day streak</span>
        </div>

        <div className="relative" ref={profileMenuRef}>
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
                className="absolute right-0 top-12 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-800">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                        {unreadCount} new
                      </span>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto bg-white">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500">
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
                        className={`px-4 py-3 border-b border-slate-200 cursor-pointer transition-all hover:bg-slate-50 ${!n.read ? 'bg-cyan-50/80' : 'bg-white'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold mb-0.5 ${notifTypeColors[n.type]}`}>{n.title}</p>
                            <p className="text-xs leading-relaxed text-slate-600">{n.message}</p>
                            <p className="text-[10px] mt-1 text-slate-500">
                              {format(new Date(n.created_at), 'h:mm a')}
                            </p>
                          </div>
                          {!n.read && <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full flex-shrink-0 mt-1" />}
                          {n.read && <Check className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-[#dfe6ff] bg-white/80 px-2 py-1.5 shadow-sm transition hover:bg-white"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-sky-active text-xs font-bold text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || 'Profile'} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || 'B'}</span>
              )}
            </div>
            <div className="hidden text-left lg:block">
              <div className="text-[11px] font-semibold text-on-surface">{user?.name || 'BroFocus User'}</div>
              <div className="text-[9px] text-on-surface-variant">Level {user?.level || 1}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-on-surface-variant" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-[#dfe6ff] bg-white/95 shadow-2xl backdrop-blur-xl z-50"
              >
                <div className="border-b border-[#edf1ff] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-sky-active text-xs font-bold text-white">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name || 'Profile'} className="h-full w-full object-cover" />
                      ) : (
                        <span>{user?.name?.[0]?.toUpperCase() || 'B'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface">{user?.name || 'BroFocus User'}</p>
                      <p className="truncate text-[11px] text-on-surface-variant">{user?.email || 'bro@brofocus.ai'}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = '/profile'}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-on-surface transition hover:bg-slate-50"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = '/settings'}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-on-surface transition hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 border-t border-[#edf1ff] px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
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
