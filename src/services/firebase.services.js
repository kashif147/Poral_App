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
import {
  resolveMessageText,
  stringifyNotificationData,
} from '../helpers/notificationPayload.helper';

const NOTIFICATION_CHANNEL_ID = 'portal_alerting_v1';

// Store notification context methods globally for notification handlers
let notificationContextMethods = null;
let activeForegroundUnsubscribe = null;
let activeNotificationOpenedUnsubscribe = null;
let activeTokenRefreshUnsubscribe = null;
let isNotifeeBackgroundHandlerRegistered = false;
/** Last successful auth ids used to re-register when FCM rotates the token. */
let lastRegistrationUserData = null;

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
    const ok =
      (response?.status >= 200 && response?.status < 300) ||
      response?.data?.status === 'success' ||
      response?.data?.success === true;

    if (ok) {
      console.log('FCM token registered successfully');
      return true;
    }

    console.error(
      'FCM token registration failed:',
      response?.data?.message || response?.data || 'Unknown error',
    );
    return false;
  } catch (error) {
    console.error('Error registering FCM token with backend:', error);
    return false;
  }
};

const persistAndRegisterToken = async (token, userData = null) => {
  if (!token || token === 'DeviceToken') {
    return false;
  }

  await AsyncStorage.setItem('fcmToken', token);

  const effectiveUser = userData || lastRegistrationUserData;
  if (!effectiveUser?.userId || !effectiveUser?.tenantId) {
    console.log(
      'User data not available yet — FCM token stored; backend register deferred',
    );
    return false;
  }

  lastRegistrationUserData = {
    userId: effectiveUser.userId,
    tenantId: effectiveUser.tenantId,
  };

  const deviceId = await getOrCreateDeviceId();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  return registerFcmTokenWithBackend(
    token,
    effectiveUser.userId,
    effectiveUser.tenantId,
    deviceId,
    platform,
  );
};

/** iOS: FCM tokens obtained before APNs is ready often cannot receive pushes. */
const waitForApnsToken = async (retries = 12, delayMs = 500) => {
  if (Platform.OS !== 'ios') {
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const apnsToken = await messaging().getAPNSToken();
      if (apnsToken) {
        console.log(`APNs token ready (attempt ${attempt})`);
        return true;
      }
    } catch (error) {
      console.log('getAPNSToken error', error?.message || error);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.warn(
    '[notifications] APNs token missing after wait — iOS push will not deliver until device is registered (use a real device, enable Push capability, allow notifications)',
  );
  return false;
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
  // Permission first, then remote registration, then wait for APNs (iOS), then FCM token.
  await checkApplicationNotificationsPermission();
  await registerAppWithFcm();
  await waitForApnsToken();

  // Keep device token in sync with backend when FCM rotates it.
  if (!activeTokenRefreshUnsubscribe) {
    activeTokenRefreshUnsubscribe = messaging().onTokenRefresh(async newToken => {
      console.log('FCM token refreshed');
      try {
        await persistAndRegisterToken(newToken, lastRegistrationUserData);
      } catch (error) {
        console.error('FCM token refresh registration error:', error);
      }
    });
  }

  try {
    token = await messaging().getToken();
    console.log('FCM Token:', token);

    if (token) {
      const registered = await persistAndRegisterToken(token, userData);
      if (registered) {
        console.log('FCM token registration completed successfully');
      } else if (userData?.userId && userData?.tenantId) {
        console.warn(
          'FCM token registration failed, but token is still available locally',
        );
      }
    } else {
      console.log('No FCM token received');
    }
  } catch (error) {
    console.log('Error getting FCM token', error);
    token = null;
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
  if (Platform.OS !== 'ios') {
    console.log('Android device - remote message registration not required');
    return;
  }

  try {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
      console.log('Device registered for remote messages');
    } else {
      console.log('Device already registered for remote messages');
    }
  } catch (error) {
    if (
      error?.message?.includes('aps-environment') ||
      error?.code === 'messaging/unknown'
    ) {
      console.warn(
        'Push notifications not configured: Missing "aps-environment" entitlement. Enable Push Notifications in Xcode Signing & Capabilities.',
      );
    } else {
      console.log(
        'Error registering device for remote messages:',
        error.message || error,
      );
    }
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

  lastRegistrationUserData = null;
  if (activeTokenRefreshUnsubscribe) {
    activeTokenRefreshUnsubscribe();
    activeTokenRefreshUnsubscribe = null;
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

    const { title, body, data } = resolveMessageText(remoteMessage);
    const notificationTitle = title || 'Notification';
    const notificationBody = body || '';
    const messageId = remoteMessage?.messageId;
    const from = remoteMessage?.from;

    if (String(notificationTitle).trim() || String(notificationBody).trim()) {
      await onDisplayNotificaiton(notificationTitle, notificationBody, data);

      // addNotification already increments unreadCount — do not double-count.
      if (notificationContextMethods?.addNotification) {
        notificationContextMethods.addNotification({
          messageId:
            data?.notificationId || messageId || Date.now().toString(),
          from,
          title: notificationTitle,
          body: notificationBody,
          read: false,
          timestamp: new Date().toISOString(),
          data: data || {},
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
    (typeof data?.detail === 'object' && data?.detail?.message) ||
    (typeof data?.details === 'object' && data?.details?.message) ||
    '';

  await notifee.displayNotification({
    id: data?.notificationId || data?.messageId || Date.now().toString(),
    title: title || data?.title || 'Notification',
    body: resolvedBody,
    data: stringifyNotificationData(data),
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      showTimestamp: true,
      smallIcon: 'ic_notification',
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