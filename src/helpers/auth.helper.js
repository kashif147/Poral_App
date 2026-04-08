import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptToken } from './crypt.helper';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const setHeaders = async headers => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, headers['accessToken']);
  } catch {}
};

export const getHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { token: null };
    }
    
    // Check if token is encrypted (format: iv:authTag:encrypted)
    if (token.includes(':') && token.split(':').length === 3) {
      try {
        const decryptedToken = await decryptToken(token);
        console.log('decrypted token=========>',decryptedToken)
        return { token: decryptedToken };
      } catch (error) {
        console.error('Error decrypting token:', error);
        // If decryption fails, return original token (might not be encrypted)
        return { token };
      }
    }
    
    // Token is not encrypted, return as is
    return { token };
  } catch {
    return { token: null };
  }
};

export const setBearerToken = async bearerToken => {
  try {
    if (typeof bearerToken !== 'string') return;
    await AsyncStorage.setItem(TOKEN_KEY, bearerToken);
  } catch {}
};

export const setRefreshToken = async refreshToken => {
  try {
    if (typeof refreshToken !== 'string') return;
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {}
};

export const getRefreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    return refreshToken || null;
  } catch {
    return null;
  }
};

export const deleteRefreshToken = async () => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
};

export const deleteHeaders = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const saveUser = async user => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return { user };
  } catch {
    return { user: null };
  }
};

export const deleteUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch {}
};