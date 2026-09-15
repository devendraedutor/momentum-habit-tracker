import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
  Flame,
  AlertCircle,
} from 'lucide-react';
import type { Habit } from '../../types/habit';
import type { BuddyMemberSummary } from '../../types/buddy';
import { DynamicIcon } from '../DynamicIcon';
import { getTierByLevel } from '../../config/progression';

interface GranularShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  buddies: BuddyMemberSummary[];
  preselectedBuddyUid?: string | null;
  onShareConfirmed: (selectedHabits: Habit[], targetBuddyUids: string[]) => Promise<boolean>;
  onOpenBuddyHub?: () => void;
}

export const GranularShareModal: React.FC<GranularShareModalProps> = ({
  isOpen,
  onClose,
  habits,
  buddies,
  preselectedBuddyUid,
  onShareConfirmed,
  onOpenBuddyHub,
}) => {
  const activeHabits = habits.filter((h) => !h.archived);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set());
  const [selectedBuddyUids, setSelectedBuddyUids] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSubmitError(null);
      // Initialize with all active habits selected by default
      setSelectedHabitIds(new Set(activeHabits.map((h) => h.id)));

      if (preselectedBuddyUid) {
        setSelectedBuddyUids(new Set([preselectedBuddyUid]));
      } else if (buddies.length > 0) {
        setSelectedBuddyUids(new Set(buddies.map((b) => b.uid).filter(Boolean)));
      } else {
        setSelectedBuddyUids(new Set());
      }
    }
  }, [isOpen, activeHabits.length, buddies.length, preselectedBuddyUid]);

  if (!isOpen) return null;

  const toggleHabit = (id: string) => {
    setSelectedHabitIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBuddy = (uid: string) => {
    setSelectedBuddyUids((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSelectAllHabits = () => {
    setSelectedHabitIds(new Set(activeHabits.map((h) => h.id)));
  };

  const handleDeselectAllHabits = () => {
    setSelectedHabitIds(new Set());
  };

  const handleSelectAllBuddies = () => {
    setSelectedBuddyUids(new Set(buddies.map((b) => b.uid).filter(Boolean)));
  };

  const handleDeselectAllBuddies = () => {
    setSelectedBuddyUids(new Set());
  };

  const handleSubmit = async () => {
    if (selectedHabitIds.size === 0 || selectedBuddyUids.size === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const chosenHabits = activeHabits.filter((h) => selectedHabitIds.has(h.id));
      const targetUids: string[] = Array.from(selectedBuddyUids);

      const success = await onShareConfirmed(chosenHabits, targetUids);
      if (success) {
        onClose();
      } else {
        setSubmitError('Unable to share habits. Please check your network or Firestore rules.');
      }
    } catch (err: any) {
      console.error('[GranularShare] Error submitting habits:', err);
      if (err?.code === 'permission-denied') {
        setSubmitError('Firestore permission denied. Please ensure your Firestore Security Rules allow writes to the shared_habits collection.');
      } else {
        setSubmitError(err?.message || 'Error sharing habits. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 selection:bg-emerald-500/20">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  Share Habits with Buddy
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {step === 1
                  ? 'Select which habits you want to share'
                  : 'Choose which habit buddies to grant access'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 1 ? 'bg-emerald-500' : 'bg-emerald-500'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        </div>

        {/* STEP 1: Select Habits */}
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                {selectedHabitIds.size} of {activeHabits.length} habits selected
              </span>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllHabits}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllHabits}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 min-h-[160px] max-h-[360px]">
              {activeHabits.map((h) => {
                const isSelected = selectedHabitIds.has(h.id);
                const tier = getTierByLevel(h.currentLevel || 0);

                return (
                  <div
                    key={h.id}
                    onClick={() => toggleHabit(h.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600" />
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${h.color}20`,
                          color: h.color,
                          border: `1px solid ${h.color}40`,
                        }}
                      >
                        <DynamicIcon name={h.icon} className="w-4 h-4" />
                      </div>

                      {/* Name & Badges */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {h.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {h.category}
                          </span>
                          {tier && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Lvl {h.currentLevel || 0}
                            </span>
                          )}
                          {(h.overallStreak || 0) > 0 && (
                            <span className="text-[10px] font-mono font-semibold text-amber-500 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-amber-500" />
                              {h.overallStreak}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Step 1 */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedBuddyUids.size === 0 && buddies.length > 0) {
                    if (preselectedBuddyUid) {
                      setSelectedBuddyUids(new Set([preselectedBuddyUid]));
                    } else {
                      setSelectedBuddyUids(new Set(buddies.map((b) => b.uid).filter(Boolean)));
                    }
                  }
                  setStep(2);
                }}
                disabled={selectedHabitIds.size === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next: Choose Buddies ({selectedHabitIds.size})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Buddies */}
        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0">
            {buddies.length > 0 && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {selectedBuddyUids.size} of {buddies.length} buddies selected
                </span>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllBuddies}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllBuddies}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1 min-h-[160px] max-h-[360px]">
              {buddies.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Habit Buddies Connected Yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-0.5">
                      Pair with a friend using their Google email in the Habit Buddy Hub before sharing your habits!
                    </p>
                  </div>
                  {onOpenBuddyHub && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBuddyHub();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open Habit Buddy Hub</span>
                    </button>
                  )}
                </div>
              ) : (
                buddies.map((buddy) => {
                const isSelected = selectedBuddyUids.has(buddy.uid);

                return (
                  <div
                    key={buddy.uid}
                    onClick={() => toggleBuddy(buddy.uid)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600" />
                        )}
                      </div>

                      {/* Avatar */}
                      {buddy.photoURL ? (
                        <img
                          src={buddy.photoURL}
                          alt={buddy.displayName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center font-mono flex-shrink-0">
                          {buddy.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name & Email */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {buddy.displayName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {buddy.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2 my-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{submitError}</span>
              </div>
            )}

            {/* Footer Step 2 */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedBuddyUids.size === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Confirm & Share ({selectedHabitIds.size} Habits with {selectedBuddyUids.size} {selectedBuddyUids.size === 1 ? 'Buddy' : 'Buddies'})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
