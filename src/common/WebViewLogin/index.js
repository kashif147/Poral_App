import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewLogin = ({ visible, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(true);

  const getAuthUrl = () => {
    const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309';
    const tenant = 'projectshellAB2C.onmicrosoft.com';
    const policy = 'B2C_1_projectshell';
    const b2cDomain = 'projectshellAB2C.b2clogin.com';
    const redirectUri = 'com.portal://com.portal/ios/callback';

    const authUrl = new URL(`https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/authorize`);
    
    const params = {
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile offline_access',
      response_mode: 'query'
    };
    
    Object.keys(params).forEach(key => 
      authUrl.searchParams.append(key, params[key])
    );
    
    console.log('Auth URL:', authUrl.toString());
    return authUrl.toString();
  };

  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    console.log('Navigation changed to:', url);
    
    // Check if this is our redirect URL
    if (url.startsWith('com.portal://com.portal/ios/callback')) {
      console.log('Redirect URL detected, stopping WebView and letting system handle it');
      
      // Close the WebView immediately
      onClose();
      
      // Let the system handle the URL scheme
      // The deep link handler in App.js will process this
      return false; // Prevent WebView from loading this URL
    }
    
    // Allow all other URLs to load normally
    return true;
  };

  const onShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    console.log('Should start loading:', url);
    
    // If it's our redirect URL, don't let WebView handle it
    if (url.startsWith('com.portal://com.portal/ios/callback')) {
      console.log('Blocking redirect URL in WebView, letting system handle it');
      onClose();
      return false;
    }
    
    return true;
  };

  const exchangeCodeForTokens = async (code) => {
    const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309';
    const tenant = 'projectshellAB2C.onmicrosoft.com';
    const policy = 'B2C_1_projectshell';
    const b2cDomain = 'projectshellAB2C.b2clogin.com';
    const redirectUri = 'com.portal://com.portal/ios/callback';

    const tokenUrl = `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/token`;
    
    console.log('Exchanging code for tokens at:', tokenUrl);
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid profile offline_access'
        }).toString()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status}`);
      }
      
      const tokenData = await response.json();
      console.log('Token exchange successful');
      
      return {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        <WebView
          source={{ uri: getAuthUrl() }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onLoadStart={() => {
            console.log('WebView loading started');
            setLoading(true);
          }}
          onLoadEnd={() => {
            console.log('WebView loading finished');
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            onError('Failed to load authentication page. Please check your internet connection.');
          }}
          style={styles.webview}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});

export default WebViewLogin;