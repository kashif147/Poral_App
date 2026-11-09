/**
 * FCM data values are always strings. Backends often nest title/body as JSON
 * inside detail / body / payload — parse those so tray + in-app text resolve.
 */
export function parseMaybeJson(value) {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Resolve title/body for data-only or hybrid FCM payloads. */
export function resolveMessageText(remoteMessage) {
  const data = remoteMessage?.data || {};
  const fromDataJson =
    parseMaybeJson(data.detail) ||
    parseMaybeJson(data.details) ||
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
    (typeof data.detail === 'object' && data.detail?.message) ||
    (typeof data.details === 'object' && data.details?.message) ||
    fromDataJson?.body ||
    fromDataJson?.message ||
    remoteMessage?.notification?.body ||
    '';

  if (typeof body === 'object' && body?.message) {
    body = body.message;
  }

  // If body was a JSON string that parseMaybeJson already expanded, prefer message.
  if (typeof body === 'string') {
    const bodyJson = parseMaybeJson(body);
    if (bodyJson?.message) body = bodyJson.message;
    else if (bodyJson?.body) body = bodyJson.body;
  }

  return {
    title: typeof title === 'string' ? title : '',
    body: typeof body === 'string' ? body : '',
    data,
  };
}

/** Notifee Android requires notification data values to be strings. */
export function stringifyNotificationData(data = {}) {
  const out = {};
  Object.keys(data || {}).forEach(key => {
    const value = data[key];
    if (value === undefined || value === null) return;
    out[key] = typeof value === 'string' ? value : JSON.stringify(value);
  });
  return out;
}
