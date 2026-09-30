import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const setHeaders = async headers => {
  try {
    const accessToken =
      headers?.accessToken || headers?.token || headers?.access_token;
    if (typeof accessToken === 'string' && accessToken.trim()) {
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    }
  } catch {}
};

export const getHeaders = async () => {
  try {
    // Backend now sends the signed JWT as-is (no client-side decryption).
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return { token: token || null };
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
