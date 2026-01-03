import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { StatusBar, View, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './src/store';
import { Colors } from './src/utils/Styles';
import { ApplicationProvider } from './src/contexts/applicationContext';
import { LookupProvider } from './src/contexts/lookupContext';
import { ProfileProvider } from './src/contexts/profileContext';
import LandingPage from './src/modules/landing/LandingPage';
import SplashScreen from './src/modules/splash/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setBearerToken,
  saveUser,
  setHeaders,
} from './src/helpers/auth.helper';
import { deleteVerifier } from './src/helpers/verifier.helper';
import { signInMicrosoftRequest } from './src/api/auth.api';
import WebViewLogin from './src/common/WebViewLogin';
import {
  getFcmToken,
  registerListenerWithFcm,
  unRegisterAppWithFcm,
} from './src/services/firebase.services';
import { validation } from './src/services/auth.services';
import { setSignedIn, setUser, setLoading } from './src/store/slice/auth.slice';

function App() {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(state => state.auth.isSignedIn);
  const isLoading = useSelector(state => state.auth.isLoading);
  const [showWebView, setShowWebView] = useState(false);
  const navigationRef = useRef(null);
  const notificationUnsubscribeRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await dispatch(validation());
      } catch (error) {
        // Error handled silently
      } finally {
        // Ensure splash screen shows for minimum 2.5 seconds
        setTimeout(() => {
          dispatch(setLoading(false));
        }, 2500);
      }
    };
    checkAuth();
  }, [dispatch]);

  // Enhanced deep link handling for authentication callback
  useEffect(() => {
    const handleDeepLink = async event => {
      if (
        event.url &&
        (event.url.startsWith('com.portal://com.portal/ios/callback') ||
          event.url.startsWith('com.portal://com.portal/android/callback'))
      ) {
        try {
          setShowWebView(false);

          if (event.url.includes('error=')) {
            const errorMatch = event.url.match(/error=([^&]+)/);
            const errorDescriptionMatch = event.url.match(
              /error_description=([^&]+)/,
            );
            const error = errorMatch
              ? decodeURIComponent(errorMatch[1])
              : 'Authentication failed';
            const description = errorDescriptionMatch
              ? decodeURIComponent(errorDescriptionMatch[1])
              : 'Unknown error';

            Alert.alert('Login Failed', `${error}: ${description}`);
            return;
          }

          const codeMatch = event.url.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = decodeURIComponent(codeMatch[1]);

            const { getVerifier } = require('./src/helpers/verifier.helper');

            const codeVerifier = await getVerifier();
            if (!codeVerifier) {
              Alert.alert(
                'Error',
                'Code verifier not found. Please try logging in again.',
              );
              return;
            }

            const data = {
              code: code,
              codeVerifier: codeVerifier,
            };

            const response = await signInMicrosoftRequest(data);

            if (response && response.status === 200) {
              if (response.data) {
                const accessToken =
                  response.data.accessToken ||
                  response.data.token ||
                  response.data.access_token;

                if (accessToken) {
                  await setHeaders({ accessToken: accessToken });
                  await AsyncStorage.setItem('token', accessToken);
                  await setBearerToken(accessToken);
                } else {
                  Alert.alert('Error', 'No access token received from server');
                  return;
                }

                if (response.data.user) {
                  await saveUser(response.data.user);
                }
              } else {
                Alert.alert('Error', 'Invalid response from server');
                return;
              }

              await deleteVerifier();

              dispatch(setSignedIn(true));
              if (response.data.user) {
                dispatch(setUser(response.data.user));
              }
            } else {
              const errorMsg =
                response?.data?.errors?.[0] || 'Unable to Sign In';
              Alert.alert('Login Failed', errorMsg);
            }
          } else {
            Alert.alert('Login Failed', 'No authorization code received');
          }
        } catch (error) {
          Alert.alert('Login Error', error.message || 'Authentication failed');
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(url => {
      if (
        url &&
        (url.startsWith('com.portal://com.portal/ios/callback') ||
          url.startsWith('com.portal://com.portal/android/callback'))
      ) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogin = () => {
    setShowWebView(true);
  };

  // Decode JWT token to extract user information
  const decodeJwt = token => {
    try {
      const [, payload] = token.split('.');
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const json = JSON.parse(
        global.atob
          ? atob(padded)
          : Buffer.from(padded, 'base64').toString('utf8'),
      );
      return json;
    } catch {
      return {};
    }
  };

  const handleLoginSuccess = async result => {
    setShowWebView(false);

    if (result.code && result.codeVerifier) {
      try {
        const data = {
          code: result.code,
          codeVerifier: result.codeVerifier,
        };

        const response = await signInMicrosoftRequest(data);

        if (response && response.status >= 200 && response.status < 300) {
          if (response.data) {
            const accessToken =
              response.data.accessToken ||
              response.data.token ||
              response.data.access_token;

            if (accessToken) {
              await setHeaders({ accessToken: accessToken });
              await AsyncStorage.setItem('token', accessToken);
              await setBearerToken(accessToken);
            } else {
              Alert.alert('Error', 'No access token received from server');
              return;
            }

            if (response.data.user) {
              await saveUser(response.data.user);
            }
          } else {
            Alert.alert('Error', 'Invalid response from server');
            return;
          }

          await deleteVerifier();

          dispatch(setSignedIn(true));
          if (response.data.user) {
            dispatch(setUser(response.data.user));
          }
        } else {
          const status = response?.status;
          const errorData = response?.data;

          let errorMsg = 'Unable to Sign In';
          if (errorData) {
            if (
              errorData.errors &&
              Array.isArray(errorData.errors) &&
              errorData.errors.length > 0
            ) {
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
            errorMsg =
              'Authentication endpoint not found. Please check API configuration.';
          }

          Alert.alert('Login Failed', errorMsg);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
      }
    } else if (result.accessToken) {
      try {
        await AsyncStorage.setItem('token', result.accessToken);
        await setBearerToken(result.accessToken);

        if (result.idToken) {
          const claims = decodeJwt(result.idToken);
          const user = {
            name: claims.name || claims.given_name || '',
            email:
              (Array.isArray(claims.emails)
                ? claims.emails[0]
                : claims.email) || '',
            oid: claims.oid || claims.sub,
          };
          await saveUser(user);
          dispatch(setUser(user));
        }

        dispatch(setSignedIn(true));
      } catch (error) {
        Alert.alert('Error', 'Failed to save authentication data');
      }
    } else {
      Alert.alert('Error', 'Invalid authentication response');
    }
  };

  const handleLoginError = error => {
    setShowWebView(false);

    let errorMessage = 'Authentication failed. Please try again.';

    if (error && typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    Alert.alert('Login Failed', errorMessage, [{ text: 'OK' }]);
  };

  const handleWebViewClose = () => {
    setShowWebView(false);
  };

  useEffect(() => {
    if (isSignedIn) {
      const initializeNotifications = async () => {
        try {
          await getFcmToken();

          setTimeout(() => {
            if (navigationRef.current) {
              const unsubscribe = registerListenerWithFcm(navigationRef);
              notificationUnsubscribeRef.current = unsubscribe;
            } else {
              setTimeout(() => {
                if (navigationRef.current) {
                  const unsubscribe = registerListenerWithFcm(navigationRef);
                  notificationUnsubscribeRef.current = unsubscribe;
                }
              }, 1000);
            }
          }, 500);
        } catch (error) {
          // Error handled silently
        }
      };

      initializeNotifications();
    } else {
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
        notificationUnsubscribeRef.current = null;
      }
      unRegisterAppWithFcm().catch(() => {
        // Error handled silently
      });
    }

    return () => {
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
        notificationUnsubscribeRef.current = null;
      }
    };
  }, [isSignedIn]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={
          Platform.OS === 'android' ? Colors.surface : Colors.background
        }
        barStyle="dark-content"
        translucent={false}
        hidden={false}
        animated={true}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
        edges={['top']}
      >
        <StripeProvider
          publishableKey={
            'pk_test_51SBAG4FTlZb0wcbr19eI8nC5u62DfuaUWRVS51VTERBocxSM9JSEs4ubrW57hYTCAHK9d6jrarrT4SAViKFMqKjT00TrEr3PNV'
          }
        >
          {isSignedIn ? (
            <LookupProvider>
              <ApplicationProvider>
                <ProfileProvider>
                  <NavigationContainer ref={navigationRef}>
                    <TabNavigator />
                  </NavigationContainer>
                </ProfileProvider>
              </ApplicationProvider>
            </LookupProvider>
          ) : (
            <LandingPage onLoginPress={handleLogin} />
          )}
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

const AppWrapper = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

export default AppWrapper;
