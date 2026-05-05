import { Platform } from 'react-native';
import { generatePKCE } from './crypt.helper';
import { setVerifier } from './verifier.helper';

export const POLICY_BY_MODE = {
  signin: 'B2C_1_projectshell_signin',
  signup: 'B2C_1_projectshell_signup',
  gmail: 'B2C_1_projectshell_signup_signin_gmail',
  default: 'B2C_1_projectshell',
};

const CLIENT_ID = 'b0a62557-3308-4efb-954a-fb4b6a787309';
const TENANT = 'projectshellAB2C.onmicrosoft.com';
const B2C_DOMAIN = 'projectshellAB2C.b2clogin.com';

export const getB2CRedirectUri = () =>
  Platform.OS === 'android'
    ? 'com.portal://com.portal/android/callback'
    : 'com.portal://com.portal/ios/callback';

/**
 * Generates PKCE, persists code_verifier for token exchange, and returns the Azure B2C authorize URL.
 * Use for WebView or system browser (e.g. Google sign-in must not use WebView).
 */
export const buildB2CAuthorizeUrl = async (authMode = 'signin') => {
  const { code_verifier, code_challenge } = await generatePKCE();
  await setVerifier(code_verifier);

  const policy = POLICY_BY_MODE[authMode] || POLICY_BY_MODE.default;
  const redirectUri = getB2CRedirectUri();

  const url = new URL(
    `https://${B2C_DOMAIN}/${TENANT}/${policy}/oauth2/v2.0/authorize`,
  );

  const params = {
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile offline_access',
    response_mode: 'query',
    code_challenge: code_challenge,
    code_challenge_method: 'S256',
    prompt: 'login',
  };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  return { authUrl: url.toString(), codeVerifier: code_verifier };
};
