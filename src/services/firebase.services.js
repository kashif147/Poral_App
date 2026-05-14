import messaging from '@react-native-firebase/messaging';
import {
  PERMISSIONS,
  request,
  check,
  RESULTS,
} from 'react-native-permissions';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { registerToken } from '../api/notification.api';
import { maybeDispatchSessionRefresh } from './sessionRefresh.helper';

const NOTIFICATION_CHANNEL_ID = 'portal_alerting_v1';

// Store notification context methods globally for notification handlers
let notificationContextMethods = null;
let activeForegroundUnsubscribe = null;
let activeNotificationOpenedUnsubscribe = null;
let isNotifeeBackgroundHandlerRegistered = false;

// Function to set notification context methods (called from component)
const setNotificationContextMethods = methods => {
  notificationContextMethods = methods;
};

const ensureDefaultChannel = async () => {
  const channelId = await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Portal Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
  return channelId;
};

// Generate or retrieve persistent device ID
const getOrCreateDeviceId = async () => {
  const STORAGE_KEY = 'fcmDeviceId';

  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
      deviceId = uuidv4();
      await AsyncStorage.setItem(STORAGE_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    } else {
      console.log('Retrieved existing device ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    return uuidv4();
  }
};

// Register FCM token with backend
const registerFcmTokenWithBackend = async (
  fcmToken,
  userId,
  tenantId,
  deviceId,
  platform = 'ios',
) => {
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
    const registrationData = { fcmToken, userId, tenantId, deviceId, platform };

    console.log('Registering FCM token with backend:', {
      ...registrationData,
      fcmToken: fcmToken.substring(0, 20) + '...',
    });

    const response = await registerToken(registrationData);

    if (response?.status === 200 || response?.data?.status === 'success') {
      console.log('FCM token registered successfully');
      return true;
    } else {
      console.error(
        'FCM token registration failed:',
        response?.data?.message || 'Unknown error',
      );
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
      // Must stay enabled so FCM payloads that include a `notification` block are
      // shown by the system when the app is backgrounded. Those messages are not
      // delivered to setBackgroundMessageHandler; disabling delegation leaves
      // nothing visible. Data-only messages still use Notifee in index.js.
      await messaging().setNotificationDelegationEnabled(true);
    } catch (error) {
      console.log('Unable to set Android notification delegation', error);
    }
  }

  await ensureDefaultChannel();
  await checkApplicationNotificationsPermission();
  await registerAppWithFcm();

  try {
    token = await messaging().getToken();
    console.log('FCM Token:', token);

    if (token) {
      await AsyncStorage.setItem('fcmToken', token);
      console.log('FCM token stored in AsyncStorage');

      if (userData) {
        const userId = userData.userId;
        const tenantId = userData.tenantId;
        const deviceId = await getOrCreateDeviceId();
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        if (userId && tenantId && deviceId) {
          registerFcmTokenWithBackend(token, userId, tenantId, deviceId, platform)
            .then(success => {
              if (success) {
                console.log('FCM token registration completed successfully');
              } else {
                console.warn(
                  'FCM token registration failed, but token is still available',
                );
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
    token = 'DeviceToken';
  }

  return token;
};

const checkApplicationNotificationsPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        console.log('Notifications permission granted', authStatus);
      } else {
        console.log('Notifications permission not granted', authStatus);
      }
      await notifee.requestPermission();
      return;
    }

    // Android 13+ (API 33): POST_NOTIFICATIONS must be granted for any tray posting.
    // Check first so we do not stack duplicate system dialogs with Notifee.
    if (Platform.Version >= 33) {
      try {
        const current = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        if (current === RESULTS.BLOCKED) {
          console.warn(
            '[notifications] POST_NOTIFICATIONS blocked — enable in Settings → Apps → portal → Notifications',
          );
        } else if (current === RESULTS.DENIED) {
          const afterRequest = await request(
            PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
          );
          console.log('Android POST_NOTIFICATIONS result', afterRequest);
        }
      } catch (e) {
        console.log('Android POST_NOTIFICATIONS check/request error', e);
      }
    }

    // Notifee: aligns permission state and is required for local/display APIs on Android 13+.
    await notifee.requestPermission();

    await messaging().requestPermission();
  } catch (error) {
    console.log('Error requesting notification permissions', error);
  }
};

const registerAppWithFcm = async () => {
  if (Platform.OS === 'ios') {
    try {
      await messaging()
        .registerDeviceForRemoteMessages()
        .then(result => {
          console.log('Device registered for remote messages', result);
        })
        .catch(error => {
          if (
            error?.message?.includes('aps-environment') ||
            error?.code === 'messaging/unknown'
          ) {
            console.warn(
              'Push notifications not configured: Missing "aps-environment" entitlement.',
            );
          } else {
            console.log(
              'Error registering device for remote messages:',
              error.message || error,
            );
          }
        });
    } catch (error) {
      if (
        error?.message?.includes('aps-environment') ||
        error?.code === 'messaging/unknown'
      ) {
        console.warn(
          'Push notifications not configured: Missing "aps-environment" entitlement.',
        );
      } else {
        console.log(
          'Error registering device for remote messages:',
          error.message || error,
        );
      }
    }
  } else {
    console.log('Android device - remote message registration not required');
  }
};

const unRegisterAppWithFcm = async () => {
  if (Platform.OS === 'ios') {
    try {
      await messaging()
        .unregisterDeviceForRemoteMessages()
        .then(result => {
          console.log('Device unregistered for remote messages', result);
        })
        .catch(error => {
          console.log(
            'Error unregistering device for remote messages',
            error.message || error,
          );
        });
    } catch (error) {
      console.log(
        'Error unregistering device for remote messages',
        error.message || error,
      );
    }
  }

  try {
    await messaging().deleteToken();
    console.log('FCM token deleted');
    await AsyncStorage.removeItem('fcmToken');
  } catch (error) {
    console.log(
      'Error deleting FCM token (non-critical):',
      error.message || error,
    );
    try {
      await AsyncStorage.removeItem('fcmToken');
    } catch (storageError) {
      // Ignore storage errors
    }
  }
};

const registerListenerWithFcm = navigationRef => {
  // Prevent duplicate listeners
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

  // ─── Foreground message handler ───────────────────────────────────────────
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received', remoteMessage);

    const notificationTitle =
      remoteMessage?.data?.title ||
      remoteMessage?.notification?.title ||
      'Notification';

    const notificationBody =
      remoteMessage?.data?.body ||
      remoteMessage?.notification?.body ||
      remoteMessage?.data?.message ||
      remoteMessage?.data?.detail?.message ||
      remoteMessage?.data?.details?.message ||
      '';

    const messageId = remoteMessage?.messageId;
    const from = remoteMessage?.from;

    if (notificationTitle || notificationBody) {
      onDisplayNotificaiton(
        notificationTitle,
        notificationBody,
        remoteMessage?.data,
      );

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

    maybeDispatchSessionRefresh();
  });

  // ─── Notifee background event handler (register once) ────────────────────
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

  // ─── App opened from background notification ──────────────────────────────
  activeNotificationOpenedUnsubscribe = messaging().onNotificationOpenedApp(
    remoteMessage => {
      console.log('notification opened app', remoteMessage);
      handleNotificationOpenApp(remoteMessage, navigationRef);
    },
  );

  // ─── App launched from quit state via notification ────────────────────────
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
  maybeDispatchSessionRefresh();

  if (!navigationRef) {
    console.log('Navigation ref not available for notification handling');
    return;
  }

  const navigation = navigationRef.current;
  if (!navigation) {
    console.log('Navigation not ready for notification handling');
    return;
  }

  const data =
    remoteMessageOrNotification?.data ||
    remoteMessageOrNotification?.notification?.data ||
    {};

  const obj = {
    roomId: data?.roomId,
    userInfo: {
      id: data?.detail?.id || data?.details?.id,
      name: data?.detail?.name || data?.details?.name,
      message: data?.detail?.message || data?.details?.message,
    },
  };

  if (obj.roomId) {
    console.log('Navigate to chat with roomId:', obj.roomId);
    // navigation.navigate('Chat', { roomId: obj.roomId });
  } else {
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
    id:
      data?.notificationId || data?.messageId || Date.now().toString(),
    title: title || data?.title || 'Notification',
    body: resolvedBody,
    data: data,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      showTimestamp: true,
      style: {
        type: AndroidStyle.BIGTEXT,
        text: resolvedBody,
      },
      sound: 'default',
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