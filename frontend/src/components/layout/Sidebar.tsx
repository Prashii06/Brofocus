// BroFocus - Sidebar Navigation Component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Kanban, BarChart3,
  Plug, ChevronLeft, ChevronRight, Flame, Trophy, Settings
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import BrandLogo from '../ui/BrandLogo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary' },
  { path: '/schedule', label: 'Schedule', icon: Calendar, color: 'text-sky-active' },
  { path: '/kanban', label: 'Kanban Board', icon: Kanban, color: 'text-motivation-orange' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, color: 'text-success-green' },
  { path: '/engagement', label: 'Engagement', icon: Flame, color: 'text-rose-400' },
  { path: '/integrations', label: 'Integrations', icon: Plug, color: 'text-sky-active' },
  { path: '/profile', label: 'Profile', icon: Trophy, color: 'text-electric-yellow' },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'text-primary' },
];


interface SidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open: propOpen, onToggle: propToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sidebarOpen, setSidebarOpen } = useAppStore();

  const open = propOpen !== undefined ? propOpen : sidebarOpen;
  const onToggle = propToggle || (() => setSidebarOpen(!sidebarOpen));

  return (
    <motion.aside
      animate={{ width: open ? 240 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-screen bg-white border-r border-[#e6eaff] flex-shrink-0 z-20"
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-[#dfe6ff] h-16">
        <BrandLogo compact />
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-bold text-base text-primary tracking-tight">BroFocus</span>
              <span className="text-[10px] text-sky-active font-semibold uppercase tracking-wider">AI Platform</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group
                ${isActive
                  ? 'bg-primary/5 text-primary border border-primary/10 shadow-glow'
                  : 'text-slate-600 hover:text-on-surface hover:bg-slate-100/80'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? item.color : 'text-slate-500 group-hover:text-on-surface'}`} />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="sticky bottom-0 z-10 p-3 border-t border-[#dfe6ff] bg-white">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-[#dfe6ff]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-sky-active flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.name?.[0] || 'B'}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-on-surface truncate">{user?.name || 'Bro Focus User'}</p>
                <div className="flex items-center gap-1 text-[10px] text-electric-yellow font-medium">
                  <Trophy size={11} />
                  <span>Level {user?.level || 4}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-[#dfe6ff] flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all z-30 shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {open ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </motion.button>
    </motion.aside>
  );
};

export default Sidebar;
