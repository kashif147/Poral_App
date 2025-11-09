import { Linking } from 'react-native';
import { setHeaders, saveUser } from './auth.helper';

const clientId = 'b0a62557-3308-4efb-954a-fb4b6a787309';
const tenant = 'projectshellAB2C.onmicrosoft.com';
const policy = 'B2C_1_projectshell';
const b2cDomain = 'projectshellAB2C.b2clogin.com';
const redirectUri = 'com.portal://com.portal/ios/callback';

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

export const getAuthUrl = () => {
  const authUrl = new URL(`https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/authorize`);
  
  const params = {
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile offline_access',
    response_mode: 'query'
  };
  
  Object.keys(params).forEach(key => 
    authUrl.searchParams.append(key, params[key])
  );
  
  return authUrl.toString();
};

export const handleAuthResponse = async (url) => {
  try {
    console.log('Handling auth response:', url);
    
    if (url.startsWith(redirectUri)) {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');
      
      if (error) {
        console.error('Auth error:', error);
        return { ok: false, error };
      }
      
      if (code) {
        console.log('Authorization code received:', code);
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);
        return { ok: true, ...tokens };
      }
    }
    
    return { ok: false, error: 'No authorization code found' };
  } catch (error) {
    console.error('Error handling auth response:', error);
    return { ok: false, error };
  }
};

const exchangeCodeForTokens = async (code) => {
  try {
    const tokenUrl = `https://${b2cDomain}/${tenant}/${policy}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid profile offline_access'
      }).toString()
    });
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }
    
    const tokenData = await response.json();
    console.log('Token exchange successful:', tokenData);
    
    const { access_token, id_token, refresh_token } = tokenData;
    
    if (access_token) {
      await setHeaders({ accessToken: access_token });
    }
    
    if (id_token) {
      const claims = decodeJwt(id_token);
      console.log('Decoded claims:', claims);
      
      const user = {
        name: claims.name || claims.given_name || '',
        email: (Array.isArray(claims.emails) ? claims.emails[0] : claims.email) || '',
        oid: claims.oid || claims.sub,
      };
      await saveUser(user);
      console.log('User saved successfully');
    }
    
    return {
      accessToken: access_token,
      idToken: id_token,
      refreshToken: refresh_token
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

export const signInWithAzureB2C = () => {
  const authUrl = getAuthUrl();
  console.log('Opening auth URL:', authUrl);
  Linking.openURL(authUrl);
};