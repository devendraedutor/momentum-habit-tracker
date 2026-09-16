import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ListChecks,
  Users,
  Flame,
  AlertCircle,
  Crown,
  Handshake,
  Search,
  Send,
  UserCheck,
  Clock,
  UserPlus,
} from 'lucide-react';
import type { Habit } from '../../types/habit';
import type { BuddyMemberSummary } from '../../types/buddy';
import type { SearchedUser } from '../../lib/firestoreService';
import { DynamicIcon } from '../DynamicIcon';
import { getTierByLevel } from '../../config/progression';

interface GranularShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  buddies: BuddyMemberSummary[];
  preselectedBuddyUid?: string | null;
  onShareConfirmed: (
    selectedHabits: Habit[],
    targetBuddyUids: string[],
    shareScope?: 'starting' | 'today'
  ) => Promise<boolean>;
  onOpenBuddyHub?: () => void;
  onSearchBuddy?: (email: string) => Promise<void>;
  onSendInvite?: (targetUser: SearchedUser) => Promise<boolean>;
  isSearching?: boolean;
  searchResult?: SearchedUser | null;
  searchError?: string | null;
  isInviteSending?: boolean;
  onClearSearch?: () => void;
}

export const GranularShareModal: React.FC<GranularShareModalProps> = ({
  isOpen,
  onClose,
  habits,
  buddies,
  preselectedBuddyUid,
  onShareConfirmed,
  onOpenBuddyHub: _onOpenBuddyHub,
  onSearchBuddy,
  onSendInvite,
  isSearching = false,
  searchResult = null,
  searchError = null,
  isInviteSending = false,
  onClearSearch,
}) => {
  const activeHabits = habits.filter((h) => !h.archived);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set());
  const [selectedBuddyUids, setSelectedBuddyUids] = useState<Set<string>>(new Set());
  const [shareScope, setShareScope] = useState<'starting' | 'today'>('starting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSubmitError(null);
      setEmailInput('');
      setInviteSuccessMessage(null);
      setShowSearchForm(false);
      setShareScope('starting');
      onClearSearch?.();
      // All habits and buddies deselected by default
      setSelectedHabitIds(new Set());

      if (preselectedBuddyUid) {
        setSelectedBuddyUids(new Set([preselectedBuddyUid]));
      } else {
        setSelectedBuddyUids(new Set());
      }
    }
  }, [isOpen, activeHabits.length, buddies.length, preselectedBuddyUid]);

  if (!isOpen) return null;

  const isDirectBuddyFlow = Boolean(preselectedBuddyUid);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !onSearchBuddy) return;
    setInviteSuccessMessage(null);
    onSearchBuddy(emailInput.trim());
  };

  const handleSendInviteClick = async () => {
    if (!searchResult || !onSendInvite) return;
    const success = await onSendInvite(searchResult);
    if (success) {
      setInviteSuccessMessage(`Invite sent to ${searchResult.displayName}!`);
      setEmailInput('');
      onClearSearch?.();
    }
  };

  const handleSubmit = async () => {
    const targetBuddyUids = isDirectBuddyFlow && preselectedBuddyUid
      ? [preselectedBuddyUid]
      : Array.from(selectedBuddyUids);

    if (selectedHabitIds.size === 0 || targetBuddyUids.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const chosenHabits = activeHabits.filter((h) => selectedHabitIds.has(h.id));
      const success = await onShareConfirmed(chosenHabits, targetBuddyUids, shareScope);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 selection:bg-emerald-500/20">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Floating Mac-style Close Button on Top-Right Corner */}
        <button
          type="button"
          onClick={() => {
            setEmailInput('');
            setInviteSuccessMessage(null);
            onClearSearch?.();
            onClose();
          }}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition active:scale-90 hover:scale-105 cursor-pointer z-30"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header: Dynamic Icon & Title for Step 1 (Select Habits) / Step 2 (Select Buddies) */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {step === 1 ? <ListChecks className="w-4.5 h-4.5" /> : <Users className="w-4.5 h-4.5" />}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {step === 1 ? 'Select Habits' : 'Select Buddies'}
            </h2>
          </div>
        </div>

        {/* STEP 1: Select Habits */}
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 max-h-[50vh]">
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
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              <span>{h.currentLevel || 0}</span>
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

            {/* Share Data Starting Point Selector - Only visible when at least 1 habit is selected */}
            {selectedHabitIds.size > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Share Data From
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {shareScope === 'starting' ? 'Full history from creation' : 'Progress tracked from today onwards'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-1 bg-slate-200/90 dark:bg-slate-900 rounded-xl gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShareScope('starting')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      shareScope === 'starting'
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {shareScope === 'starting' && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>From Starting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareScope('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      shareScope === 'today'
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {shareScope === 'today' && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>From Today</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner for Direct Flow */}
            {submitError && isDirectBuddyFlow && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2 my-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{submitError}</span>
              </div>
            )}

            {/* Footer Step 1: Direct Commit Button if coming from partner page, or Green Arrow if coming from Directory */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              {isDirectBuddyFlow ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedHabitIds.size === 0}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Handshake className="w-4 h-4" />
                      <span>Commit</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={selectedHabitIds.size === 0}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next"
                  aria-label="Next"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Select Buddies */}
        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 max-h-[50vh]">
              {buddies.length === 0 ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/40 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3.5 my-auto">
                  {!showSearchForm ? (
                    <>
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 font-sans">
                        No habit buddies yet
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSearchForm(true)}
                        className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Add a Buddy</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-left space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Search by partner's email
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSearchForm(false);
                            setEmailInput('');
                            setInviteSuccessMessage(null);
                            onClearSearch?.();
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Back"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                        <div className="absolute left-3 text-slate-400 pointer-events-none">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            setInviteSuccessMessage(null);
                            if (searchError || searchResult) onClearSearch?.();
                          }}
                          placeholder="Enter partner's email..."
                          autoFocus
                          className="w-full pl-9 pr-20 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono transition"
                        />
                        <button
                          type="submit"
                          disabled={isSearching || !emailInput.trim()}
                          className="absolute right-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isSearching ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>Search</span>
                          )}
                        </button>
                      </form>

                      {/* Error Banner */}
                      {searchError && (
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                          <span className="flex-1">{searchError}</span>
                        </div>
                      )}

                      {/* Success Toast */}
                      {inviteSuccessMessage && (
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in duration-150">
                          <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                          <span className="flex-1">{inviteSuccessMessage}</span>
                        </div>
                      )}

                      {/* Search Result Card */}
                      {searchResult && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/30 flex items-center justify-between gap-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {searchResult.photoURL ? (
                              <img
                                src={searchResult.photoURL}
                                alt={searchResult.displayName}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500/40 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
                                {searchResult.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {searchResult.displayName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate font-mono">
                                {searchResult.email}
                              </p>
                            </div>
                          </div>

                          {searchResult.relationStatus === 'friends' ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Friends</span>
                            </span>
                          ) : searchResult.relationStatus === 'pending_sent' ? (
                            <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Sent</span>
                            </span>
                          ) : searchResult.relationStatus === 'pending_received' ? (
                            <span className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-bold font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendInviteClick}
                              disabled={isInviteSending}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {isInviteSending ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  <span>Invite</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                buddies.map((buddy) => {
                  const isSelected = selectedBuddyUids.has(buddy.uid);

                  return (
                    <div
                      key={buddy.uid}
                      onClick={() => toggleBuddy(buddy.uid)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
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

                        {/* Name Only (No email) */}
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1">
                          {buddy.displayName}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2 my-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{submitError}</span>
              </div>
            )}

            {/* Footer Step 2: Back button + Live Yellowish Commit Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Handshake className="w-4 h-4" />
                    <span>Commit</span>
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
