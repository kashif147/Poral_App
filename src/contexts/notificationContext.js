import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Increment unread count when a new notification is received
  const incrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    incrementUnreadCount();
  }, [incrementUnreadCount]);

  // Mark notification as read
  const markAsRead = useCallback((messageId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.messageId === messageId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Set unread count (useful for initial load from API)
  const setUnreadCountValue = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Set notifications (useful for initial load from API)
  const setNotificationsValue = useCallback((notifs) => {
    setNotifications(notifs);
  }, []);

  const value = {
    unreadCount,
    notifications,
    incrementUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    setUnreadCountValue,
    setNotificationsValue,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
