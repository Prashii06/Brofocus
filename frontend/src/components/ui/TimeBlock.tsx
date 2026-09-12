// BroFocus - Time Block Component (Schedule Grid Item)
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Tag, Zap } from 'lucide-react';
import { ScheduleSlot } from '../../types';

interface TimeBlockProps {
  slot: ScheduleSlot;
  onComplete?: (id: string) => void;
  onClick?: (slot: ScheduleSlot) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  focus: {
    bg: 'bg-violet-950/40 hover:bg-violet-900/40',
    border: 'border-violet-500/30 hover:border-violet-500/60',
    text: 'text-violet-300',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  meeting: {
    bg: 'bg-cyan-950/40 hover:bg-cyan-900/40',
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
    text: 'text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  task: {
    bg: 'bg-indigo-950/40 hover:bg-indigo-900/40',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
    text: 'text-indigo-300',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  break: {
    bg: 'bg-emerald-950/40 hover:bg-emerald-900/40',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  default: {
    bg: 'bg-slate-900/50 hover:bg-slate-800/50',
    border: 'border-slate-700 hover:border-slate-600',
    text: 'text-slate-300',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
  },
};

export const TimeBlock: React.FC<TimeBlockProps> = ({ slot, onComplete, onClick }) => {
  const categoryStyle = CATEGORY_COLORS[slot.category] || CATEGORY_COLORS.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick && onClick(slot)}
      className={`relative p-3.5 rounded-xl border ${categoryStyle.bg} ${categoryStyle.border} 
        transition-all duration-200 cursor-pointer shadow-lg shadow-black/20 group backdrop-blur-sm
        ${slot.completed ? 'opacity-50 grayscale-[0.3]' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border uppercase tracking-wider ${categoryStyle.badge}`}
            >
              {slot.category}
            </span>
            {slot.ai_optimized && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-md bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Zap size={10} className="text-cyan-400" />
                AI Slot
              </span>
            )}
          </div>
          <h4
            className={`text-sm font-semibold truncate ${
              slot.completed ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {slot.title}
          </h4>
          {slot.description && (
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{slot.description}</p>
          )}
        </div>

        {onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(slot.id);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              slot.completed
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40'
            }`}
            title={slot.completed ? 'Mark pending' : 'Mark complete'}
          >
            <CheckCircle size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className={categoryStyle.text} />
          <span>
            {slot.start_time} - {slot.end_time}
          </span>
        </div>
        {slot.duration_minutes && (
          <div className="flex items-center gap-1">
            <Tag size={12} className="text-slate-500" />
            <span>{slot.duration_minutes}m</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
