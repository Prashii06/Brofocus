// BroFocus - TypeScript Type Definitions

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'ai';
export type IntegrationProvider = 'gmail' | 'google_calendar' | 'google_drive' | 'google_meet';
export type TimeBlockType = 'task' | 'meeting' | 'focus' | 'break';
export type ChatRole = 'user' | 'model';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  xp_awarded: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  productivity_points: number;
  level: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  type: TimeBlockType;
  color?: string;
  task_id?: string;
}

export interface IntegrationStatus {
  connected: boolean;
  email?: string;
  connected_at?: string;
}

export interface FocusDataPoint {
  date: string;
  focus_hours: number;
  tasks_completed: number;
  productivity_score: number;
}

export interface AnalyticsTrends {
  focus_trend: FocusDataPoint[];
  task_breakdown: {
    pending: number;
    in_progress: number;
    completed: number;
  };
  priority_breakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  weekly_summary: {
    avg_focus_hours: number;
    total_tasks_completed: number;
    avg_productivity_score: number;
    days_tracked: number;
  };
}

export interface ProgressBarData {
  total_points: number;
  current_level: number;
  current_level_points: number;
  points_per_level: number;
  fill_percent: number;
  next_level_points: number;
  next_milestone: number;
  points_to_next_milestone: number;
  rank: string;
  badges: string[];
}

export interface ScheduleSlot {
  id: string;
  title: string;
  category: 'focus' | 'meeting' | 'task' | 'break';
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  completed?: boolean;
  description?: string;
  ai_optimized?: boolean;
}

export interface ChatMessage {
  id: string;
  role?: ChatRole;
  sender?: 'user' | 'ai';
  content?: string;
  text?: string;
  timestamp: string;
  ai_powered?: boolean;
  isLoading?: boolean;
  suggested_actions?: string[];
  grounding_sources?: { title?: string; url?: string }[];
}

export interface MorningKickoff {
  greeting: string;
  date?: string;
  summary?: string;
  quote?: string;
  priorities?: Partial<Task>[];
  top_priorities?: string[];
  in_progress?: Partial<Task>[];
  meetings?: { title: string; start: string; end: string }[];
  focus_hours?: number;
  peak_focus_window?: string;
  weather_focus_score?: number;
  productivity_score?: number;
  level?: number;
  motivational_message?: string;
}

export interface EveningWrap {
  date?: string;
  headline?: string;
  completed_today?: number;
  tasks_completed?: number;
  focus_hours?: number;
  productivity_score?: number;
  total_xp_gained?: number;
  xp_earned_today?: number;
  streak_days?: number;
  highlights?: string[];
  completed_tasks?: Partial<Task>[];
  pending_tomorrow?: Partial<Task>[];
  message?: string;
}

export interface KanbanData {
  pending: Task[];
  in_progress: Task[];
  completed: Task[];
}

// API Response wrappers
export interface ApiResponse<T> {
  status: 'success' | 'error' | 'processing';
  data?: T;
  error?: string;
  message?: string;
}

