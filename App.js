import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { StatusBar, View, Platform, Alert, Linking, LogBox } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './src/store';
import { Colors } from './src/utils/Styles';
import { ApplicationProvider } from './src/contexts/applicationContext';
import { LookupProvider } from './src/contexts/lookupContext';
import { ProfileProvider } from './src/contexts/profileContext';
import { NotificationProvider } from './src/contexts/notificationContext';
import NotificationSetup from './src/components/NotificationSetup';
import LandingPage from './src/modules/landing/LandingPage';
import SplashScreen from './src/modules/splash/SplashScreen';
import OnboardingScreen from './src/modules/onboarding/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setBearerToken,
  saveUser,
  setHeaders,
  setRefreshToken,
} from './src/helpers/auth.helper';
import { deleteVerifier } from './src/helpers/verifier.helper';
import { signInMicrosoftRequest } from './src/api/auth.api';
import WebViewLogin from './src/common/WebViewLogin';
import {
  getFcmToken,
  registerListenerWithFcm,
  unRegisterAppWithFcm,
  setNotificationContextMethods,
} from './src/services/firebase.services';
import { validation } from './src/services/auth.services';
import {
  setSignedIn,
  setUser,
  setLoading,
  setDetail,
} from './src/store/slice/auth.slice';
import FlashMessage from 'react-native-flash-message';
import { getMemberDetail } from './src/helpers/decode.helper';

LogBox.ignoreAllLogs(true);

function App() {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(state => state.auth.isSignedIn);
  const isLoading = useSelector(state => state.auth.isLoading);
  const user = useSelector(state => state.auth.user);
  const [showWebView, setShowWebView] = useState(false);
  const [showUnauthSplash, setShowUnauthSplash] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const navigationRef = useRef(null);
  const notificationUnsubscribeRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await dispatch(validation());
      } catch (error) {
        // Error handled silently
      } finally {
        // Keep global loading at least 2.5s on initial auth bootstrap
        setTimeout(() => {
          dispatch(setLoading(false));
        }, 2500);
        setIsAuthChecked(true);
      }
    };
    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!isSignedIn) {
      // Show splash for unauthenticated path before landing page
      setShowUnauthSplash(true);
      const timer = setTimeout(() => {
        setShowUnauthSplash(false);
      }, 2500);

      return () => clearTimeout(timer);
    }

    setShowUnauthSplash(false);
  }, [isAuthChecked, isSignedIn]);

  // Enhanced deep link handling for authentication callback
  useEffect(() => {
    const handleDeepLink = async event => {
      if (
        event.url &&
        (event.url.startsWith('com.portal://com.portal/ios/callback') ||
          event.url.startsWith('com.portal://com.portal/android/callback'))
      ) {
        dispatch(setLoading(true));
        setShowWebView(false);
        try {
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

            dispatch(setLoading(false));
            Alert.alert('Login Failed', `${error}: ${description}`);
            return;
          }

          const codeMatch = event.url.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = decodeURIComponent(codeMatch[1]);

            const { getVerifier } = require('./src/helpers/verifier.helper');

            const codeVerifier = await getVerifier();
            if (!codeVerifier) {
              dispatch(setLoading(false));
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
                  dispatch(setLoading(false));
                  Alert.alert('Error', 'No access token received from server');
                  return;
                }

                if (response.data.user) {
                  await saveUser(response.data.user);
                }

                const refreshToken =
                  response.data.refreshToken || response.data.refresh_token;
                if (refreshToken) {
                  await setRefreshToken(refreshToken);
                }
              } else {
                dispatch(setLoading(false));
                Alert.alert('Error', 'Invalid response from server');
                return;
              }

              await deleteVerifier();

              dispatch(setSignedIn(true));
              if (response.data.user) {
                dispatch(setUser(response.data.user));
              }
            } else {
              dispatch(setLoading(false));
              const errorMsg =
                response?.data?.errors?.[0] || 'Unable to Sign In';
              Alert.alert('Login Failed', errorMsg);
            }
          } else {
            dispatch(setLoading(false));
            Alert.alert('Login Failed', 'No authorization code received');
          }
        } catch (error) {
          dispatch(setLoading(false));
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
      dispatch(setLoading(true));
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
              dispatch(setLoading(false));
              Alert.alert('Error', 'No access token received from server');
              return;
            }

            if (response.data.user) {
              await saveUser(response.data.user);
            }

            const refreshToken =
              response.data.refreshToken || response.data.refresh_token;
            if (refreshToken) {
              await setRefreshToken(refreshToken);
            }
          } else {
            dispatch(setLoading(false));
            Alert.alert('Error', 'Invalid response from server');
            return;
          }

          await deleteVerifier();

          dispatch(setSignedIn(true));
          if (response.data.user) {
            dispatch(setUser(response.data.user));
          }
          try {
            const memberDetail = await getMemberDetail();
            dispatch(setDetail(memberDetail));
          } catch (e) {
            // Token may not be readable yet or decode failed; leave userDetail for validation to set
          }
        } else {
          dispatch(setLoading(false));
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
        dispatch(setLoading(false));
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
      }
    } else if (result.accessToken) {
      dispatch(setLoading(true));
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
        dispatch(setLoading(false));
        Alert.alert('Error', 'Failed to save authentication data');
      }
    } else {
      dispatch(setLoading(false));
      Alert.alert('Error', 'Invalid authentication response');
    }
  };

  const handleLoginError = error => {
    setShowWebView(false);

    const raw =
      typeof error === 'string' ? error : (error?.message || '').toString();
    if (
      raw.includes('AADB2C90091') ||
      raw.includes('The user has cancelled entering self-asserted information')
    ) {
      console.log('User cancelled login, suppressing error alert');
      return;
    }

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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Initialize FCM when user is signed in
  useEffect(() => {
    if (isSignedIn) {
      const initializeNotifications = async () => {
        try {
          console.log('Initializing FCM notifications...');
          
          // Extract user data from Redux state
          const userData = user || {};
          const userId = userData?.id || userData?._id;
          const tenantId = userData?.tenantId || userData?.userTenantId;
          
          console.log('User data for FCM registration:', {
            hasUserId: !!userId,
            hasTenantId: !!tenantId,
            userId: userId ? userId.substring(0, 10) + '...' : 'N/A',
            tenantId: tenantId ? tenantId.substring(0, 10) + '...' : 'N/A',
          });
          
          // Prepare user data for token registration
          const userDataForRegistration = userId && tenantId ? { userId, tenantId } : null;
          
          const token = await getFcmToken(userDataForRegistration);
          console.log('FCM Token retrieved in App:', token);
          
          // Also log from AsyncStorage
          const storedToken = await AsyncStorage.getItem('fcmToken');
          console.log('FCM Token from AsyncStorage:', storedToken);

          // Wait a bit for navigation to be ready
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
          console.log('Error initializing notifications', error);
          console.error('FCM Initialization Error:', error);
        }
      };

      initializeNotifications();
    } else {
      // Clean up on logout
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
  }, [isSignedIn, user]);

  if (isLoading || (!isSignedIn && showUnauthSplash)) {
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
            <NotificationProvider>
              <LookupProvider>
                <ApplicationProvider>
                  <ProfileProvider>
                    <NotificationSetup />
                    <NavigationContainer ref={navigationRef}>
                      <TabNavigator />
                    </NavigationContainer>
                  </ProfileProvider>
                </ApplicationProvider>
              </LookupProvider>
            </NotificationProvider>
          ) : showOnboarding ? (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          ) : (
            <LandingPage onLoginPress={handleLogin} />
          )}
          <WebViewLogin
            visible={showWebView}
            onClose={handleWebViewClose}
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
          <FlashMessage position="top" />
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
