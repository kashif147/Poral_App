import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';

const isB2CHost = url => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('b2clogin.com') ||
    lower.includes('login.microsoftonline.com') ||
    lower.includes('login.microsoft.com')
  );
};

/**
 * Loads Azure B2C front-channel logout inside the app, then closes when
 * post_logout_redirect (e.g. portal web) or a non-B2C host is hit — never Safari.
 */
const WebViewLogout = ({ url, onDone }) => {
  const finishedRef = useRef(false);
  const timeoutRef = useRef(null);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onDone?.();
  };

  useEffect(() => {
    finishedRef.current = false;
    if (!url) return undefined;

    // Safety: don't leave the modal open if redirect never fires.
    timeoutRef.current = setTimeout(finish, 8000);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [url]);

  const maybeFinishOnUrl = nextUrl => {
    if (!nextUrl) return false;
    // Custom app scheme or any non-B2C host (portal post_logout_redirect).
    if (
      nextUrl.startsWith('com.portal://') ||
      (!isB2CHost(nextUrl) &&
        (nextUrl.startsWith('https://') || nextUrl.startsWith('http://')))
    ) {
      finish();
      return true;
    }
    return false;
  };

  if (!url) {
    return null;
  }

  return (
    <Modal visible animationType="fade" onRequestClose={finish}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.label}>Signing out…</Text>
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onShouldStartLoadWithRequest={request => {
            if (maybeFinishOnUrl(request?.url)) {
              return false;
            }
            return true;
          }}
          onNavigationStateChange={navState => {
            maybeFinishOnUrl(navState?.url);
          }}
          onError={finish}
          onHttpError={finish}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  webview: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
});

export default WebViewLogout;
