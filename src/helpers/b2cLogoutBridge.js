/**
 * Lets auth.services request an in-app B2C logout WebView without importing App.
 */
let openLogoutHandler = null;

export const registerB2CLogoutHandler = handler => {
  openLogoutHandler = handler;
  return () => {
    if (openLogoutHandler === handler) {
      openLogoutHandler = null;
    }
  };
};

export const requestB2CLogoutInApp = url => {
  if (!url || typeof openLogoutHandler !== 'function') {
    return false;
  }
  openLogoutHandler(url);
  return true;
};
