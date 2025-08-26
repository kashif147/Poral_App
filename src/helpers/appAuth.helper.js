import { Platform } from 'react-native';
import { setHeaders, saveUser } from './auth.helper';

const tenant = 'projectshellAB2C.onmicrosoft.com';
const b2cDomain = 'projectshellAB2C.b2clogin.com';
const policy = 'B2C_1_projectshell';

const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309';
const redirectScheme = 'portalapp';
const redirectUrl = `${redirectScheme}://auth`;

const serviceConfiguration = {
  authorizationEndpoint: `https://${b2cDomain}/${tenant}/oauth2/v2.0/authorize?p=${policy}`,
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
    // Dynamic require avoids bundling issues if dependency isn't installed yet
    // eslint-disable-next-line global-require
    const { authorize } = require('react-native-app-auth');

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

    const result = await authorize(config);
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

export const getAppAuthRedirectUrl = () => redirectUrl;


