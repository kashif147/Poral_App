import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { generatePKCE } from '../../helpers/crypt.helper';
import { setVerifier, getVerifier } from '../../helpers/verifier.helper';

const POLICY_BY_MODE = {
  signin: 'B2C_1_projectshell_signin',
  signup: 'B2C_1_projectshell_signup',
  gmail: 'B2C_1_projectshell_signup_signin_gmail',
  default: 'B2C_1_projectshell',
};

const WebViewLogin = ({ visible, authMode = 'signin', onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);
  const [codeVerifier, setCodeVerifier] = useState(null);
  const webViewRef = React.useRef(null);

  const getRedirectUri = () => {
    return Platform.OS === 'android'
      ? 'com.portal://com.portal/android/callback'
      : 'com.portal://com.portal/ios/callback';
  };

  // Generate PKCE and create auth URL when modal opens
  useEffect(() => {
    if (visible) {
      const initializeAuth = async () => {
        try {
          // Generate PKCE
          const { code_verifier, code_challenge } = await generatePKCE();

          // Save code_verifier
          await setVerifier(code_verifier);
          setCodeVerifier(code_verifier);

          // Build auth URL with PKCE
          const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309';
          const tenant = 'projectshellAB2C.onmicrosoft.com';
          const policy = POLICY_BY_MODE[authMode] || POLICY_BY_MODE.default;
          const b2cDomain = 'projectshellAB2C.b2clogin.com';
          const redirectUri = getRedirectUri();

          const url = new URL(
            `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/authorize`,
          );

          const params = {
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: 'openid profile offline_access',
            response_mode: 'query',
            code_challenge: code_challenge,
            code_challenge_method: 'S256',
            prompt: 'login',
          };

          Object.keys(params).forEach(key =>
            url.searchParams.append(key, params[key]),
          );

          console.log('Auth URL with PKCE:', url.toString(), 'mode:', authMode);
          setAuthUrl(url.toString());
          setLoading(true);
        } catch (error) {
          console.error('Error initializing auth:', error);
          onError('Failed to initialize authentication');
        }
      };

      initializeAuth();
    } else {
      // Reset when modal closes
      setAuthUrl(null);
      setCodeVerifier(null);
    }
  }, [visible, authMode, onError]);

  // Parse custom URL scheme manually since new URL() might not work with custom schemes
  const parseUrl = urlString => {
    const params = {};
    const urlParts = urlString.split('?');
    if (urlParts.length > 1) {
      const queryString = urlParts[1];
      const pairs = queryString.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }
    return params;
  };

  /**
   * Process redirect URL from B2C (code or error).
   * Note: AADB2C90091 (user cancelled self-asserted/sign-up) is treated as a benign cancel;
   * we close the WebView without calling onError so no "Login Failed" is shown.
   */
  const processAuthRedirect = async url => {
    // Prevent processing the same redirect multiple times
    if (isProcessing) {
      console.log('Already processing redirect, ignoring duplicate');
      return;
    }

    console.log('Processing auth redirect:', url);
    setIsProcessing(true);

    try {
      // Clean up the URL in case it has extra characters
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith('REDIRECT:')) {
        cleanUrl = cleanUrl.replace('REDIRECT:', '').trim();
      }

      const params = parseUrl(cleanUrl);
      const code = params.code;
      const error = params.error;
      const errorDescription = params.error_description;

      if (error) {
        // AADB2C90091 = user cancelled sign-up / self-asserted screen; treat as benign, do not show Login Failed
        const desc = (errorDescription || '').toString();
        const isUserCancel =
          desc.includes('AADB2C90091') ||
          desc.includes('The user has cancelled entering self-asserted information');
        if (isUserCancel) {
          console.log('User cancelled sign-up (AADB2C90091).');
          onClose();
          return;
        }
        console.error('Auth error from Azure:', error, errorDescription);
        onError(errorDescription || error || 'Authentication failed');
        onClose();
        return;
      }

      if (code) {
        console.log('✅ Authorization code received in processAuthRedirect');
        console.log('Code length:', code.length);

        // Get code_verifier from storage
        const verifier = codeVerifier || (await getVerifier());
        if (!verifier) {
          console.error('❌ Code verifier not found!');
          throw new Error('Code verifier not found');
        }

        console.log('✅ Code verifier found, length:', verifier.length);

        // Pass code and codeVerifier to App.js for API call (similar to web flow)
        console.log('📤 Calling onSuccess with code and codeVerifier...');
        console.log(
          'onSuccess callback exists:',
          typeof onSuccess === 'function',
        );

        try {
          onSuccess({ code, codeVerifier: verifier });
          console.log('✅ onSuccess called successfully');
        } catch (error) {
          console.error('❌ Error calling onSuccess:', error);
          throw error;
        }

        console.log('📤 Calling onClose...');
        onClose();
        console.log('✅ onClose called');
      } else {
        console.error('❌ No authorization code found in redirect URL');
        console.error('URL was:', cleanUrl);
        console.error('Parsed params:', params);
        onError('No authorization code received');
        onClose();
      }
    } catch (error) {
      console.error('Error processing redirect:', error);
      onError(error.message || 'Failed to process authentication');
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigationStateChange = navState => {
    const { url } = navState;
    console.log('Navigation changed to:', url);

    // Check if URL contains code parameter (even if it's not our redirect URL yet)
    // This catches cases where Azure B2C redirects to http://localhost or other URLs with code
    if (url && url.includes('code=')) {
      const codeMatch = url.match(/[?&]code=([^&]+)/);
      if (codeMatch && codeMatch[1]) {
        const code = decodeURIComponent(codeMatch[1]);
        // Check if it looks like a JWT token (long string)
        if (code.length > 100) {
          console.log(
            'Code parameter found in navigation URL, length:',
            code.length,
          );
          const redirectUrl = `com.portal://com.portal/ios/callback?code=${encodeURIComponent(
            code,
          )}`;
          console.log(
            'Processing authentication directly from navigation state change...',
          );
          // Process directly instead of using deep link
          processAuthRedirect(redirectUrl);
          return;
        }
      }
    }

    // Check if this is our redirect URL
    if (
      url &&
      (url.startsWith('com.portal://com.portal/ios/callback') ||
        url.startsWith('com.portal://com.portal/android/callback'))
    ) {
      console.log('Redirect URL detected in navigation state change');
      processAuthRedirect(url);
      return;
    }

    // Check if URL contains our callback pattern (in case of encoding issues)
    if (
      url &&
      (url.includes('com.portal://com.portal/ios/callback') ||
        url.includes('com.portal://com.portal/android/callback'))
    ) {
      console.log(
        'Redirect URL detected (pattern match) in navigation state change',
      );
      processAuthRedirect(url);
      return;
    }

    // If we're on the confirmed page, inject script to monitor for redirect
    if (url && url.includes('/confirmed')) {
      console.log('On confirmed page, monitoring for redirect...');
    }
  };

  const onShouldStartLoadWithRequest = request => {
    const { url } = request;
    console.log('Should start loading:', url);

    if (!url) {
      return true;
    }

    // Check if URL contains code parameter (even if it's not our redirect URL yet)
    // This is critical - Azure B2C might redirect to http://localhost or other URLs with code
    if (url && url.includes('code=')) {
      const codeMatch = url.match(/[?&]code=([^&]+)/);
      if (codeMatch && codeMatch[1]) {
        const code = decodeURIComponent(codeMatch[1]);
        // Check if it looks like a JWT token (long string, typically > 100 chars)
        if (code.length > 100) {
          console.log('⚠️ CODE PARAMETER FOUND IN URL! Length:', code.length);
          console.log('URL was:', url.substring(0, 200) + '...');

          // Process directly via processAuthRedirect instead of deep link
          // This ensures the onSuccess callback is called immediately
          console.log('Processing authentication directly...');
          processAuthRedirect(
            `com.portal://com.portal/ios/callback?code=${encodeURIComponent(
              code,
            )}`,
          );
          return false; // Prevent WebView from loading this URL
        }
      }
    }

    // If it's our redirect URL, process it and prevent WebView from loading it
    if (
      url.startsWith('com.portal://com.portal/ios/callback') ||
      url.startsWith('com.portal://com.portal/android/callback') ||
      url.includes('com.portal://com.portal/ios/callback') ||
      url.includes('com.portal://com.portal/android/callback')
    ) {
      console.log(
        'Redirect URL detected in onShouldStartLoadWithRequest:',
        url,
      );
      // Process the redirect asynchronously
      processAuthRedirect(url);
      // Prevent WebView from trying to load the custom URL scheme
      return false;
    }

    return true;
  };

  const exchangeCodeForTokens = async (code, redirectUri, codeVerifier) => {
    const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309';
    const tenant = 'projectshellAB2C.onmicrosoft.com';
    const policy = 'B2C_1_projectshell';
    const b2cDomain = 'projectshellAB2C.b2clogin.com';

    // Use provided redirectUri or default based on platform
    const finalRedirectUri = redirectUri || getRedirectUri();

    const tokenUrl = `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/token`;

    console.log('Exchanging code for tokens at:', tokenUrl);
    console.log('Using code_verifier:', codeVerifier ? 'present' : 'missing');

    try {
      const bodyParams = {
        client_id: clientId,
        code: code,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      };

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(bodyParams).toString(),
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
        expiresIn: tokenData.expires_in,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  };

  // Reset processing flag when modal closes
  React.useEffect(() => {
    if (!visible) {
      setIsProcessing(false);
    }
  }, [visible]);

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
        {authUrl && (
          <WebView
            ref={webViewRef}
            source={{ uri: authUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onLoadStart={() => {
              console.log('WebView loading started');
              setLoading(true);
            }}
            onLoadEnd={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              const url = nativeEvent?.url;
              console.log('WebView loading finished:', url);
              setLoading(false);

              // Check if this is our redirect URL
              if (
                url &&
                (url.startsWith('com.portal://com.portal/ios/callback') ||
                  url.startsWith('com.portal://com.portal/android/callback'))
              ) {
                console.log('Redirect URL detected in onLoadEnd');
                processAuthRedirect(url);
                return;
              }

              // If we're on the confirmed page, check for redirect after a delay
              if (url && url.includes('/confirmed')) {
                console.log('On confirmed page, will check for redirect...');

                // Also check the current URL for code parameter immediately
                try {
                  const urlParams = new URLSearchParams(
                    url.split('?')[1] || '',
                  );
                  const code = urlParams.get('code');
                  if (code && code.length > 100) {
                    console.log('✅ Code found in confirmed page URL!');
                    const redirectUrl = `com.portal://com.portal/ios/callback?code=${encodeURIComponent(
                      code,
                    )}`;
                    console.log('Triggering redirect immediately');
                    Linking.openURL(redirectUrl).catch(err => {
                      console.error('Error opening redirect URL:', err);
                      processAuthRedirect(redirectUrl);
                    });
                    return;
                  }
                } catch (e) {
                  console.log('Error parsing confirmed page URL:', e);
                }

                // Set up a timeout to check if redirect happens after a delay
                // Azure B2C sometimes takes a few seconds to process and redirect
                const redirectCheckTimeout = setTimeout(() => {
                  console.log('⏰ Timeout: Checking if redirect happened...');
                  // If we're still on the confirmed page after 5 seconds, something might be wrong
                  // But don't do anything yet - let the injected script handle it
                }, 5000);

                // Azure B2C often redirects after the confirmed page loads
                // Inject more aggressive monitoring script
                const checkRedirects = () => {
                  if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                    (function() {
                      try {
                        // Send a test message to verify script is running
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage('SCRIPT_RUNNING:' + window.location.href);
                         
                          // Also send page info for debugging
                          var pageInfo = {
                            url: window.location.href,
                            title: document.title,
                            htmlLength: document.documentElement.innerHTML.length,
                            forms: document.getElementsByTagName('form').length,
                            scripts: document.getElementsByTagName('script').length,
                            bodyText: document.body ? document.body.innerText.substring(0, 200) : 'no body',
                            hasCode: window.location.href.indexOf('code=') !== -1,
                            allLinks: []
                          };
                         
                          // Get all links on the page
                          var links = document.getElementsByTagName('a');
                          for (var i = 0; i < Math.min(links.length, 10); i++) {
                            pageInfo.allLinks.push(links[i].href);
                          }
                         
                          window.ReactNativeWebView.postMessage('PAGE_INFO:' + JSON.stringify(pageInfo));
                         
                          // If code is in URL, send it immediately
                          if (pageInfo.hasCode) {
                            var codeMatch = window.location.href.match(/[?&]code=([^&]+)/);
                            if (codeMatch && codeMatch[1]) {
                              window.ReactNativeWebView.postMessage('CODE:' + decodeURIComponent(codeMatch[1]));
                            }
                          }
                        }
                       
                        // Check current URL
                        var currentUrl = window.location.href;
                        if (currentUrl.indexOf('com.portal://com.portal/ios/callback') !== -1 ||
                            currentUrl.indexOf('com.portal://com.portal/android/callback') !== -1) {
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('REDIRECT:' + currentUrl);
                          }
                          return;
                        }
                       
                        // Check if there's a code parameter in the URL (Azure B2C might redirect with code in query)
                        var urlParams = new URLSearchParams(window.location.search);
                        var code = urlParams.get('code');
                        if (code && code.length > 100) {
                          // This looks like a JWT token (code from Azure B2C)
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('CODE:' + code);
                          }
                          return;
                        }
                       
                        // Also check the full URL for code parameter (in case it's in hash or path)
                        var fullUrl = window.location.href;
                        var codeMatch = fullUrl.match(/[?&]code=([^&]+)/);
                        if (codeMatch && codeMatch[1] && codeMatch[1].length > 100) {
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('CODE:' + decodeURIComponent(codeMatch[1]));
                          }
                          return;
                        }
                      } catch(e) {
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage('ERROR:' + e.message);
                        }
                      }
                     
                      // Check for forms that might redirect
                      var forms = document.getElementsByTagName('form');
                      console.log('Found', forms.length, 'forms on page');
                      for (var i = 0; i < forms.length; i++) {
                        var form = forms[i];
                        var action = form.action || '';
                        console.log('Form', i, 'action:', action);
                        if (action.indexOf('com.portal://') !== -1) {
                          console.log('Found form with redirect action:', action);
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('REDIRECT:' + action);
                          }
                        }
                        // Intercept form submission
                        form.addEventListener('submit', function(e) {
                          console.log('Form submitted, action:', this.action);
                          if (this.action && this.action.indexOf('com.portal://') !== -1) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Intercepted form redirect to:', this.action);
                            if (window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage('REDIRECT:' + this.action);
                            }
                            return false;
                          }
                        }, true);
                       
                        // Also check for hidden inputs that might contain redirect URL
                        var inputs = form.getElementsByTagName('input');
                        for (var j = 0; j < inputs.length; j++) {
                          var input = inputs[j];
                          var value = input.value || '';
                          if (value.indexOf('com.portal://') !== -1) {
                            console.log('Found input with redirect URL:', value);
                            if (window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage('REDIRECT:' + value);
                            }
                          }
                        }
                      }
                     
                      // Check for any links with redirect URL
                      var links = document.getElementsByTagName('a');
                      for (var i = 0; i < links.length; i++) {
                        var href = links[i].href || '';
                        if (href.indexOf('com.portal://com.portal/') !== -1) {
                          console.log('Found link with redirect URL:', href);
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(href);
                          }
                        }
                      }
                     
                      // Monitor for any script tags that might redirect
                      var scripts = document.getElementsByTagName('script');
                      for (var i = 0; i < scripts.length; i++) {
                        var scriptContent = scripts[i].textContent || scripts[i].innerHTML || '';
                        if (scriptContent.indexOf('com.portal://com.portal/') !== -1) {
                          console.log('Found script with redirect URL');
                          // Try multiple regex patterns to catch different formats
                          var patterns = [
                            /com\.portal:\/\/com\.portal\/[^"'\s)]+/g,
                            /['"](com\.portal:\/\/com\.portal\/[^'"]+)['"]/g,
                            /(com\.portal:\/\/com\.portal\/[^;,\\s)]+)/g
                          ];
                          patterns.forEach(function(pattern) {
                            var matches = scriptContent.match(pattern);
                            if (matches && matches.length > 0) {
                              console.log('Extracted redirect URLs:', matches);
                              matches.forEach(function(match) {
                                // Clean up the match
                                var cleanUrl = match.replace(/['"]/g, '');
                                if (cleanUrl.indexOf('com.portal://') !== -1 && window.ReactNativeWebView) {
                                  window.ReactNativeWebView.postMessage('REDIRECT:' + cleanUrl);
                                }
                              });
                            }
                          });
                        }
                      }
                     
                      // Also check inline event handlers and data attributes
                      var allElements = document.querySelectorAll('*');
                      for (var i = 0; i < allElements.length; i++) {
                        var el = allElements[i];
                        // Check onclick and other event handlers
                        var onclick = el.getAttribute('onclick') || '';
                        if (onclick.indexOf('com.portal://') !== -1) {
                          var urlMatch = onclick.match(/com\.portal:\/\/com\.portal\/[^"'\s)]+/);
                          if (urlMatch && window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('REDIRECT:' + urlMatch[0]);
                          }
                        }
                        // Check data attributes
                        for (var j = 0; j < el.attributes.length; j++) {
                          var attr = el.attributes[j];
                          if (attr.value && attr.value.indexOf('com.portal://') !== -1) {
                            var urlMatch = attr.value.match(/com\.portal:\/\/com\.portal\/[^"'\s)]+/);
                            if (urlMatch && window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage('REDIRECT:' + urlMatch[0]);
                            }
                          }
                        }
                      }
                     
                      // Check if there's a meta refresh
                      var metaTags = document.getElementsByTagName('meta');
                      for (var i = 0; i < metaTags.length; i++) {
                        if (metaTags[i].httpEquiv && metaTags[i].httpEquiv.toLowerCase() === 'refresh') {
                          var content = metaTags[i].content || '';
                          var urlMatch = content.match(/url=(.+)/i);
                          if (urlMatch && urlMatch[1]) {
                            var redirectUrl = urlMatch[1].trim();
                            console.log('Found meta refresh redirect:', redirectUrl);
                            if (redirectUrl.indexOf('com.portal://') !== -1 && window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage('REDIRECT:' + redirectUrl);
                            }
                          }
                        }
                      }
                     
                      // Monitor for any navigation that might happen
                      var checkForCodeInUrl = function() {
                        var currentUrl = window.location.href;
                        var urlParams = new URLSearchParams(window.location.search);
                        var code = urlParams.get('code');
                        if (code && code.length > 100) {
                          console.log('Code parameter detected in URL, sending to React Native');
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('CODE:' + code);
                          }
                          return true;
                        }
                       
                        // Also check via regex
                        var codeMatch = currentUrl.match(/[?&]code=([^&]+)/);
                        if (codeMatch && codeMatch[1] && codeMatch[1].length > 100) {
                          console.log('Code found via regex, sending to React Native');
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('CODE:' + decodeURIComponent(codeMatch[1]));
                          }
                          return true;
                        }
                       
                        return false;
                      };
                     
                      // Check immediately
                      if (checkForCodeInUrl()) {
                        return;
                      }
                     
                      // Monitor URL changes aggressively
                      var lastUrl = window.location.href;

 var urlCheckInterval = setInterval(function() {
                        var currentUrl = window.location.href;
                        if (currentUrl !== lastUrl) {
                          lastUrl = currentUrl;
                          if (checkForCodeInUrl()) {
                            clearInterval(urlCheckInterval);
                            return;
                          }
                        }
                      }, 100);
                     
                      // Also check periodically even if URL doesn't change (for dynamic content)
                      var periodicCheck = setInterval(function() {
                        if (checkForCodeInUrl()) {
                          clearInterval(periodicCheck);
                          clearInterval(urlCheckInterval);
                          return;
                        }
                      }, 500);
                     
                      // Stop checking after 15 seconds
                      setTimeout(function() {
                        clearInterval(urlCheckInterval);
                        clearInterval(periodicCheck);
                      }, 15000);
                    })();
                    true;
                  `);
                  }
                };

                // Check immediately and at intervals
                setTimeout(checkRedirects, 100);
                setTimeout(checkRedirects, 500);
                setTimeout(checkRedirects, 1000);
                setTimeout(checkRedirects, 1500);
                setTimeout(checkRedirects, 2000);
                setTimeout(checkRedirects, 3000);
                setTimeout(checkRedirects, 5000);
              }
            }}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              onError(
                'Failed to load authentication page. Please check your internet connection.',
              );
            }}
            // Handle URL changes that might not trigger navigation events
            onMessage={event => {
              const data = event.nativeEvent.data;
              console.log('Message received from WebView:', data);

              // Check if script is running (test message)
              if (data && data.startsWith('SCRIPT_RUNNING:')) {
                const url = data.replace('SCRIPT_RUNNING:', '');
                console.log('Injected script is running, current URL:', url);
                // Check for code in this URL
                const codeMatch = url.match(/[?&]code=([^&]+)/);
                if (codeMatch && codeMatch[1] && codeMatch[1].length > 100) {
                  const code = decodeURIComponent(codeMatch[1]);
                  console.log(
                    'Code found in SCRIPT_RUNNING message:',
                    code.substring(0, 50) + '...',
                  );
                  const redirectUrl = `com.portal://com.portal/ios/callback?code=${encodeURIComponent(
                    code,
                  )}`;
                  processAuthRedirect(redirectUrl);
                  return;
                }
              }

              // Check for page info (debugging)
              if (data && data.startsWith('PAGE_INFO:')) {
                const pageInfoStr = data.replace('PAGE_INFO:', '');
                try {
                  const pageInfo = JSON.parse(pageInfoStr);
                  console.log('Page info:', pageInfo);
                } catch (e) {
                  console.log('Page info (raw):', pageInfoStr);
                }
              }

              // Check for errors from injected script
              if (data && data.startsWith('ERROR:')) {
                const error = data.replace('ERROR:', '');
                console.error('Error from injected script:', error);
              }

              // Check if it's a redirect message from injected script
              if (data && data.startsWith('REDIRECT:')) {
                const redirectUrl = data.replace('REDIRECT:', '').trim();
                console.log(
                  'Redirect URL extracted from message:',
                  redirectUrl,
                );
                processAuthRedirect(redirectUrl);
                return;
              }

              // Check if it's a code parameter message
              if (data && data.startsWith('CODE:')) {
                const code = data.replace('CODE:', '').trim();
                console.log(
                  'Code parameter extracted from message:',
                  code.substring(0, 50) + '...',
                );
                const redirectUrl = `com.portal://com.portal/ios/callback?code=${encodeURIComponent(
                  code,
                )}`;
                processAuthRedirect(redirectUrl);
                return;
              }

              // Direct redirect URL check
              if (
                data &&
                (data.startsWith('com.portal://com.portal/ios/callback') ||
                  data.startsWith('com.portal://com.portal/android/callback') ||
                  data.includes('com.portal://com.portal/ios/callback') ||
                  data.includes('com.portal://com.portal/android/callback'))
              ) {
                console.log('Redirect URL received via onMessage:', data);
                processAuthRedirect(data);
              }
            }}
            // Inject JavaScript to catch redirects - runs on every page load
            injectedJavaScript={`
            (function() {
              function checkUrl(url) {
                if (!url) return false;
                var urlStr = url.toString();
                if (urlStr.indexOf('com.portal://com.portal/ios/callback') !== -1 ||
                    urlStr.indexOf('com.portal://com.portal/android/callback') !== -1) {
                  console.log('Redirect URL detected in injected script:', urlStr);
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage('REDIRECT:' + urlStr);
                  }
                  // Also try to prevent default navigation and let native handle it
                  return true;
                }
                return false;
              }
             
              // Check current URL immediately
              if (checkUrl(window.location.href)) {
                return;
              }
             
              // Monitor for URL changes more aggressively
              var lastUrl = window.location.href;
              var checkInterval = setInterval(function() {
                var currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                  lastUrl = currentUrl;
                  if (checkUrl(currentUrl)) {
                    clearInterval(checkInterval);
                    return;
                  }
                }
              }, 50);
             
              // Override window.location.href setter
              var originalHref = Object.getOwnPropertyDescriptor(window.location, 'href') ||
                                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location), 'href');
             
              if (originalHref && originalHref.set) {
                Object.defineProperty(window.location, 'href', {
                  set: function(url) {
                    if (checkUrl(url)) {
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(url);
                      }
                      return;
                    }
                    originalHref.set.call(window.location, url);
                  },
                  get: function() {
                    return originalHref.get ? originalHref.get.call(window.location) : window.location.toString();
                  }
                });
              }
             
              // Override window.location.replace
              var originalReplace = window.location.replace;
              window.location.replace = function(url) {
                if (checkUrl(url)) {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(url);
                  }
                  return;
                }
                return originalReplace.call(window.location, url);
              };
             
              // Override window.location.assign
              var originalAssign = window.location.assign;
              window.location.assign = function(url) {
                if (checkUrl(url)) {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(url);
                  }
                  return;
                }
                return originalAssign.call(window.location, url);
              };
             
              // Monitor for meta refresh redirects
              var metaTags = document.getElementsByTagName('meta');
              for (var i = 0; i < metaTags.length; i++) {
                if (metaTags[i].httpEquiv === 'refresh') {
                  var content = metaTags[i].content;
                  var urlMatch = content.match(/url=(.+)/i);
                  if (urlMatch && urlMatch[1]) {
                    var redirectUrl = urlMatch[1].trim();
                    if (checkUrl(redirectUrl)) {
                      return;
                    }
                  }
                }
              }
             
              // Monitor for script-based redirects
              var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'SCRIPT') {
                          var scriptContent = node.textContent || node.innerHTML;
                          if (scriptContent) {
                            var matches = scriptContent.match(/location\.(href|replace|assign)\s*=\s*['"]([^'"]+)['"]/gi);
                            if (matches) {
                              matches.forEach(function(match) {
                                var urlMatch = match.match(/['"]([^'"]+)['"]/);
                                if (urlMatch && urlMatch[1] && checkUrl(urlMatch[1])) {
                                  return;
                                }
                              });
                            }
                          }
                        } else if (node.tagName === 'META' && node.httpEquiv === 'refresh') {
                          var content = node.content;
                          var urlMatch = content.match(/url=(.+)/i);
                          if (urlMatch && urlMatch[1]) {
                            var redirectUrl = urlMatch[1].trim();
                            checkUrl(redirectUrl);
                          }
                        }
                      }
                    });
                  }
                });
              });
             
              observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
              });
             
              // Check after a short delay (for delayed redirects)
              setTimeout(function() {
                checkUrl(window.location.href);
              }, 500);
             
              setTimeout(function() {
                checkUrl(window.location.href);
              }, 1000);
             
              setTimeout(function() {
                checkUrl(window.location.href);
              }, 2000);
            })();
            true;
          `}
            style={styles.webview}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            originWhitelist={['*']}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures={false}
          />
        )}
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
