import { generatePkceRequest } from '../api/auth.api';
import {
  clearB2CAuthTransaction,
  setB2CAuthTransaction,
} from './verifier.helper';

export const B2C_FLOW_STORAGE_KEY = 'azure_b2c_flow';

const FLOW_BY_MODE = {
  signin: 'signin',
  signup: 'signup',
  gmail: 'gmail',
  'password-reset': 'password-reset',
  default: 'signin',
};

const AUTHORIZATION_URL_KEY_BY_FLOW = {
  signin: 'azureB2CSignIn',
  signup: 'azureB2CSignUp',
  gmail: 'azureB2CGmailCombined',
  'password-reset': 'azureB2CPasswordReset',
  default: 'azureB2C',
};

export const pickB2CAuthorizationUrl = (payload, flow = 'signin') => {
  const urls = payload?.authorizationUrls || {};
  const key =
    AUTHORIZATION_URL_KEY_BY_FLOW[flow] || AUTHORIZATION_URL_KEY_BY_FLOW.default;
  return urls[key] || urls.azureB2C || payload?.authorizationUrl || null;
};

/** Normalize /pkce/generate response whether fields are top-level or under data. */
export const normalizePkcePayload = response => {
  const root = response?.data ?? response ?? {};
  const nested = root?.data && typeof root.data === 'object' ? root.data : null;
  return {
    ...root,
    ...(nested || {}),
    authorizationUrls:
      nested?.authorizationUrls || root?.authorizationUrls || {},
    codeVerifier: nested?.codeVerifier || root?.codeVerifier || null,
    state: nested?.state || root?.state || null,
  };
};

export const extractOAuthParam = (urlString, paramName) => {
  if (!urlString || !paramName) return null;
  try {
    const parsed = new URL(urlString);
    const value = parsed.searchParams.get(paramName);
    if (value) return value;
  } catch {
    // Custom schemes may fail URL parsing.
  }
  const match = String(urlString).match(
    new RegExp(`[?&#]${paramName}=([^&#]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Start B2C via backend GET /pkce/generate.
 * Returns the exact authorize URL + retained PKCE transaction fields.
 */
export const startB2CAuthorization = async (authMode = 'signin') => {
  const flow = FLOW_BY_MODE[authMode] || FLOW_BY_MODE.default;
  const response = await generatePkceRequest(flow);
  const payload = normalizePkcePayload(response);

  if (!(response?.status >= 200 && response?.status < 300) || !payload) {
    await clearB2CAuthTransaction();
    throw new Error(
      payload?.message ||
        payload?.error ||
        'Failed to start authentication. Please try again.',
    );
  }

  const codeVerifier = payload.codeVerifier;
  const authUrl = pickB2CAuthorizationUrl(payload, flow);

  if (!codeVerifier || !authUrl) {
    await clearB2CAuthTransaction();
    throw new Error('Authentication challenge was incomplete. Please try again.');
  }

  const stateFromUrl = extractOAuthParam(authUrl, 'state');
  const state = stateFromUrl || payload.state || null;

  if (!state) {
    await clearB2CAuthTransaction();
    throw new Error('Authentication state was missing. Please try again.');
  }

  await setB2CAuthTransaction({ codeVerifier, state });

  return {
    authUrl,
    codeVerifier,
    state,
    flow,
    redirectUri: extractOAuthParam(authUrl, 'redirect_uri'),
  };
};

/** @deprecated Use startB2CAuthorization — kept for older call sites. */
export const buildB2CAuthorizeUrl = async (authMode = 'signin') => {
  const result = await startB2CAuthorization(authMode);
  return {
    authUrl: result.authUrl,
    codeVerifier: result.codeVerifier,
    state: result.state,
  };
};

/** Legacy helper — redirect URI is now owned by the backend authorize URL. */
export const getB2CRedirectUri = () => null;
