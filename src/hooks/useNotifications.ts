import { useState, useEffect, useCallback } from 'react';
import type { User } from '../lib/firebase';
import type { AppNotification } from '../types/buddy';
import {
  subscribeToNotifications,
  markNotificationsAsRead,
  acceptBuddyInvite,
  declineBuddyInvite,
} from '../lib/firestoreService';

interface UseNotificationsProps {
  user: User | null;
  onBuddyPartnerLinked?: (buddyUid: string) => void;
}

export function useNotifications({ user, onBuddyPartnerLinked }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const userUid = user?.uid || null;

  // Real-time notification subscription
  useEffect(() => {
    if (!userUid) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications(userUid, (incoming) => {
      setNotifications(incoming || []);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userUid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
    );

    await markNotificationsAsRead(user.uid, unreadIds);
  }, [notifications, user]);

  const handleAcceptInvite = useCallback(
    async (notification: AppNotification) => {
      if (!user) return;

      setIsActionLoading(notification.id);
      try {
        await acceptBuddyInvite(
          {
            id: notification.inviteId || '',
            fromUid: notification.senderUid,
            fromName: notification.senderName,
            fromEmail: notification.senderEmail,
            fromPhoto: notification.senderPhoto,
          },
          {
            uid: user.uid,
            displayName: user.displayName || 'Flux User',
            email: user.email || '',
            photoURL: user.photoURL || '',
          },
          notification.id
        );

        if (onBuddyPartnerLinked) {
          onBuddyPartnerLinked(notification.senderUid);
        }
      } catch (err) {
        console.error('Error accepting buddy invite:', err);
      } finally {
        setIsActionLoading(null);
      }
    },
    [onBuddyPartnerLinked, user]
  );

  const handleDeclineInvite = useCallback(
    async (notification: AppNotification) => {
      if (!user) return;

      setIsActionLoading(notification.id);
      try {
        await declineBuddyInvite(notification.inviteId || '', user.uid, notification.id);
      } catch (err) {
        console.error('Error declining buddy invite:', err);
      } finally {
        setIsActionLoading(null);
      }
    },
    [user]
  );

  return {
    notifications,
    unreadCount,
    isActionLoading,
    markAllAsRead,
    acceptInvite: handleAcceptInvite,
    declineInvite: handleDeclineInvite,
  };
}
