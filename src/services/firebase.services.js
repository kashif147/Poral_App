import messaging from '@react-native-firebase/messaging';
import { PERMISSIONS, request } from 'react-native-permissions';
import notifee, { AndroidImportance, AndroidStyle, AndroidVisibility, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { registerToken } from '../api/notification.api';

const NOTIFICATION_CHANNEL_ID = 'portal_default_v2';

// Store notification context methods globally for notification handlers
let notificationContextMethods = null;
let activeForegroundUnsubscribe = null;
let activeNotificationOpenedUnsubscribe = null;
let isNotifeeBackgroundHandlerRegistered = false;

// Function to set notification context methods (called from component)
const setNotificationContextMethods = (methods) => {
  notificationContextMethods = methods;
};

const ensureDefaultChannel = async () => {
  const channelId = await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Portal Notifications',
    importance: AndroidImportance.HIGH,
  });
  return channelId;
};

// Generate or retrieve persistent device ID
const getOrCreateDeviceId = async () => {
  const STORAGE_KEY = 'fcmDeviceId';
  
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (!deviceId) {
      // Generate new device ID using UUID
      deviceId = uuidv4();
      await AsyncStorage.setItem(STORAGE_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    } else {
      console.log('Retrieved existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    // Fallback: generate a new ID for this session
    return uuidv4();
  }
};

// Register FCM token with backend
const registerFcmTokenWithBackend = async (fcmToken, userId, tenantId, deviceId, platform = 'ios') => {
  if (!fcmToken || !userId || !tenantId || !deviceId) {
    console.warn('Missing required data for FCM token registration:', {
      hasToken: !!fcmToken,
      hasUserId: !!userId,
      hasTenantId: !!tenantId,
      hasDeviceId: !!deviceId,
    });
    return false;
  }

  try {
    const registrationData = {
      fcmToken,
      userId,
      tenantId,
      deviceId,
      platform,
    };

    console.log('Registering FCM token with backend:', {
      ...registrationData,
      fcmToken: fcmToken.substring(0, 20) + '...', // Log partial token for debugging
    });

    const response = await registerToken(registrationData);
    
    if (response?.status === 200 || response?.data?.status === 'success') {
      console.log('FCM token registered successfully');
      return true;
    } else {
      console.error('FCM token registration failed:', response?.data?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error registering FCM token with backend:', error);
    return false;
  }
};

const getFcmToken = async (userData = null) => {
  let token = null;
  await messaging().setAutoInitEnabled(true);
  if (Platform.OS === 'android') {
    try {
      // Keep notification handling in-app for consistent shade behavior.
      await messaging().setNotificationDelegationEnabled(false);
    } catch (error) {
      console.log('Unable to disable Android notification delegation', error);
    }
  }
  await ensureDefaultChannel();
  await checkApplicationNotificationsPermission();
  await registerAppWithFcm();
  try {
    token = await messaging().getToken();
    console.log('FCM token=========>', token);
    console.log('FCM Token (for API):', token);
    
    // Store token in AsyncStorage
    if (token) {
      await AsyncStorage.setItem('fcmToken', token);
      console.log('FCM token stored in AsyncStorage');
      
      // Register token with backend if user data is provided
      if (userData) {
        const userId = userData.userId;
        const tenantId = userData.tenantId;
        const deviceId = await getOrCreateDeviceId();
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        
        if (userId && tenantId && deviceId) {
          // Register token asynchronously (don't block token retrieval)
          registerFcmTokenWithBackend(token, userId, tenantId, deviceId, platform)
            .then(success => {
              if (success) {
                console.log('FCM token registration completed successfully');
              } else {
                console.warn('FCM token registration failed, but token is still available');
              }
            })
            .catch(error => {
              console.error('FCM token registration error:', error);
            });
        } else {
          console.warn('User data incomplete, skipping FCM token registration:', {
            hasUserId: !!userId,
            hasTenantId: !!tenantId,
            hasDeviceId: !!deviceId,
          });
        }
      } else {
        console.log('User data not provided, FCM token will be registered later');
      }
    } else {
      console.log('No FCM token received');
    }
  } catch (error) {
    console.log('Error getting FCM token', error);
    console.error('FCM Token Error Details:', error.message);
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
  // Register device for remote messages (iOS-only)
  if (Platform.OS === 'ios') {
    try {
      await messaging()
        .registerDeviceForRemoteMessages()
        .then(result => {
          console.log('Device registered for remote messages', result);
        })
        .catch(error => {
          // Handle specific error about missing aps-environment entitlement
          if (error?.message?.includes('aps-environment') || error?.code === 'messaging/unknown') {
            console.warn(
              'Push notifications not configured: Missing "aps-environment" entitlement. ' +
              'Please enable Push Notifications capability in Xcode under Signing & Capabilities.'
            );
          } else {
            console.log('Error registering device for remote messages:', error.message || error);
          }
          // Don't throw - allow app to continue without push notifications
        });
    } catch (error) {
      // Handle errors gracefully - app can function without push notifications
      if (error?.message?.includes('aps-environment') || error?.code === 'messaging/unknown') {
        console.warn(
          'Push notifications not configured: Missing "aps-environment" entitlement. ' +
          'Please enable Push Notifications capability in Xcode under Signing & Capabilities.'
        );
      } else {
        console.log('Error registering device for remote messages:', error.message || error);
      }
    }
  } else {
    // Android doesn't need explicit registration
    console.log('Android device - remote message registration not required');
  }
};

const unRegisterAppWithFcm = async () => {
  // Unregister device for remote messages (iOS-only)
  if (Platform.OS === 'ios') {
    try {
      await messaging()
        .unregisterDeviceForRemoteMessages()
        .then(result => {
          console.log('Device unregistered for remote messages', result);
        })
        .catch(error => {
          // Silently handle error - device may not be registered
          console.log('Error unregistering device for remote messages', error.message || error);
        });
    } catch (error) {
      // Silently handle error - device may not be registered
      console.log('Error unregistering device for remote messages', error.message || error);
    }
  }
  
  // Delete token on both platforms
  // Note: This may fail if Firebase isn't fully initialized or device isn't registered
  // It's safe to ignore this error during logout
  try {
    await messaging().deleteToken();
    console.log('FCM token deleted');
    // Also remove from AsyncStorage
    await AsyncStorage.removeItem('fcmToken');
  } catch (error) {
    // Silently handle error - token deletion is not critical during logout
    // The token will be invalidated when user logs back in and gets a new token
    console.log('Error deleting FCM token (non-critical):', error.message || error);
    // Still try to remove from AsyncStorage even if Firebase deletion fails
    try {
      await AsyncStorage.removeItem('fcmToken');
    } catch (storageError) {
      // Ignore storage errors
    }
  }
};

const registerListenerWithFcm = (navigationRef) => {
  if (activeForegroundUnsubscribe) {
    return () => {
      if (activeForegroundUnsubscribe) {
        activeForegroundUnsubscribe();
        activeForegroundUnsubscribe = null;
      }
      if (activeNotificationOpenedUnsubscribe) {
        activeNotificationOpenedUnsubscribe();
        activeNotificationOpenedUnsubscribe = null;
      }
    };
  }

  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received', remoteMessage);
    
    // Handle new payload structure: { from, messageId, notification: { title, body } }
    const notificationTitle =
      remoteMessage?.notification?.title ||
      remoteMessage?.data?.title ||
      'Notification';
    const notificationBody =
      remoteMessage?.notification?.body ||
      remoteMessage?.data?.body ||
      remoteMessage?.data?.message ||
      remoteMessage?.data?.detail?.message ||
      remoteMessage?.data?.details?.message ||
      '';
    const messageId = remoteMessage?.messageId;
    const from = remoteMessage?.from;
    
    if (notificationTitle || notificationBody) {
      // Display notification
      onDisplayNotificaiton(
        notificationTitle,
        notificationBody,
        remoteMessage?.data,
      );

      // Increment unread count and add notification to context
      if (notificationContextMethods) {
        notificationContextMethods.incrementUnreadCount();
        notificationContextMethods.addNotification({
          messageId: messageId || Date.now().toString(),
          from: from,
          title: notificationTitle,
          body: notificationBody,
          read: false,
          timestamp: new Date().toISOString(),
          data: remoteMessage.data || {},
        });
      }
    }
  });

  // Merged background event handler
  if (!isNotifeeBackgroundHandlerRegistered) {
    isNotifeeBackgroundHandlerRegistered = true;
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
  }

  activeNotificationOpenedUnsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
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
    
  activeForegroundUnsubscribe = unsubscribe;

  return () => {
    if (activeForegroundUnsubscribe) {
      activeForegroundUnsubscribe();
      activeForegroundUnsubscribe = null;
    }
    if (activeNotificationOpenedUnsubscribe) {
      activeNotificationOpenedUnsubscribe();
      activeNotificationOpenedUnsubscribe = null;
    }
  };
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

  const channelId = await ensureDefaultChannel();
  const resolvedBody =
    body ||
    data?.body ||
    data?.message ||
    data?.detail?.message ||
    data?.details?.message ||
    '';

  await notifee.displayNotification({
    id: data?.notificationId || data?.messageId || Date.now().toString(),
    title: title || data?.title || 'Notification',
    body: resolvedBody,
    data: data,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      showTimestamp: true,
      // Force expanded content so full message is visible in notification shade.
      style: {
        type: AndroidStyle.BIGTEXT,
        text: resolvedBody,
      },
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
  setNotificationContextMethods,
};
