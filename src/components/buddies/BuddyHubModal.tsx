import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Send,
  X,
  AlertCircle,
  UserCheck,
  Clock,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import type { BuddyMemberSummary } from '../../types/buddy';
import type { SearchedUser } from '../../lib/firestoreService';

interface BuddyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  buddies: BuddyMemberSummary[];
  onSearchBuddy: (email: string) => Promise<void>;
  onSendInvite: (targetUser: SearchedUser) => Promise<boolean>;
  isSearching: boolean;
  searchResult: SearchedUser | null;
  searchError: string | null;
  isInviteSending: boolean;
  onClearSearch: () => void;
  onOpenShareWizard?: () => void;
  onSelectBuddy: (buddy: BuddyMemberSummary) => void;
  onUnfriendBuddy?: (friendshipId: string, partnerUid: string) => Promise<void>;
}

export const BuddyHubModal: React.FC<BuddyHubModalProps> = ({
  isOpen,
  onClose,
  buddies,
  onSearchBuddy,
  onSendInvite,
  isSearching,
  searchResult,
  searchError,
  isInviteSending,
  onClearSearch,
  onSelectBuddy,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Reset search state whenever modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setEmailInput('');
      onClearSearch();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowAddForm(false);
    setEmailInput('');
    onClearSearch();
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    onSearchBuddy(emailInput);
  };

  const handleSendClick = async () => {
    if (!searchResult) return;
    const success = await onSendInvite(searchResult);
    if (success) {
      setEmailInput('');
      onClearSearch();
      setShowAddForm(false);
    }
  };

  const handleSelectBuddyClick = (buddy: BuddyMemberSummary) => {
    setShowAddForm(false);
    setEmailInput('');
    onClearSearch();
    onSelectBuddy(buddy);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 selection:bg-emerald-500/20 cursor-default"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
      >
        {/* Minimal Header (No Number Tab) */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
              Habit Buddies
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => {
                  const next = !prev;
                  if (!next) {
                    setEmailInput('');
                    onClearSearch();
                  }
                  return next;
                });
              }}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                showAddForm
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={showAddForm ? 'Close Add Buddy' : 'Add New Buddy'}
            >
              <UserPlus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-0.5">
          {/* Expandable Search Input */}
          {showAddForm && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-150">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-1.5">
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (searchError || searchResult) onClearSearch();
                    }}
                    placeholder="Enter partner's email..."
                    autoFocus
                    className="w-full pl-9 pr-20 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono transition"
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
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEmailInput('');
                    onClearSearch();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer flex-shrink-0"
                  title="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Error Banner */}
              {searchError && (
                <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                  <span className="flex-1">{searchError}</span>
                </div>
              )}

              {/* Inline Search Result Card */}
              {searchResult && (
                <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/30 flex items-center justify-between gap-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {searchResult.photoURL ? (
                      <img
                        src={searchResult.photoURL}
                        alt={searchResult.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500/40 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
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
                      onClick={handleSendClick}
                      disabled={isInviteSending}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isInviteSending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Buddies List (Clean: Buddy Avatar + Name + View Button Only) */}
          <div className="space-y-2">
            {buddies.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2.5">
                <Users className="w-6 h-6 text-slate-400 mx-auto opacity-40" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No habit buddies yet
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add a Buddy</span>
                </button>
              </div>
            ) : (
              buddies.map((buddy) => (
                <div
                  key={buddy.uid}
                  onClick={() => handleSelectBuddyClick(buddy)}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  {/* Buddy Details: Avatar + Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {buddy.photoURL ? (
                      <img
                        src={buddy.photoURL}
                        alt={buddy.displayName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-500/30 flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
                        {buddy.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {buddy.displayName}
                    </h4>
                  </div>

                  {/* View Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBuddyClick(buddy);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer flex-shrink-0"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


