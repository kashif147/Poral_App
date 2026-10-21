import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const isLegacyEncryptedToken = token =>
  typeof token === 'string' && token.split(':').length === 3;

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
    
    // Legacy AES-encrypted token (iv:authTag:ciphertext) from before the server returned the
    // signed JWT itself. It can no longer be used (and expired long ago): drop it so the user
    // signs in again, never send it as a Bearer token.
    if (isLegacyEncryptedToken(token)) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return { token: null };
    }

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