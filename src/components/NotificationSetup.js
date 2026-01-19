import { useEffect } from 'react';
import { useNotification } from '../contexts/notificationContext';
import { setNotificationContextMethods } from '../services/firebase.services';

const NotificationSetup = () => {
  const notificationMethods = useNotification();

  useEffect(() => {
    // Set notification context methods globally for Firebase service
    setNotificationContextMethods(notificationMethods);
  }, [notificationMethods]);

  return null;
};

export default NotificationSetup;
