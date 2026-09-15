import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  UserX,
  Share2,
  ChevronRight,
  TrendingUp,
  Flame,
  Check,
  Clock,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { BuddyMemberSummary, SharedHabitRecord } from '../../types/buddy';
import { DynamicIcon } from '../DynamicIcon';
import { getTierByLevel } from '../../config/progression';
import {
  subscribeToBuddySharedHabits,
  subscribeToMySharedHabitsWithBuddy,
} from '../../lib/firestoreService';

interface PartnershipDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid: string;
  buddy: BuddyMemberSummary | null;
  nudgeCooldownRemaining: number;
  onNudge: (buddyUid: string) => Promise<boolean>;
  onUnfriend: (friendshipId: string, partnerUid: string) => Promise<void>;
  onRevokeHabit: (sharedHabitDocId: string) => Promise<boolean>;
  onOpenShareWizardForBuddy: (buddyUid: string) => void;
  onInspectSharedHabit: (habitRecord: SharedHabitRecord) => void;
}

export const PartnershipDetailsModal: React.FC<PartnershipDetailsModalProps> = ({
  isOpen,
  onClose,
  currentUserUid,
  buddy,
  nudgeCooldownRemaining,
  onNudge,
  onUnfriend,
  onRevokeHabit,
  onOpenShareWizardForBuddy,
  onInspectSharedHabit,
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [incomingHabits, setIncomingHabits] = useState<SharedHabitRecord[]>([]);
  const [outgoingHabits, setOutgoingHabits] = useState<SharedHabitRecord[]>([]);

  const [isNudging, setIsNudging] = useState(false);
  const [nudgeToast, setNudgeToast] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Real-time subscriptions for this specific buddy
  useEffect(() => {
    if (!isOpen || !buddy || !currentUserUid) return;

    const unsubIn = subscribeToBuddySharedHabits(currentUserUid, buddy.uid, (list) => {
      setIncomingHabits(list);
    });

    const unsubOut = subscribeToMySharedHabitsWithBuddy(currentUserUid, buddy.uid, (list) => {
      setOutgoingHabits(list);
    });

    return () => {
      if (unsubIn) unsubIn();
      if (unsubOut) unsubOut();
    };
  }, [isOpen, buddy, currentUserUid]);

  if (!isOpen || !buddy) return null;

  const buddyFirstName = buddy.displayName?.trim()
    ? buddy.displayName.trim().split(' ')[0] || buddy.displayName.trim()
    : '';
  const firstName = buddyFirstName || 'Buddy';

  const formatCooldown = (seconds: number) => {
    if (seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    const remSecs = seconds % 60;

    if (hours > 0) return `${hours}h ${remMins}m`;
    if (mins > 0) return `${mins}m`;
    return `${remSecs}s`;
  };

  const handleNudgeClick = async () => {
    if (nudgeCooldownRemaining > 0 || isNudging) return;
    setIsNudging(true);
    const success = await onNudge(buddy.uid);
    setIsNudging(false);

    if (success) {
      setNudgeToast(true);
      setTimeout(() => setNudgeToast(false), 3000);
    }
  };

  const handleUnfriendConfirm = async () => {
    setIsUnfriending(true);
    await onUnfriend(buddy.friendshipId, buddy.uid);
    setIsUnfriending(false);
    setShowUnfriendConfirm(false);
    onClose();
  };

  const handleRevoke = async (sharedHabitDocId: string) => {
    setRevokingId(sharedHabitDocId);
    await onRevokeHabit(sharedHabitDocId);
    setRevokingId(null);
  };

  const completedIncomingToday = incomingHabits.filter((h) => h.completedToday).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 selection:bg-emerald-500/20 cursor-default"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
      >
        {/* Clean Header: Avatar + Name + Nudge & Actions */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {buddy.photoURL ? (
              <img
                src={buddy.photoURL}
                alt={buddy.displayName}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-emerald-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center font-mono flex-shrink-0">
                {buddy.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {buddy.displayName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Minimal Nudge Button */}
            <button
              type="button"
              onClick={handleNudgeClick}
              disabled={nudgeCooldownRemaining > 0 || isNudging}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs ${
                nudgeCooldownRemaining > 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
              }`}
              title={
                nudgeCooldownRemaining > 0
                  ? `Cooldown: ${formatCooldown(nudgeCooldownRemaining)}`
                  : 'Send nudge'
              }
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  nudgeCooldownRemaining > 0 ? 'fill-slate-400' : 'fill-slate-950'
                }`}
              />
              <span>
                {isNudging
                  ? '...'
                  : nudgeCooldownRemaining > 0
                  ? formatCooldown(nudgeCooldownRemaining)
                  : 'Nudge'}
              </span>
            </button>

            {/* Remove Buddy Button */}
            <button
              type="button"
              onClick={() => setShowUnfriendConfirm((prev) => !prev)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Remove buddy"
            >
              <UserX className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nudge Notification Toast */}
        {nudgeToast && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Nudge sent to {firstName}!</span>
          </div>
        )}

        {/* Unfriend Confirm Dialog */}
        {showUnfriendConfirm && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs animate-in fade-in">
            <p className="font-semibold text-rose-800 dark:text-rose-300 mb-2">
              Remove {buddy.displayName}? All shared habits will be unlinked.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUnfriendConfirm}
                disabled={isUnfriending}
                className="py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                {isUnfriending ? 'Removing...' : 'Remove'}
              </button>
              <button
                type="button"
                onClick={() => setShowUnfriendConfirm(false)}
                className="py-1 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action-driven Dynamic Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl mt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'received'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{buddyFirstName ? `${buddyFirstName}'s (${incomingHabits.length})` : `Buddy's (${incomingHabits.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'sent'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Mine ({outgoingHabits.length})</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 min-h-[140px] max-h-[360px] pr-0.5">
          {/* TAB 1: Habits Shared by Buddy */}
          {activeTab === 'received' && (
            <>
              {incomingHabits.length > 0 && (
                <div className="px-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>
                    {completedIncomingToday} of {incomingHabits.length} completed today
                  </span>
                </div>
              )}

              {incomingHabits.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <TrendingUp className="w-6 h-6 text-slate-400 mx-auto opacity-40" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No habits shared yet
                  </p>
                </div>
              ) : (
                incomingHabits.map((habit) => {
                  const tier = getTierByLevel(habit.currentLevel || 0);

                  return (
                    <div
                      key={habit.id}
                      onClick={() => onInspectSharedHabit(habit)}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                          style={{
                            backgroundColor: `${habit.habitColor}18`,
                            color: habit.habitColor,
                            border: `1px solid ${habit.habitColor}35`,
                          }}
                        >
                          <DynamicIcon name={habit.habitIcon} className="w-4 h-4" />
                        </div>

                        {/* Title & Level */}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {habit.habitTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {tier && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Lvl {habit.currentLevel || 0}
                              </span>
                            )}
                            {habit.streak > 0 && (
                              <span className="text-[10px] font-mono font-semibold text-amber-500 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 fill-amber-500" />
                                {habit.streak}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Arrow */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {habit.completedToday ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-bold font-mono flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400 text-[11px] font-bold font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}

                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: Habits You Shared (Mine) */}
          {activeTab === 'sent' && (
            <>
              {outgoingHabits.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <Share2 className="w-6 h-6 text-slate-400 mx-auto opacity-40" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    You haven't committed any habits to {firstName} yet
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenShareWizardForBuddy(buddy.uid)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>+ Add Commitment</span>
                  </button>
                </div>
              ) : (
                <>
                  {outgoingHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${habit.habitColor}18`,
                            color: habit.habitColor,
                            border: `1px solid ${habit.habitColor}35`,
                          }}
                        >
                          <DynamicIcon name={habit.habitIcon} className="w-4 h-4" />
                        </div>

                        {/* Title & Streak */}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {habit.habitTitle}
                          </p>
                          {habit.streak > 0 && (
                            <span className="text-[10px] font-mono font-semibold text-amber-500 flex items-center gap-0.5 mt-0.5">
                              <Flame className="w-2.5 h-2.5 fill-amber-500" />
                              {habit.streak}d streak
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Revoke Button */}
                      <button
                        type="button"
                        onClick={() => handleRevoke(habit.id)}
                        disabled={revokingId === habit.id}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer disabled:opacity-50 flex-shrink-0"
                        title="Revoke access"
                      >
                        {revokingId === habit.id ? (
                          <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenShareWizardForBuddy(buddy.uid)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>+ Add Commitment</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

