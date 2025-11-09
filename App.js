import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { StatusBar, View, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Colors } from './src/utils/Styles';
import { ApplicationProvider } from './src/contexts/applicationContext';
import { LookupProvider } from './src/contexts/lookupContext';
import LandingPage from './src/modules/landing/LandingPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBearerToken } from './src/helpers/auth.helper';
import { createPolicyEvaluationRequest } from './src/api/policy.evaluation.api';
import WebViewLogin from './src/common/WebViewLogin'; 

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsSignedIn(!!token);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Enhanced deep link handling for authentication callback
  useEffect(() => {
    const handleDeepLink = async (event) => {
      console.log('Deep link received:', event.url);
      
      if (event.url.startsWith('com.portal://com.portal/ios/callback')) {
        console.log('Processing authentication callback...');
        
        try {
          // Close WebView if it's open
          setShowWebView(false);
          
          if (event.url.includes('error=')) {
            const errorMatch = event.url.match(/error=([^&]+)/);
            const errorDescriptionMatch = event.url.match(/error_description=([^&]+)/);
            const error = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Authentication failed';
            const description = errorDescriptionMatch ? decodeURIComponent(errorDescriptionMatch[1]) : 'Unknown error';
            
            console.error('Auth error from Azure:', error, description);
            Alert.alert('Login Failed', `${error}: ${description}`);
            return;
          }
          
          // Extract authorization code from URL
          const codeMatch = event.url.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = decodeURIComponent(codeMatch[1]);
            console.log('Authorization code received:', code);
            
            // Exchange code for tokens
            const tokens = await exchangeCodeForTokens(code);
            
            if (tokens.accessToken) {
              // Store the token and update auth state
              await AsyncStorage.setItem('token', tokens.accessToken);
              await setBearerToken(tokens.accessToken);
              setIsSignedIn(true);
              console.log('User authenticated successfully via deep link');
            }
          } else {
            console.log('No authorization code found in URL');
            Alert.alert('Login Failed', 'No authorization code received');
          }
        } catch (error) {
          console.error('Error processing deep link:', error);
          Alert.alert('Login Error', error.message || 'Authentication failed');
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('com.portal://com.portal/ios/callback')) {
        console.log('App opened with deep link:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Token exchange function
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

  const handleLogin = () => {
    console.log('Login button pressed, opening WebView...');
    setShowWebView(true);
  };

  const handleLoginSuccess = async (result) => {
    console.log('B2C login successful:', result);
    setShowWebView(false);
    
    if (result.accessToken) {
      try {
        // Store the token and update auth state
        await AsyncStorage.setItem('token', result.accessToken);
        await setBearerToken(result.accessToken);
        setIsSignedIn(true);
        
        console.log('User authenticated successfully');
      } catch (error) {
        console.error('Error storing auth data:', error);
        Alert.alert('Error', 'Failed to save authentication data');
      }
    }
  };

  const handleLoginError = (error) => {
    console.error('B2C login failed:', error);
    setShowWebView(false);
    
    let errorMessage = 'Authentication failed. Please try again.';
    
    if (error && typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    Alert.alert(
      'Login Failed',
      errorMessage,
      [{ text: 'OK' }]
    );
  };

  const handleWebViewClose = () => {
    console.log('WebView closed by user');
    setShowWebView(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={Platform.OS === 'android' ? Colors.surface : Colors.background}
        barStyle='dark-content'
        translucent={false}
        hidden={false}
        animated={true}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
        <StripeProvider publishableKey={'pk_test_51SBAG4FTlZb0wcbr19eI8nC5u62DfuaUWRVS51VTERBocxSM9JSEs4ubrW57hYTCAHK9d6jrarrT4SAViKFMqKjT00TrEr3PNV'}>
          {isSignedIn ? (
            <LookupProvider>
              <ApplicationProvider>
                <NavigationContainer>
                  <TabNavigator />
                </NavigationContainer>
              </ApplicationProvider>
            </LookupProvider>
          ) : (
            <LandingPage onLoginPress={handleLogin} />
          )}
          
          {/* WebView Login Modal */}
          <WebViewLogin
            visible={showWebView}
            onClose={handleWebViewClose}
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </StripeProvider>
      </SafeAreaView>
    </View>
  );
}

export default App;