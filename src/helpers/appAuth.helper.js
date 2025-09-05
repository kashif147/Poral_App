import { Platform } from 'react-native';
import { setHeaders, saveUser } from './auth.helper';
import { authorize, refresh, revoke, prefetchConfiguration } from 'react-native-app-auth'

const tenant = 'projectshellAB2C.onmicrosoft.com';
const b2cDomain = 'projectshellAB2C.b2clogin.com';
const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309'

const policy = 'B2C_1_projectshell';

const redirectUrl = Platform.OS === 'android' ? 'com.portal://com.portal/android/callback' : 'com.portal://com.portal/ios/callback';

const serviceConfiguration = {
  authorizationEndpoint: `https://${b2cDomain}/${tenant}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://${b2cDomain}/${tenant}/oauth2/v2.0/token?p=${policy}`,
};

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
    const config = {
      clientId,
      redirectUrl,
      scopes: ['openid', 'profile', 'offline_access'],
      skipCodeExchange: false,
      usePKCE: true,
      serviceConfiguration,
      additionalParameters: {
        p: policy,
        nonce: 'defaultNonce',
      },
      iosPrefersEphemeralSession: false,
    };
    // const configs = {
    //   identityserver: {
    //     issuer: `https://${b2cDomain}/${tenant}/oauth2/v2.0/authorize`,
    //     clientId: clientId,
    //     redirectUrl: Platform.OS === 'android' ? 'com.portal://com.portal/android/callback' : 'com.portal://com.portal/ios/callback',
    //     additionalParameters: {},
    //     scopes: ['openid', 'profile', 'email', 'phone', 'address', 'openid profile offline_access']
    //   },
    //   auth0: {
    //     issuer: `https://${b2cDomain}/${tenant}/oauth2/v2.0/authorize`,
    //     clientId: clientId,
    //     redirectUrl: Platform.OS === 'android' ? 'com.portal://com.portal/android/callback' : 'com.portal://com.portal/ios/callback',
    //     additionalParameters: {},
    //     scopes: ['openid', 'profile', 'email', 'phone', 'address', 'openid ', 'profile ', 'offline_access']
    //   }
    // }

    const result = await authorize({ ...config, connectionTimeoutSeconds: 5, iosPrefersEphemeralSession: true });
    console.log('Result=============>', result);
    const { accessToken, refreshToken, idToken } = result || {};

    if (accessToken) {
      await setHeaders({ accessToken });
    }
    if (idToken) {
      const claims = decodeJwt(idToken);
      const user = {
        name: claims.name || claims.given_name || '',
        email: (Array.isArray(claims.emails) ? claims.emails[0] : claims.email) || '',
        oid: claims.oid || claims.sub,
      };
      await saveUser(user);
    }
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error };
  }
};



