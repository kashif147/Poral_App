import notification_request from './notification_request';

export const registerToken = (data) => {
  return notification_request.post('/api/firebase/register-token', data);
};

export const fetchNotificationRequest = (params = {}) => {
  const { page = 1, limit = 50 } = params;
  return notification_request.get('/api/firebase/notifications', {
    params: {
      page,
      limit,
    },
  });
};

export const readNotificationRequest = (data) => {
  return notification_request.post('/api/firebase/notifications/mark-read', data);
};

export const deleteNotificationRequest = (id) => {
  return notification_request.delete(`/api/firebase/notifications/${id}`);
};

export const deleteAllNotificationRequest = () => {
  return notification_request.delete('/api/firebase/notifications');
};