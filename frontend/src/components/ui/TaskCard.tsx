// BroFocus - Task Card Component (for Kanban)
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Clock, ArrowRight, Flame } from 'lucide-react';
import { Task, TaskPriority } from '../../types';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onComplete?: (task: Task) => void;
  compact?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; dotColor: string }> = {
  urgent: { label: 'Urgent', className: 'badge-urgent', dotColor: '#fb7185' },
  high:   { label: 'High',   className: 'badge-high',   dotColor: '#fbbf24' },
  medium: { label: 'Medium', className: 'badge-medium', dotColor: '#a87aff' },
  low:    { label: 'Low',    className: 'badge-low',    dotColor: '#67e8f9' },
};

function getDueDateLabel(dateStr?: string): { label: string; color: string } | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date)) return { label: 'Today', color: 'text-amber-400' };
  if (isTomorrow(date)) return { label: 'Tomorrow', color: 'text-orange-400' };
  if (isPast(date)) return { label: format(date, 'MMM d'), color: 'text-rose-400' };
  return { label: format(date, 'MMM d'), color: 'text-gray-500' };
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onComplete, compact }) => {
  const priority = priorityConfig[task.priority];
  const dueDate = getDueDateLabel(task.due_date);
  const isCompleted = task.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`card-sm group cursor-pointer relative overflow-hidden ${isCompleted ? 'opacity-70' : ''}`}
    >
      {/* Priority left border indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: priority.dotColor }}
      />

      <div className="pl-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Status toggle button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isCompleted && onComplete) onComplete(task);
                else if (onStatusChange) onStatusChange(task.id, isCompleted ? 'pending' : 'completed');
              }}
              className="mt-0.5 flex-shrink-0 transition-colors hover:scale-110"
            >
              {isCompleted
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <Circle className="w-4 h-4 text-gray-600 hover:text-violet-400 transition-colors" />
              }
            </button>

            <h4 className={`text-sm font-medium leading-snug ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.title}
            </h4>
          </div>

          {/* Priority badge */}
          <span className={`${priority.className} flex-shrink-0 text-[10px]`}>
            {task.priority === 'urgent' && <Flame className="w-2.5 h-2.5" />}
            {priority.label}
          </span>
        </div>

        {/* Description */}
        {!compact && task.description && (
          <p className="text-xs mb-2 ml-6 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between ml-6">
          <div className="flex items-center gap-2">
            {dueDate && (
              <div className={`flex items-center gap-1 ${dueDate.color}`}>
                <Calendar className="w-3 h-3" />
                <span className="text-[11px] font-medium">{dueDate.label}</span>
              </div>
            )}
          </div>

          {/* Status action button - shows on hover */}
          {!isCompleted && onStatusChange && (
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                const next = task.status === 'pending' ? 'in_progress' : 'completed';
                onStatusChange(task.id, next);
              }}
            >
              {task.status === 'pending' ? 'Start' : 'Complete'}
              <ArrowRight className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
