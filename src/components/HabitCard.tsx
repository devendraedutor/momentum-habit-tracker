import React from 'react';
import type { Habit, CheckInStatus } from '../types/habit';
import { calculateHabitStats, calculateHabitTrajectory, getTodayString } from '../lib/momentum';
import { DynamicIcon } from './DynamicIcon';
import { Check, X, RotateCcw, Flame, MoreVertical, Edit2, Archive, Eye, Target } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onCheckIn: (habitId: string, status: CheckInStatus) => void;
  onUndo: (habitId: string) => void;
  onOpenDetail: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  floorAtZero?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onCheckIn,
  onUndo,
  onOpenDetail,
  onEdit,
  onArchive,
  floorAtZero = false,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const todayStr = getTodayString();
  const todayStatus = habit.history[todayStr] || 'none';
  const isLoggedToday = todayStatus === 'done' || todayStatus === 'missed';

  const stats = calculateHabitStats(habit, floorAtZero);
  const recentPoints = calculateHabitTrajectory(habit, '7d', floorAtZero);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const sparklinePoints = React.useMemo(() => {
    if (recentPoints.length < 2) return '';
    const scores = recentPoints.map((p) => p.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max === min ? 1 : max - min;
    const width = 80;
    const height = 24;

    return recentPoints
      .map((p, i) => {
        const x = (i / (recentPoints.length - 1)) * width;
        const y = height - ((p.score - min) / range) * (height - 6) - 3;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [recentPoints]);

  const targetDays = habit.targetGoalDays || 21;

  return (
    <div
      className={`app-card app-card-hover rounded-2xl p-5 flex flex-col justify-between ${
        todayStatus === 'done'
          ? 'ring-1 ring-emerald-500/50 bg-emerald-50/20 dark:bg-slate-800/90'
          : todayStatus === 'missed'
          ? 'ring-1 ring-rose-500/50 bg-rose-50/20 dark:bg-slate-800/90'
          : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
              style={{
                backgroundColor: `${habit.color}25`,
                border: `1.5px solid ${habit.color}`,
                color: habit.color,
              }}
            >
              <DynamicIcon name={habit.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  {habit.category}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Target className="w-3 h-3 text-slate-400" /> Goal: {targetDays}d
                </span>
              </div>
              <h3
                onClick={() => onOpenDetail(habit)}
                className="text-base font-bold text-slate-900 dark:text-white mt-1 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1"
                title={habit.name}
              >
                {habit.name}
              </h3>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 animate-fade-in">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDetail(habit);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-500" /> View Analytics
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(habit);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit Habit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive(habit.id);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700/80 flex items-center gap-2"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive Habit
                </button>
              </div>
            )}
          </div>
        </div>

        {habit.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
            {habit.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Momentum Score</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-2xl font-extrabold font-mono tracking-tight ${
                  stats.currentScore > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : stats.currentScore < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {stats.currentScore > 0 ? `+${stats.currentScore}` : stats.currentScore}
              </span>
              <span className="text-[11px] text-slate-400">pts</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{stats.currentStreak} day streak</span>
            </div>
            {sparklinePoints && (
              <svg className="w-20 h-6 mt-1 overflow-visible" viewBox="0 0 80 24">
                <path
                  d={sparklinePoints}
                  fill="none"
                  stroke={stats.weeklyVelocity >= 0 ? '#10b981' : '#f43f5e'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3">
        {isLoggedToday ? (
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              {todayStatus === 'done' ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Done Today</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">+1 Momentum added</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Missed Today</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">-1 Momentum penalty</div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => onUndo(habit.id)}
              className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs"
              title="Undo today's check-in"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onCheckIn(habit.id, 'done')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-slate-950 border border-emerald-500/30 font-semibold text-xs transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Done (+1)</span>
            </button>

            <button
              onClick={() => onCheckIn(habit.id, 'missed')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 font-medium text-xs transition-all active:scale-[0.98]"
            >
              <X className="w-4 h-4 stroke-[2]" />
              <span>Missed (-1)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
