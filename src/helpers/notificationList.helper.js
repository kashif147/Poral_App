import moment from 'moment';
import { fetchNotificationRequest } from '../api/notification.api';

const resolvePdfAttachments = notif => {
  const attachments = Array.isArray(notif?.attachments)
    ? notif.attachments
    : Array.isArray(notif?.metadata?.attachments)
    ? notif.metadata.attachments
    : [];

  return attachments.filter(attachment =>
    String(attachment?.mimeType || '')
      .toLowerCase()
      .includes('pdf'),
  );
};

export const mapNotificationList = notificationsList => {
  if (!Array.isArray(notificationsList)) {
    return [];
  }

  return notificationsList.map(notif => {
    const pdfAttachments = resolvePdfAttachments(notif);
    return {
      messageId:
        notif._id || notif.messageId || notif.id || Date.now().toString(),
      from: notif.from,
      title: notif.title || 'Notification',
      body: notif.body || notif.message || '',
      read: Boolean(notif.isRead ?? notif.read ?? false),
      timestamp:
        notif.sentAt ||
        notif.createdAt ||
        notif.timestamp ||
        new Date().toISOString(),
      data: notif.data || {},
      attachments: Array.isArray(notif?.attachments)
        ? notif.attachments
        : Array.isArray(notif?.metadata?.attachments)
        ? notif.metadata.attachments
        : [],
      pdfAttachments,
      type:
        notif.data?.type ||
        notif.type ||
        (notif.title?.toLowerCase().includes('payment')
          ? 'payment'
          : 'subscription'),
      time:
        notif.sentAt || notif.createdAt || notif.timestamp
          ? moment(notif.sentAt || notif.createdAt || notif.timestamp).fromNow()
          : 'Just now',
    };
  });
};

/**
 * Fetch in-app notification inbox from notification-service.
 * Returns { notifications, unreadCount } or null on failure.
 */
export const loadNotificationInbox = async (params = { page: 1, limit: 50 }) => {
  const response = await fetchNotificationRequest(params);
  const status = response?.status;
  const payload = response?.data;

  const isOk =
    status >= 200 &&
    status < 300 &&
    (payload?.success === true ||
      payload?.status === 'success' ||
      payload?.status === true ||
      Array.isArray(payload?.data?.notifications) ||
      Array.isArray(payload?.notifications) ||
      Array.isArray(payload?.data));

  if (!isOk) {
    const errorMessage =
      payload?.message ||
      payload?.error?.message ||
      'Failed to fetch notifications';
    const error = new Error(errorMessage);
    error.response = response;
    throw error;
  }

  const data = payload?.data ?? payload;
  const notificationsList = Array.isArray(data?.notifications)
    ? data.notifications
    : Array.isArray(payload?.notifications)
    ? payload.notifications
    : Array.isArray(data)
    ? data
    : [];

  const mappedNotifications = mapNotificationList(notificationsList);
  const unreadCount =
    data?.unreadCount !== undefined
      ? data.unreadCount
      : payload?.unreadCount !== undefined
      ? payload.unreadCount
      : mappedNotifications.filter(n => !n.read).length;

  return {
    notifications: mappedNotifications,
    unreadCount,
  };
};
