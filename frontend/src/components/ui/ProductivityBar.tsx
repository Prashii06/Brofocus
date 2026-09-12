// BroFocus - Gamified Productivity Bar Component
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/client';
import { ProgressBarData } from '../../types';
import { useAppStore } from '../../store/useAppStore';

const ProductivityBar: React.FC = () => {
  const { xpAnimation, clearXPAnimation } = useAppStore();
  const { data, isLoading } = useQuery<{ progress: ProgressBarData }>({
    queryKey: ['progress-bar'],
    queryFn: analyticsApi.getProgressBar,
    refetchInterval: 30000,
  });

  const progress = data?.progress;
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current && progress) {
      fillRef.current.style.setProperty('--xp-width', `${progress.fill_percent}%`);
    }
  }, [progress?.fill_percent]);

  if (isLoading) {
    return (
      <div className="card-sm animate-pulse">
        <div className="h-4 bg-white/5 rounded shimmer mb-2" />
        <div className="h-2 bg-white/5 rounded-full shimmer" />
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="card-sm relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 rounded-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Productivity Bar</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{progress.rank}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm font-bold text-white">{progress.total_points.toLocaleString()}</span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total XP</p>
          </div>
        </div>

        {/* Level display */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Lvl {progress.current_level}</span>
            <div className="flex gap-0.5">
              {progress.badges.slice(0, 3).map((badge, i) => (
                <span key={i} className="text-xs">{badge.split(' ')[0]}</span>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500">Lvl {progress.current_level + 1}</span>
        </div>

        {/* XP Progress Bar */}
        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
          {/* Shimmer track */}
          <div className="absolute inset-0 shimmer opacity-30" />

          {/* Fill */}
          <motion.div
            ref={fillRef}
            initial={{ width: 0 }}
            animate={{ width: `${progress.fill_percent}%` }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7c2df4 0%, #8b4dff 50%, #22d3ee 100%)',
              boxShadow: '0 0 12px rgba(139, 77, 255, 0.6)',
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>

          {/* Milestone markers */}
          {[25, 50, 75].map((pct) => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${pct}%` }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-violet-400" />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {progress.current_level_points} / {progress.points_per_level} XP
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400">
              {progress.next_level_points} XP to next level
            </span>
          </div>
        </div>
      </div>

      {/* XP Gain Animation */}
      <AnimatePresence>
        {xpAnimation?.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.8 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-20"
            onAnimationComplete={clearXPAnimation}
          >
            <div className="bg-violet-500/90 text-white text-sm font-bold px-4 py-2 rounded-full shadow-glow-violet whitespace-nowrap flex items-center gap-1.5">
              <Zap className="w-4 h-4" fill="white" />
              +{xpAnimation.points} XP
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductivityBar;
