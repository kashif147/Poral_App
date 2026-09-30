import { getLogoutUrlsRequest } from '../api/auth.api';
import { startB2CAuthorization } from './b2cMobileAuthorize';
import { requestB2CLogoutInApp } from './b2cLogoutBridge';

/**
 * Starts B2C authorize via backend PKCE (caller opens WebView / system browser).
 */
export const microSoftUrlRedirect = async (authMode = 'signin') => {
  return startB2CAuthorization(authMode);
};

export const getB2CLogoutUrl = async () => {
  try {
    const response = await getLogoutUrlsRequest();
    const url = response?.data?.b2cLogoutUrl;
    if (!(response?.status >= 200 && response?.status < 300) || !url) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

/**
 * Ends the B2C browser session inside an in-app WebView (never Safari).
 * Caller must clear local tokens before this. No-ops if no logout URL / handler.
 */
export const microsoftLogoutRedirect = async () => {
  const url = await getB2CLogoutUrl();
  if (!url) {
    return false;
  }
  return requestB2CLogoutInApp(url);
};
