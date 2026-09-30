import 'react-native-get-random-values';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigation';
import { StatusBar, View, Platform, Alert, Linking, LogBox, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import {
  clearB2CAuthTransaction,
  getB2CAuthTransaction,
} from './src/helpers/verifier.helper';
import { signInMicrosoftRequest } from './src/api/auth.api';
import WebViewLogin from './src/common/WebViewLogin';
import WebViewLogout from './src/common/WebViewLogout';
import { registerB2CLogoutHandler } from './src/helpers/b2cLogoutBridge';
import {
  B2C_FLOW_STORAGE_KEY,
  extractOAuthParam,
} from './src/helpers/b2cMobileAuthorize';
import {
  getFcmToken,
  checkApplicationNotificationsPermission,
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

const LOGIN_STATUS_STORAGE_KEY = 'login';

function App() {
  const dispatch = useDispatch();
  const isSignedIn = useSelector(state => state.auth.isSignedIn);
  const isLoading = useSelector(state => state.auth.isLoading);
  const [showWebView, setShowWebView] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [b2cLogoutUrl, setB2cLogoutUrl] = useState(null);
  const [showUnauthSplash, setShowUnauthSplash] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const navigationRef = useRef(null);
  const notificationUnsubscribeRef = useRef(null);
  const notificationsInitializedRef = useRef(false);
  const notificationSetupTimeoutRef = useRef(null);
  const notificationRetryTimeoutRef = useRef(null);
  const processedAuthCodeRef = useRef(null);

  const saveFlowToStorage = flow => {
    AsyncStorage.setItem(B2C_FLOW_STORAGE_KEY, flow).catch(() => {});
  };

  const clearAuthTransaction = async () => {
    await clearB2CAuthTransaction();
    await AsyncStorage.removeItem(B2C_FLOW_STORAGE_KEY);
  };

  /** Required backend contract: code + codeVerifier + state only. */
  const buildAuthPayload = async (code, codeVerifier, state) => {
    const transaction = await getB2CAuthTransaction();
    return {
      code,
      codeVerifier: codeVerifier || transaction.codeVerifier,
      state: state || transaction.state,
    };
  };

  const finalizeSuccessfulAuth = async () => {
    await clearAuthTransaction();
    await AsyncStorage.setItem(LOGIN_STATUS_STORAGE_KEY, 'true');
  };

  const mapAuthErrorMessage = (response, fallback = 'Unable to Sign In') => {
    const status = response?.status;
    if (status === 400) {
      return 'Your sign-in session expired or was invalid. Please try again.';
    }
    if (status === 401) {
      return 'Authentication failed. Please try signing in again.';
    }
    return fallback;
  };

  // Lock status bar globally — screens must not override this.
  const applyStatusBar = useCallback(() => {
    StatusBar.setBarStyle('dark-content', true);
    StatusBar.setHidden(false);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(Colors.surface);
      StatusBar.setTranslucent(false);
    }
  }, []);

  // In-app B2C logout WebView (avoids Safari + portal-dev.vercel.app).
  useEffect(() => {
    return registerB2CLogoutHandler(setB2cLogoutUrl);
  }, []);

  useEffect(() => {
    applyStatusBar();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        applyStatusBar();
      }
    });
    return () => subscription.remove();
  }, [applyStatusBar]);

  // Android 13+: request POST_NOTIFICATIONS on first launch so delivery is not gated
  // until after login (Samsung often hides this under Settings → Notifications, not App permissions).
  useEffect(() => {
    if (Platform.OS === 'android') {
      checkApplicationNotificationsPermission().catch(() => {});
    }
  }, []);

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

  // Deep link / app-link handling for authentication callback
  useEffect(() => {
    const isAuthCallbackUrl = url => {
      if (!url) return false;
      if (
        url.startsWith('com.portal://com.portal/ios/callback') ||
        url.startsWith('com.portal://com.portal/android/callback')
      ) {
        return true;
      }
      // Backend MS_REDIRECT_URI is HTTPS — also accept any callback carrying code+state.
      return (
        (url.startsWith('https://') || url.startsWith('http://')) &&
        url.includes('code=') &&
        url.includes('state=')
      );
    };

    const handleDeepLink = async event => {
      const url = event?.url;
      if (!isAuthCallbackUrl(url)) return;

      dispatch(setLoading(true));
      setShowWebView(false);
      try {
        if (url.includes('error=')) {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert(
            'Login Failed',
            'Sign-in was cancelled or failed. Please try again.',
          );
          return;
        }

        const code = extractOAuthParam(url, 'code');
        const state = extractOAuthParam(url, 'state');

        if (!code) {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert('Login Failed', 'No authorization code received');
          return;
        }

        if (processedAuthCodeRef.current === code) {
          dispatch(setLoading(false));
          return;
        }
        processedAuthCodeRef.current = code;

        const transaction = await getB2CAuthTransaction();
        const codeVerifier = transaction.codeVerifier;
        if (!codeVerifier || !state) {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert(
            'Error',
            'Your sign-in session expired or was incomplete. Please try again.',
          );
          return;
        }

        if (transaction.state && transaction.state !== state) {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert(
            'Error',
            'Your sign-in session was invalid. Please try signing in again.',
          );
          return;
        }

        const data = await buildAuthPayload(code, codeVerifier, state);
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
              await clearAuthTransaction();
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
            await clearAuthTransaction();
            dispatch(setLoading(false));
            Alert.alert('Error', 'Invalid response from server');
            return;
          }

          dispatch(setSignedIn(true));
          if (response.data.user) {
            dispatch(setUser(response.data.user));
          }
          await finalizeSuccessfulAuth();
          const memberDetail = await getMemberDetail();
          await registerFcmOnAuth(response.data.user, memberDetail);
        } else {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert('Login Failed', mapAuthErrorMessage(response));
        }
      } catch (error) {
        await clearAuthTransaction();
        dispatch(setLoading(false));
        Alert.alert('Login Error', 'Authentication failed. Please try again.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(url => {
      if (isAuthCallbackUrl(url)) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const startInAppAuth = mode => {
    setAuthMode(mode);
    saveFlowToStorage(mode);
    setShowWebView(true);
  };

  const handleLogin = () => {
    // Keep auth inside the app WebView so the HTTPS B2C redirect (MS_REDIRECT_URI)
    // is intercepted here with the matching codeVerifier. Opening Safari leaves the
    // callback on the web portal without the mobile PKCE transaction.
    startInAppAuth('signin');
  };

  const handleGoogleLogin = () => {
    startInAppAuth('gmail');
  };

  const handleSignUp = () => {
    startInAppAuth('signup');
  };

  const registerFcmOnAuth = async (authenticatedUser, memberDetail) => {
    try {
      const userData = authenticatedUser || {};
      const tokenData = memberDetail || {};
      const userId =
        userData?.id ||
        userData?._id ||
        tokenData?.id ||
        tokenData?._id ||
        tokenData?.userId ||
        tokenData?.uid ||
        tokenData?.oid ||
        tokenData?.sub;
      const tenantId =
        userData?.tenantId ||
        userData?.userTenantId ||
        tokenData?.tenantId ||
        tokenData?.userTenantId ||
        tokenData?.tid;
      const userDataForRegistration =
        userId && tenantId ? { userId, tenantId } : null;

      if (!userDataForRegistration) {
        console.warn('FCM registration skipped: userId/tenantId missing', {
          hasUserId: !!userId,
          hasTenantId: !!tenantId,
        });
      }

      await getFcmToken(userDataForRegistration);
    } catch (error) {
      console.log('Error registering FCM after auth', error);
    }
  };

  const handleLoginSuccess = async result => {
    setShowWebView(false);

    if (result.code && result.codeVerifier) {
      dispatch(setLoading(true));
      try {
        const data = await buildAuthPayload(
          result.code,
          result.codeVerifier,
          result.state,
        );
        if (!data.state) {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert(
            'Error',
            'Your sign-in session was incomplete. Please try again.',
          );
          return;
        }

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
              await clearAuthTransaction();
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
            await clearAuthTransaction();
            dispatch(setLoading(false));
            Alert.alert('Error', 'Invalid response from server');
            return;
          }

          dispatch(setSignedIn(true));
          if (response.data.user) {
            dispatch(setUser(response.data.user));
          }
          await finalizeSuccessfulAuth();
          try {
            const memberDetail = await getMemberDetail();
            await registerFcmOnAuth(response.data.user, memberDetail);
            dispatch(setDetail(memberDetail));
          } catch (e) {
            // Token may not be readable yet or decode failed; leave userDetail for validation to set
          }
        } else {
          await clearAuthTransaction();
          dispatch(setLoading(false));
          Alert.alert('Login Failed', mapAuthErrorMessage(response));
        }
      } catch (error) {
        await clearAuthTransaction();
        dispatch(setLoading(false));
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
      }
    } else {
      await clearAuthTransaction();
      dispatch(setLoading(false));
      Alert.alert('Error', 'Invalid authentication response');
    }
  };

  const handleLoginError = async error => {
    setShowWebView(false);
    await clearAuthTransaction();

    const raw =
      typeof error === 'string' ? error : (error?.message || '').toString();
    if (
      raw.includes('AADB2C90091') ||
      raw.includes('The user has cancelled entering self-asserted information')
    ) {
      return;
    }

    Alert.alert('Login Failed', 'Authentication failed. Please try again.', [
      { text: 'OK' },
    ]);
  };

  const handleWebViewClose = async () => {
    setShowWebView(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Initialize FCM when user is signed in
  useEffect(() => {
    if (isSignedIn) {
      if (notificationsInitializedRef.current) {
        return undefined;
      }
      notificationsInitializedRef.current = true;

      const initializeNotifications = async () => {
        try {
          console.log('Initializing FCM notifications...');

          // Wait a bit for navigation to be ready
          notificationSetupTimeoutRef.current = setTimeout(() => {
            if (navigationRef.current) {
              const unsubscribe = registerListenerWithFcm(navigationRef);
              notificationUnsubscribeRef.current = unsubscribe;
            } else {
              notificationRetryTimeoutRef.current = setTimeout(() => {
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
      notificationsInitializedRef.current = false;
      // Clean up on logout
      if (notificationSetupTimeoutRef.current) {
        clearTimeout(notificationSetupTimeoutRef.current);
        notificationSetupTimeoutRef.current = null;
      }
      if (notificationRetryTimeoutRef.current) {
        clearTimeout(notificationRetryTimeoutRef.current);
        notificationRetryTimeoutRef.current = null;
      }
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
        notificationUnsubscribeRef.current = null;
      }
      // unRegisterAppWithFcm().catch(() => {
      //   // Error handled silently
      // });
    }

    return () => {
      if (notificationSetupTimeoutRef.current) {
        clearTimeout(notificationSetupTimeoutRef.current);
        notificationSetupTimeoutRef.current = null;
      }
      if (notificationRetryTimeoutRef.current) {
        clearTimeout(notificationRetryTimeoutRef.current);
        notificationRetryTimeoutRef.current = null;
      }
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
        notificationUnsubscribeRef.current = null;
      }
    };
  }, [isSignedIn]);

  const appStatusBar = (
    <StatusBar
      backgroundColor={
        Platform.OS === 'android' ? Colors.surface : Colors.background
      }
      barStyle="dark-content"
      translucent={false}
      hidden={false}
      animated={false}
    />
  );

  if (isLoading || (!isSignedIn && showUnauthSplash)) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          {appStatusBar}
          <SplashScreen />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {appStatusBar}
        <SafeAreaView
          style={{ flex: 1, backgroundColor: Colors.background }}
          edges={[]}
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
                      <NavigationContainer
                        ref={navigationRef}
                        onReady={applyStatusBar}
                        onStateChange={applyStatusBar}
                      >
                        <TabNavigator />
                      </NavigationContainer>
                    </ProfileProvider>
                  </ApplicationProvider>
                </LookupProvider>
              </NotificationProvider>
            ) : showOnboarding ? (
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            ) : (
              <LandingPage
                onLoginPress={handleLogin}
                onGoogleLoginPress={handleGoogleLogin}
                onSignUpPress={handleSignUp}
              />
            )}
            <WebViewLogin
              visible={showWebView}
              authMode={authMode}
              onClose={handleWebViewClose}
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />
            <WebViewLogout
              url={b2cLogoutUrl}
              onDone={() => setB2cLogoutUrl(null)}
            />
            <FlashMessage position="top" />
          </StripeProvider>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
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
