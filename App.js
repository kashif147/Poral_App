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
import SplashScreen from './src/modules/splash/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setBearerToken, saveUser, setHeaders } from './src/helpers/auth.helper';
import { deleteVerifier } from './src/helpers/verifier.helper';
import { signInMicrosoftRequest } from './src/api/auth.api';
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
        const isAuthenticated = !!token;
        console.log('Checking auth on mount:', { hasToken: !!token, tokenLength: token?.length || 0, isAuthenticated });
        setIsSignedIn(isAuthenticated);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsSignedIn(false);
      } finally {
        // Ensure splash screen shows for minimum 2.5 seconds
        setTimeout(() => {
          setIsLoading(false);
        }, 2500);
      }
    };
    checkAuth();
  }, []);
 

  // Enhanced deep link handling for authentication callback
  useEffect(() => {
    const handleDeepLink = async (event) => {
      console.log('Deep link received:', event.url);
     
      if (event.url && (event.url.startsWith('com.portal://com.portal/ios/callback') ||
                        event.url.startsWith('com.portal://com.portal/android/callback'))) {
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
            console.log('Authorization code received from deep link');
           
            // Import getVerifier and signInMicrosoftRequest
            const { getVerifier } = require('./src/helpers/verifier.helper');
            const { signInMicrosoftRequest } = require('./src/api/auth.api');
           
            // Get code_verifier from storage
            const codeVerifier = await getVerifier();
            if (!codeVerifier) {
              Alert.alert('Error', 'Code verifier not found. Please try logging in again.');
              return;
            }
           
            // Call signInMicrosoft API with code and codeVerifier (same as web flow)
            console.log('Calling signInMicrosoft API with code and codeVerifier');
            const data = {
              code: code,
              codeVerifier: codeVerifier,
            };
           
            const response = await signInMicrosoftRequest(data);
           
            console.log('signInMicrosoft API response:', {
              status: response?.status,
              hasData: !!response?.data,
              dataKeys: response?.data ? Object.keys(response.data) : [],
            });
           
            if (response && response.status === 200) {
              // API call successful - backend has exchanged code for tokens
              console.log('signInMicrosoft API call successful');
              console.log('Response data:', JSON.stringify(response.data, null, 2));
             
              // Store tokens and user info from API response
              if (response.data) {
                // Check if accessToken exists in response
                const accessToken = response.data.accessToken || response.data.token || response.data.access_token;
                console.log('Access token found:', !!accessToken, accessToken ? 'Token length: ' + accessToken.length : 'No token');
               
                if (accessToken) {
                  // Store token using setHeaders (expects { accessToken: ... })
                  await setHeaders({ accessToken: accessToken });
                 
                  // Also store directly as backup
                  await AsyncStorage.setItem('token', accessToken);
                  await setBearerToken(accessToken);
                 
                  console.log('Token stored successfully');
                } else {
                  console.error('No access token in API response!');
                  Alert.alert('Error', 'No access token received from server');
                  return;
                }
               
                // Save user info if available
                if (response.data.user) {
                  await saveUser(response.data.user);
                  console.log('User info saved:', response.data.user);
                }
              } else {
                console.error('No data in API response!');
                Alert.alert('Error', 'Invalid response from server');
                return;
              }
             
              // Remove code_verifier from storage
              const { deleteVerifier } = require('./src/helpers/verifier.helper');
              await deleteVerifier();
             
              // Verify token was stored
              const storedToken = await AsyncStorage.getItem('token');
              console.log('Verifying token storage:', !!storedToken, storedToken ? 'Token length: ' + storedToken.length : 'No token found');
             
              // Update auth state - this should trigger re-render
              setIsSignedIn(true);
              console.log('✅ User authenticated successfully via deep link, isSignedIn set to:', true);
             
              // Force a re-check of auth state after a brief delay to ensure state is synchronized
              setTimeout(async () => {
                const verifyToken = await AsyncStorage.getItem('token');
                const currentState = verifyToken ? true : false;
                console.log('Verifying auth state after deep link:', { hasToken: !!verifyToken, currentState, isSignedIn });
                if (verifyToken && !currentState) {
                  console.log('Fixing auth state mismatch - setting isSignedIn to true');
                  setIsSignedIn(true);
                }
              }, 100);
            } else {
              const errorMsg = response?.data?.errors?.[0] || 'Unable to Sign In';
              console.error('signInMicrosoft API failed:', errorMsg);
              Alert.alert('Login Failed', errorMsg);
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
      if (url && (url.startsWith('com.portal://com.portal/ios/callback') ||
                  url.startsWith('com.portal://com.portal/android/callback'))) {
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

  // Decode JWT token to extract user information
  const decodeJwt = (token) => {
    try {
      const [, payload] = token.split('.');
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const json = JSON.parse(global.atob ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8'));
      return json;
    } catch {
      return {};
    }
  };

  const handleLoginSuccess = async (result) => {
    console.log('🎉 handleLoginSuccess called in App.js');
    console.log('Result:', {
      hasCode: !!result.code,
      hasCodeVerifier: !!result.codeVerifier,
      hasAccessToken: !!result.accessToken,
      codeLength: result.code?.length || 0,
      codeVerifierLength: result.codeVerifier?.length || 0
    });
    setShowWebView(false);
   
    // Check if we have code and codeVerifier (new flow) or tokens (old flow)
    if (result.code && result.codeVerifier) {
      // New flow: Call signInMicrosoft API with code and codeVerifier
      try {
        console.log('📞 Calling signInMicrosoft API with code and codeVerifier');
        const data = {
          code: result.code,
          codeVerifier: result.codeVerifier,
        };
       
        console.log('📤 Request payload:', {
          hasCode: !!data.code,
          codeLength: data.code?.length || 0,
          hasCodeVerifier: !!data.codeVerifier,
          codeVerifierLength: data.codeVerifier?.length || 0,
        });
       
        const response = await signInMicrosoftRequest(data);
       
        console.log('📥 signInMicrosoft API response received:', {
          status: response?.status,
          hasData: !!response?.data,
          dataKeys: response?.data ? Object.keys(response.data) : [],
          responseData: response?.data,
        });
       
        // Check if response is an error response (from axios interceptor)
        if (response && response.status >= 200 && response.status < 300) {
          // API call successful - backend has exchanged code for tokens
          console.log('✅ signInMicrosoft API call successful');
          console.log('Response data:', JSON.stringify(response.data, null, 2));
         
          // Store tokens and user info from API response
          if (response.data) {
            // Check if accessToken exists in response
            const accessToken = response.data.accessToken || response.data.token || response.data.access_token;
            console.log('Access token found:', !!accessToken, accessToken ? 'Token length: ' + accessToken.length : 'No token');
           
            if (accessToken) {
              // Store token using setHeaders (expects { accessToken: ... })
              await setHeaders({ accessToken: accessToken });
             
              // Also store directly as backup
              await AsyncStorage.setItem('token', accessToken);
              await setBearerToken(accessToken);
             
              console.log('✅ Token stored successfully');
            } else {
              console.error('❌ No access token in API response!');
              Alert.alert('Error', 'No access token received from server');
              return;
            }
           
            // Save user info if available
            if (response.data.user) {
              await saveUser(response.data.user);
              console.log('✅ User info saved:', response.data.user);
            }
          } else {
            console.error('❌ No data in API response!');
            Alert.alert('Error', 'Invalid response from server');
            return;
          }
         
          // Remove code_verifier from storage
          await deleteVerifier();
         
          // Verify token was stored
          const storedToken = await AsyncStorage.getItem('token');
          console.log('🔍 Verifying token storage:', !!storedToken, storedToken ? 'Token length: ' + storedToken.length : 'No token found');
         
          // Update auth state - this should trigger re-render
          console.log('🔄 Setting isSignedIn to true...');
          setIsSignedIn(true);
          console.log('✅ User authenticated successfully via API, isSignedIn set to: true');
        } else {
          // Handle error response
          const status = response?.status;
          const errorData = response?.data;
         
          console.error('❌ signInMicrosoft API failed:', {
            status,
            statusText: response?.statusText,
            data: errorData,
          });
         
          let errorMsg = 'Unable to Sign In';
          if (errorData) {
            if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
              errorMsg = errorData.errors[0];
            } else if (errorData.message) {
              errorMsg = errorData.message;
            } else if (errorData.error) {
              errorMsg = errorData.error;
            } else if (typeof errorData === 'string') {
              errorMsg = errorData;
            }
          }
         
          if (status === 404) {
            errorMsg = 'Authentication endpoint not found. Please check API configuration.';
            console.error('❌ 404 Error - Endpoint might be incorrect or API server might be down');
          }
         
          Alert.alert('Login Failed', errorMsg);
        }
      } catch (error) {
        console.error('❌ Error calling signInMicrosoft API:', error);
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
      }
    } else if (result.accessToken) {
      // Old flow: Direct token exchange (fallback)
      try {
        // Store the token and update auth state
        await AsyncStorage.setItem('token', result.accessToken);
        await setBearerToken(result.accessToken);
       
        // Decode idToken and save user information if available
        if (result.idToken) {
          const claims = decodeJwt(result.idToken);
          console.log('Decoded claims:', claims);
          const user = {
            name: claims.name || claims.given_name || '',
            email: (Array.isArray(claims.emails) ? claims.emails[0] : claims.email) || '',
            oid: claims.oid || claims.sub,
          };
          await saveUser(user);
          console.log('User information saved');
        }
       
        setIsSignedIn(true);
        console.log('User authenticated successfully');
      } catch (error) {
        console.error('Error storing auth data:', error);
        Alert.alert('Error', 'Failed to save authentication data');
      }
    } else {
      console.error('Invalid result from authentication');
      Alert.alert('Error', 'Invalid authentication response');
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
    return <SplashScreen />;
  }

  console.log('App rendering:', { isSignedIn, showWebView, isLoading });

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

