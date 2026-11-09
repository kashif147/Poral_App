/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { maybeDispatchSessionRefresh } from './src/services/sessionRefresh.helper';
import {
  resolveMessageText,
  stringifyNotificationData,
} from './src/helpers/notificationPayload.helper';

const NOTIFICATION_CHANNEL_ID = 'portal_alerting_v1';

// Pre-create channel as early as possible (mirrors native MainApplication channel).
notifee.createChannel({
  id: NOTIFICATION_CHANNEL_ID,
  name: 'Portal Alerts',
  importance: AndroidImportance.HIGH,
  sound: 'default',
  vibration: true,
});

// Data-only / high-priority data messages: RN Firebase invokes this while backgrounded or quit.
// Messages that include a top-level FCM "notification" block are usually displayed by the OS
// instead — MainApplication creates the channel so that path works when the app has never opened.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const { title, body, data } = resolveMessageText(remoteMessage);

  if (!String(title || '').trim() && !String(body || '').trim()) return;

  const channelId = await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Portal Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.displayNotification({
    id:
      data?.notificationId ||
      remoteMessage?.messageId ||
      Date.now().toString(),
    title: title || 'Notification',
    body,
    data: stringifyNotificationData(data),
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      showTimestamp: true,
      smallIcon: 'ic_notification',
      sound: 'default',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: body || '',
      },
      pressAction: { id: 'default' },
    },
  });

  maybeDispatchSessionRefresh();
});

// Keep notifee background events registered at module scope.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notifee background press:', detail?.notification?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
