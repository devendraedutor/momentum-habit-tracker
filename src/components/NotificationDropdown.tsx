import React, { useEffect, useRef } from 'react';
import { Bell, Check, X, Zap, Sparkles, UserCheck, Shield, AlertTriangle } from 'lucide-react';
import type { AppNotification } from '../types/buddy';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  isActionLoading: string | null;
  onMarkAllAsRead: () => void;
  onAcceptInvite: (notification: AppNotification) => void;
  onDeclineInvite: (notification: AppNotification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isActionLoading,
  onMarkAllAsRead,
  onAcceptInvite,
  onDeclineInvite,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto-mark notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      onMarkAllAsRead();
    }
  }, [isOpen, unreadCount, onMarkAllAsRead]);

  if (!isOpen) return null;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 selection:bg-emerald-500/20"
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold font-mono">
              {unreadCount} new
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-slate-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No notifications yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Buddy requests and nudges will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border transition-all ${
                !item.read
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/60'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Sender Avatar or Icon */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {item.senderPhoto ? (
                    <img
                      src={item.senderPhoto}
                      alt={item.senderName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                      {item.senderName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {item.type === 'buddy_nudge' && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}
                  {item.type === 'buddy_accepted' && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <UserCheck className="w-2.5 h-2.5" />
                    </span>
                  )}
                  {item.type === 'buddy_checkin' && (() => {
                    const st = (item.checkInStatus || '').toLowerCase();
                    const isControlled = st === 'controlled';
                    const isMissed = st === 'missed';
                    const isFailed = st === 'failed';

                    return (
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs ${
                          isControlled
                            ? 'bg-cyan-500'
                            : isMissed
                            ? 'bg-rose-500'
                            : isFailed
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        title={`Status: ${item.checkInStatus || 'Done'}`}
                      >
                        {isControlled ? (
                          <Shield className="w-2.5 h-2.5 fill-white" />
                        ) : isMissed ? (
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                        ) : isFailed ? (
                          <AlertTriangle className="w-2.5 h-2.5 fill-white" />
                        ) : (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        )}
                      </span>
                    );
                  })()}
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                    {item.message}
                  </p>

                  {/* Interactive Buddy Invite Actions */}
                  {item.type === 'buddy_invite' && item.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-750">
                      <button
                        type="button"
                        onClick={() => onAcceptInvite(item)}
                        disabled={isActionLoading === item.id}
                        className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isActionLoading === item.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Accept</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeclineInvite(item)}
                        disabled={isActionLoading === item.id}
                        className="flex-1 py-1 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {/* Actioned historical badge */}
                  {item.type === 'buddy_invite' && item.status === 'actioned' && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Request responded to</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
