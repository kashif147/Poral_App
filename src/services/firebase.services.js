import messaging from '@react-native-firebase/messaging';
import { PERMISSIONS, request } from 'react-native-permissions';
import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getFcmToken = async () => {
  let token = null;
  await checkApplicationNotificationsPermission();
  await registerAppWithFcm();
  try {
    token = await messaging().getToken();
    console.log('FCM token=========>', token);
    // Store token in AsyncStorage for future API integration
    if (token) {
      await AsyncStorage.setItem('fcmToken', token);
    }
  } catch (error) {
    console.log('Error getting FCM token', error);
    token = 'DeviceToken';
  }
  return token;
};

const checkApplicationNotificationsPermission = async () => {
  try {
    // Request permission from Firebase (works on both iOS and Android)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      console.log('Notifications permission granted', authStatus);
    } else {
      console.log('Notifications permission not granted', authStatus);
    }

    // For Android 13+ (API 33+), also request POST_NOTIFICATIONS permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        console.log('Android POST_NOTIFICATIONS permission result', result);
      } catch (error) {
        console.log('Android POST_NOTIFICATIONS permission error', error);
      }
    }
  } catch (error) {
    console.log('Error requesting notification permissions', error);
  }
};

const registerAppWithFcm = async () => {
  // isDeviceRegisteredForRemoteMessages is iOS-only
  if (Platform.OS === 'ios') {
    try {
      const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages();
      console.log('Is device registered for remote messages', isRegistered);
      if (!isRegistered) {
        await messaging()
          .registerDeviceForRemoteMessages()
          .then(result => {
            console.log('Device registered for remote messages', result);
          })
          .catch(error => {
            console.log('Error registering device for remote messages', error);
          });
      }
    } catch (error) {
      console.log('Error checking/registering device for remote messages', error);
    }
  } else {
    // Android doesn't need explicit registration
    console.log('Android device - remote message registration not required');
  }
};

const unRegisterAppWithFcm = async () => {
  // isDeviceRegisteredForRemoteMessages is iOS-only
  if (Platform.OS === 'ios') {
    try {
      const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages();
      if (isRegistered) {
        await messaging()
          .unregisterDeviceForRemoteMessages()
          .then(result => {
            console.log('Device unregistered for remote messages', result);
          })
          .catch(error => {
            console.log('Error unregistering device for remote messages', error);
          });
      }
    } catch (error) {
      console.log('Error checking/unregistering device for remote messages', error);
    }
  }
  
  // Delete token on both platforms
  try {
    await messaging().deleteToken();
    console.log('FCM token deleted');
  } catch (error) {
    console.log('Error deleting FCM token', error);
  }
};

const registerListenerWithFcm = (navigationRef) => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    if (
      remoteMessage?.notification?.title &&
      remoteMessage?.notification?.body
    ) {
      onDisplayNotificaiton(
        remoteMessage?.notification?.title,
        remoteMessage?.notification?.body,
        remoteMessage?.data,
      );
    }
  });

  // Merged background event handler
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    
    switch (type) {
      case EventType.DISMISSED:
        console.log('notification dismissed', notification);
        break;
      case EventType.PRESS:
        console.log('notification pressed', notification);
        handleNotificationOpenApp(notification, navigationRef);
        break;
      case EventType.ACTION_PRESS:
        if (pressAction?.id === 'mark-as-read') {
          console.log('onBackgroundEvent: mark-as-read', notification);
          handleNotificationOpenApp(notification, navigationRef);
          await notifee.dismissNotification(notification.id);
        }
        break;
    }
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('notification opened app', remoteMessage);
    handleNotificationOpenApp(remoteMessage, navigationRef);
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Initial notification', remoteMessage);
        handleNotificationOpenApp(remoteMessage, navigationRef);
      }
    });
    
  return unsubscribe;
};

const handleNotificationOpenApp = (remoteMessageOrNotification, navigationRef) => {
  if (!navigationRef) {
    console.log('Navigation ref not available for notification handling');
    return;
  }

  const navigation = navigationRef.current;
  if (!navigation) {
    console.log('Navigation not ready for notification handling');
    return;
  }

  // Handle both Firebase remoteMessage and Notifee notification objects
  // Notifee notification has data in notification.data
  // Firebase remoteMessage has data in remoteMessage.data
  const data = remoteMessageOrNotification?.data || remoteMessageOrNotification?.notification?.data || {};

  let obj = {
    roomId: data?.roomId,
    userInfo: {
      id: data?.detail?.id || data?.details?.id,
      name: data?.detail?.name || data?.details?.name,
      message: data?.detail?.message || data?.details?.message,
    },
  };

  // Navigate based on notification data
  if (obj.roomId) {
    // Future: Navigate to chat screen with roomId
    console.log('Navigate to chat with roomId:', obj.roomId);
    // navigation.navigate('Chat', { roomId: obj.roomId });
  } else {
    // Navigate to Notifications screen
    console.log('Navigate to Notifications screen');
    navigation.navigate('Notifications');
  }
};

const onDisplayNotificaiton = async (title, body, data) => {
  console.log('displaying notification', JSON.stringify(data));
  await notifee.requestPermission();

  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });
  await notifee.displayNotification({
    title: title,
    body: body,
    data: data,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
    },
  });
};

export {
  getFcmToken,
  checkApplicationNotificationsPermission,
  registerAppWithFcm,
  unRegisterAppWithFcm,
  registerListenerWithFcm,
};
