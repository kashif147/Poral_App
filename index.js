/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, AndroidVisibility, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const NOTIFICATION_CHANNEL_ID = 'portal_default_v2';

// Pre-create channel as early as possible.
notifee.createChannel({
  id: NOTIFICATION_CHANNEL_ID,
  name: 'Portal Notifications',
  importance: AndroidImportance.HIGH,
});

// Handle FCM messages when app is in background/quit.
// This is required for data-only payloads on Android.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // For payloads that already include `notification`, let Android/Firebase render it.
  // Rendering again with Notifee creates duplicates and Android starts muting them.
  if (remoteMessage?.notification) {
    return;
  }

  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    'Notification';
  const body =
    remoteMessage?.notification?.body ||
    remoteMessage?.data?.body ||
    remoteMessage?.data?.message ||
    remoteMessage?.data?.detail?.message ||
    remoteMessage?.data?.details?.message ||
    '';
  const data = remoteMessage?.data || {};

  if (title || body) {
    const channelId = await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Portal Notifications',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      id: data?.notificationId || remoteMessage?.messageId || Date.now().toString(),
      title: title || 'Notification',
      body: body || '',
      data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        showTimestamp: true,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body || '',
        },
        pressAction: { id: 'default' },
      },
    });
  }
});

// Keep notifee background events registered at module scope.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notifee background press:', detail?.notification?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
