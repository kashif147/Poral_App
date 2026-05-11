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

const NOTIFICATION_CHANNEL_ID = 'portal_alerting_v1';

function parseMaybeJson(value) {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Resolve title/body for data-only or hybrid payloads (nested JSON is common from backends). */
function resolveMessageText(remoteMessage) {
  const data = remoteMessage?.data || {};
  const fromDataJson =
    parseMaybeJson(data.detail) ||
    parseMaybeJson(data.body) ||
    parseMaybeJson(data.payload);

  let title =
    data.title ||
    fromDataJson?.title ||
    remoteMessage?.notification?.title ||
    '';

  let body =
    data.body ||
    data.message ||
    data.detail?.message ||
    data.details?.message ||
    fromDataJson?.body ||
    fromDataJson?.message ||
    remoteMessage?.notification?.body ||
    '';

  if (typeof body === 'object' && body?.message) {
    body = body.message;
  }

  return {
    title: typeof title === 'string' ? title : '',
    body: typeof body === 'string' ? body : '',
    data,
  };
}

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
    data,
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
});

// Keep notifee background events registered at module scope.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notifee background press:', detail?.notification?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);