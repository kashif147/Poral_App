import { Platform } from 'react-native';
import { setHeaders, saveUser } from './auth.helper';
import { authorize, refresh, revoke, prefetchConfiguration } from 'react-native-app-auth'

const tenant = 'projectshellAB2C.onmicrosoft.com';
const b2cDomain = 'projectshellAB2C.b2clogin.com';
const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309'

const policy = 'B2C_1_projectshell';

const redirectUrl = Platform.OS === 'android' ? 'com.portal://com.portal/android/callback' : 'com.portal://com.portal/ios/callback';

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

export const signInWithAzureB2C = async () => {
  try {
    console.log('Starting Azure B2C sign-in...');
    console.log('Client ID:', clientId);
    console.log('Redirect URL:', redirectUrl);
    console.log('Tenant:', tenant);
    console.log('Policy:', policy);
    
    // FIXED: Remove useNonce and usePKCE parameters
    const config = {
      clientId,
      redirectUrl,
      scopes: ['openid', 'profile', 'offline_access'],
      serviceConfiguration: {
        authorizationEndpoint: `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/token`,
      },
      additionalParameters: {},
      // REMOVED: useNonce and usePKCE - these are causing the BOOL conversion error
      // PKCE is enabled by default in newer versions anyway
    };
    
    console.log('Full Config:', JSON.stringify(config, null, 2));
    
    // Test the configuration first
    await prefetchConfiguration(config);
    console.log('Configuration prefetched successfully');
    
    const result = await authorize(config);
    console.log('Authorization result:', result);
    
    const { accessToken, refreshToken, idToken } = result || {};

    if (accessToken) {
      console.log('Setting access token...');
      await setHeaders({ accessToken });
    }
    
    if (idToken) {
      const claims = decodeJwt(idToken);
      console.log('Decoded claims:', claims);
      const user = {
        name: claims.name || claims.given_name || '',
        email: (Array.isArray(claims.emails) ? claims.emails[0] : claims.email) || '',
        oid: claims.oid || claims.sub,
      };
      await saveUser(user);
      console.log('User saved successfully');
    }
    
    return { ok: true, result };
  } catch (error) {
    console.error('Azure B2C sign-in error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { ok: false, error };
  }
};

export const prefetchB2CConfiguration = async () => {
  try {
    const config = {
      clientId: clientId,
      redirectUrl: redirectUrl,
      scopes: ['openid', 'profile'],
      serviceConfiguration: {
        authorizationEndpoint: `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/token`,
      },
    };
    await prefetchConfiguration(config);
  } catch (e) {
    // no-op; prefetch is opportunistic
  }
};