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
  Check,
} from 'lucide-react';
import type { BuddyMemberSummary, AppNotification } from '../../types/buddy';
import type { SearchedUser } from '../../lib/firestoreService';
import { Modal } from '../common/Modal';

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
  pendingInvites?: AppNotification[];
  onAcceptInvite?: (notification: AppNotification) => Promise<void> | void;
  onDeclineInvite?: (notification: AppNotification) => Promise<void> | void;
  isNotificationActionLoading?: string | null;
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
  pendingInvites = [],
  onAcceptInvite,
  onDeclineInvite,
  isNotificationActionLoading = null,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setEmailInput('');
      onClearSearch();
      setShowPendingList(false);
    }
  }, [isOpen]);

  // Reset showPendingList if no pending invites remain
  useEffect(() => {
    if (pendingInvites.length === 0 && showPendingList) {
      setShowPendingList(false);
    }
  }, [pendingInvites.length, showPendingList]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowAddForm(false);
    setEmailInput('');
    onClearSearch();
    setShowPendingList(false);
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

  const headerCustom = (
    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Users className="w-4.5 h-4.5" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Habit Buddies
        </h2>
      </div>

      <div className="flex items-center gap-2 relative">
        {/* Clickable Request (N) Button with Floating Pop-Up Dropdown */}
        {pendingInvites.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPendingList((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                showPendingList
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 ring-2 ring-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
              }`}
              title="View pending requests"
            >
              <span>Request ({pendingInvites.length})</span>
            </button>

            {/* Floating Pop-Up Dropdown */}
            {showPendingList && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-750 shadow-xs flex items-center justify-between gap-2.5"
                    >
                      {/* Buddy Details: Avatar + Name + Email */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {invite.senderPhoto ? (
                          <img
                            src={invite.senderPhoto}
                            alt={invite.senderName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500/30 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {invite.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                            {invite.senderName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {invite.senderEmail || 'Buddy request'}
                          </p>
                        </div>
                      </div>

                      {/* Icon-Only Action Buttons: Accept (Check) & Decline (X) */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onAcceptInvite?.(invite)}
                          disabled={isNotificationActionLoading === invite.id}
                          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition cursor-pointer disabled:opacity-50"
                          title="Accept"
                          aria-label="Accept"
                        >
                          {isNotificationActionLoading === invite.id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineInvite?.(invite)}
                          disabled={isNotificationActionLoading === invite.id}
                          className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                          title="Decline"
                          aria-label="Decline"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header Add Buddy Icon (Only when buddies.length > 0) */}
        {buddies.length > 0 && (
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
            <UserPlus className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-lg"
      headerCustom={headerCustom}
      className="max-h-[85vh] p-5 sm:p-6"
      bodyClassName="p-0 flex flex-col"
    >
      {/* Content */}
        <div className="overflow-y-auto space-y-3 pt-3.5 max-h-[60vh] pr-0.5">
          {/* Expandable Search Input */}
          {showAddForm && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-150">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
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
                    className="w-full pl-9 pr-20 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !emailInput.trim()}
                    className="absolute right-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <X className="w-4 h-4" />
                </button>
              </form>

              {/* Error Banner */}
              {searchError && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span className="flex-1">{searchError}</span>
                </div>
              )}

              {/* Inline Search Result Card */}
              {searchResult && (
                <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {searchResult.photoURL ? (
                      <img
                        src={searchResult.photoURL}
                        alt={searchResult.displayName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-500/40 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {searchResult.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {searchResult.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {searchResult.email}
                      </p>
                    </div>
                  </div>

                  {searchResult.relationStatus === 'friends' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </span>
                  ) : searchResult.relationStatus === 'pending_sent' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sent</span>
                    </span>
                  ) : searchResult.relationStatus === 'pending_received' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendClick}
                      disabled={isInviteSending}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isInviteSending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Buddies List */}
          <div className="space-y-2">
            {buddies.length === 0 ? (
              !showAddForm && (
                <div className="py-8 px-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add a Buddy</span>
                  </button>
                </div>
              )
            ) : (
              buddies.map((buddy) => (
                <div
                  key={buddy.uid}
                  onClick={() => handleSelectBuddyClick(buddy)}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  {/* Buddy Details: Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {buddy.photoURL ? (
                      <img
                        src={buddy.photoURL}
                        alt={buddy.displayName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {buddy.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer flex-shrink-0"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
    </Modal>
  );
};


