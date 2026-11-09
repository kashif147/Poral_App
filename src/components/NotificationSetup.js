import { useEffect } from 'react';
import { useNotification } from '../contexts/notificationContext';
import { setNotificationContextMethods } from '../services/firebase.services';
import { loadNotificationInbox } from '../helpers/notificationList.helper';

const NotificationSetup = () => {
  const notificationMethods = useNotification();

  useEffect(() => {
    // Set notification context methods globally for Firebase service
    setNotificationContextMethods(notificationMethods);
  }, [notificationMethods]);

  // Prefetch in-app inbox as soon as the signed-in tree mounts (iOS + Android).
  useEffect(() => {
    let cancelled = false;

    const prefetch = async () => {
      try {
        const inbox = await loadNotificationInbox({ page: 1, limit: 50 });
        if (cancelled || !inbox) return;
        notificationMethods.setNotificationsValue(inbox.notifications);
        notificationMethods.setUnreadCountValue(inbox.unreadCount);
      } catch (error) {
        console.warn(
          '[notifications] in-app prefetch failed:',
          error?.message || error,
        );
      }
    };

    prefetch();
    return () => {
      cancelled = true;
    };
    // Run once on mount for this signed-in session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default NotificationSetup;
