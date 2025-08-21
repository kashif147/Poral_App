import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFIER_KEY = 'code_verifier';

export const setVerifier = async (verifier) => {
  try {
    await AsyncStorage.setItem(VERIFIER_KEY, verifier);
  } catch (e) {
    // noop
  }
};

export const getVerifier = async () => {
  try {
    return await AsyncStorage.getItem(VERIFIER_KEY);
  } catch (e) {
    return null;
  }
};

export const deleteVerifier = async () => {
  try {
    await AsyncStorage.removeItem(VERIFIER_KEY);
  } catch (e) {
    // noop
  }
};