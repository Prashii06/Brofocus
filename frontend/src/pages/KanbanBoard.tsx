// BroFocus - Kanban Board Page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Kanban as KanbanIcon, Loader2, X, Flame } from 'lucide-react';
import { tasksApi } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { KanbanData, Task, TaskPriority } from '../types';
import TaskCard from '../components/ui/TaskCard';

const COLUMNS = [
  { key: 'pending' as const, label: 'Pending', color: 'text-gray-400', dotColor: '#6b7280', accent: 'border-gray-500/30', bg: 'from-gray-500/5' },
  { key: 'in_progress' as const, label: 'In Progress', color: 'text-violet-400', dotColor: '#8b4dff', accent: 'border-violet-500/30', bg: 'from-violet-500/8' },
  { key: 'completed' as const, label: 'Completed', color: 'text-emerald-400', dotColor: '#10b981', accent: 'border-emerald-500/30', bg: 'from-emerald-500/5' },
];

interface NewTaskForm {
  title: string;
  priority: TaskPriority;
  due_date: string;
  description: string;
}

export const KanbanBoard: React.FC = () => {

  const queryClient = useQueryClient();
  const { triggerXPAnimation, updateUserPoints } = useAppStore();
  const [showNewTask, setShowNewTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '', priority: 'medium', due_date: '', description: '',
  });

  const { data, isLoading } = useQuery<{ tasks: KanbanData }>({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<NewTaskForm>) => tasksApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowNewTask(false);
      setNewTask({ title: '', priority: 'medium', due_date: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      tasksApi.update(id, updates),
    onSuccess: (data) => {
      if (data.xp_awarded) {
        triggerXPAnimation(data.xp_awarded);
        if (data.user_points) updateUserPoints(data.user_points);
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['progress-bar'] });
    },
  });

  const tasks = data?.tasks || { pending: [], in_progress: [], completed: [] };

  // Drag & Drop handlers
  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverCol(null); };
  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };
  const handleDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== colKey) {
      updateMutation.mutate({ id: draggedTask.id, updates: { status: colKey } });
    }
    setDraggedTask(null);
    setDragOverCol(null);
  };

  const totalTasks = tasks.pending.length + tasks.in_progress.length + tasks.completed.length;

  return (
    <>
      <div>
        {/* Header actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <KanbanIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Workspace</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Drag cards between columns to update status</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewTask(true)}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" /> New Task
          </motion.button>
        </motion.div>

        {/* New Task Modal */}
        <AnimatePresence>
          {showNewTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowNewTask(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="card w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-violet-400" /> New Task
                  </h3>
                  <button onClick={() => setShowNewTask(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Task Title *</label>
                    <input
                      id="new-task-title"
                      className="input-dark"
                      placeholder="What needs to get done?"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && newTask.title && createMutation.mutate(newTask)}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Priority</label>
                      <select
                        className="input-dark text-sm"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      >
                        <option value="urgent">🔥 Urgent</option>
                        <option value="high">⚡ High</option>
                        <option value="medium">🎯 Medium</option>
                        <option value="low">💧 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Due Date</label>
                      <input
                        type="date"
                        className="input-dark text-sm"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
                    <textarea
                      className="input-dark resize-none"
                      rows={2}
                      placeholder="Optional details..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowNewTask(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => newTask.title && createMutation.mutate(newTask)}
                    disabled={!newTask.title || createMutation.isPending}
                    className="btn-primary flex-1 justify-center"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Columns */}
        {isLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 min-w-[280px] space-y-3">
                <div className="h-8 bg-white/5 rounded-xl shimmer" />
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-24 bg-white/5 rounded-2xl shimmer" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
            {COLUMNS.map((col) => {
              const colTasks = tasks[col.key] || [];
              const isDragOver = dragOverCol === col.key;
              return (
                <div
                  key={col.key}
                  className="kanban-col"
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column Header */}
                  <div className={`
                    flex items-center justify-between px-4 py-3 rounded-2xl border bg-gradient-to-r ${col.bg} to-transparent
                    ${isDragOver ? col.accent : 'border-transparent'}
                    transition-all duration-200
                  `}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dotColor }} />
                      <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                      style={{ background: `${col.dotColor}25`, color: col.dotColor }}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Drop zone indicator */}
                  <AnimatePresence>
                    {isDragOver && draggedTask?.status !== col.key && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 56 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-2xl border-2 border-dashed flex items-center justify-center text-xs"
                        style={{ borderColor: col.dotColor, color: col.dotColor }}
                      >
                        Drop here
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Task Cards */}
                  <AnimatePresence>
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        className={`${draggedTask?.id === task.id ? 'opacity-40' : ''} transition-opacity cursor-grab active:cursor-grabbing`}
                      >
                        <TaskCard
                          task={task}
                          onComplete={(t) => updateMutation.mutate({ id: t.id, updates: { status: 'completed' } })}
                          onStatusChange={(id, status) => updateMutation.mutate({ id, updates: { status } })}
                        />
                      </div>
                    ))}
                  </AnimatePresence>

                  {/* Empty state */}
                  {colTasks.length === 0 && !isDragOver && (
                    <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed"
                      style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                      <Flame className="w-8 h-8 mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tasks here</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default KanbanBoard;
