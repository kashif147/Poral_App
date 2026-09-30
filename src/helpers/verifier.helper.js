import AsyncStorage from '@react-native-async-storage/async-storage';

const CODE_VERIFIER_KEY = 'azure_b2c_code_verifier';
const STATE_KEY = 'azure_b2c_state';
const LEGACY_VERIFIER_KEY = 'code_verifier';

export const setVerifier = async verifier => {
  try {
    await AsyncStorage.setItem(CODE_VERIFIER_KEY, verifier);
  } catch (e) {
    // noop
  }
};

export const getVerifier = async () => {
  try {
    return (
      (await AsyncStorage.getItem(CODE_VERIFIER_KEY)) ||
      (await AsyncStorage.getItem(LEGACY_VERIFIER_KEY))
    );
  } catch (e) {
    return null;
  }
};

export const deleteVerifier = async () => {
  try {
    await AsyncStorage.multiRemove([CODE_VERIFIER_KEY, LEGACY_VERIFIER_KEY]);
  } catch (e) {
    // noop
  }
};

export const setB2CState = async state => {
  try {
    if (state) await AsyncStorage.setItem(STATE_KEY, state);
  } catch (e) {
    // noop
  }
};

export const getB2CState = async () => {
  try {
    return await AsyncStorage.getItem(STATE_KEY);
  } catch (e) {
    return null;
  }
};

export const deleteB2CState = async () => {
  try {
    await AsyncStorage.removeItem(STATE_KEY);
  } catch (e) {
    // noop
  }
};

export const setB2CAuthTransaction = async ({ codeVerifier, state } = {}) => {
  if (codeVerifier) await setVerifier(codeVerifier);
  if (state) await setB2CState(state);
};

export const getB2CAuthTransaction = async () => ({
  codeVerifier: await getVerifier(),
  state: await getB2CState(),
});

export const clearB2CAuthTransaction = async () => {
  await deleteVerifier();
  await deleteB2CState();
};
