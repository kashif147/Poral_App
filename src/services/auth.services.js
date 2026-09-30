import {
  signInMicrosoftRequest,
  validationRequest,
  refreshTokenRequest,
} from '../api/auth.api';
import {
  deleteHeaders,
  deleteUser,
  getHeaders,
  getRefreshToken,
  saveUser,
  setHeaders,
  setRefreshToken,
  deleteRefreshToken,
} from '../helpers/auth.helper';
import { clearB2CAuthTransaction } from '../helpers/verifier.helper';
import { microsoftLogoutRedirect } from '../helpers/B2C.helper';
import { setSignedIn, setUser, setDetail } from '../store/slice/auth.slice';
import { getMemberDetail } from '../helpers/decode.helper';
import { toast } from '../utils/toast.utils';

const performLogoutCleanup = async dispatch => {
  await deleteHeaders();
  await deleteRefreshToken();
  await deleteUser();
  await clearB2CAuthTransaction();
  dispatch(setSignedIn(false));
  dispatch(setUser({}));
  dispatch(setDetail(null));
};

export const validation = () => {
  return async dispatch => {
    try {
      const res = await getHeaders();
      const refreshToken = await getRefreshToken();
      const hasToken =
        res?.token &&
        typeof res.token === 'string' &&
        res.token.trim().length > 0;

      if (!hasToken || !refreshToken) {
        dispatch(setSignedIn(false));
        dispatch(setUser({}));
        dispatch(setDetail(null));
        return;
      }

      // Backend now sends tokens as-is (no client-side decryption).
      const refreshUser = await refreshTokenRequest({ refreshToken });
      if (refreshUser?.status === 200) {
        const tokenPayload = refreshUser?.data?.data ?? refreshUser?.data;
        await setHeaders(tokenPayload);
        if (tokenPayload?.refreshToken) {
          await setRefreshToken(tokenPayload.refreshToken);
        }
      } else {
        await performLogoutCleanup(dispatch);
        return;
      }

      const meRes = await validationRequest();
      const isSuccess = meRes?.status >= 200 && meRes?.status < 300;

      if (isSuccess) {
        const meUser = meRes.data?.data ?? meRes.data;
        if (meUser) {
          await saveUser(meUser);
        }
        dispatch(setSignedIn(true));
        dispatch(setUser(meUser ?? {}));
        const memberDetail = await getMemberDetail();
        dispatch(setDetail(memberDetail));
      } else {
        await performLogoutCleanup(dispatch);
      }
    } catch (error) {
      console.error('Validation error:', error);
      await performLogoutCleanup(dispatch);
    }
  };
};

export const signInMicrosoft = data => {
  return dispatch => {
    signInMicrosoftRequest(data)
      .then(async res => {
        if (res.status === 200) {
          await setHeaders(res.data);
          if (res?.data?.refreshToken) {
            await setRefreshToken(res.data.refreshToken);
          }
          await saveUser(res.data.user);
          await clearB2CAuthTransaction();
          dispatch(setSignedIn(true));
          dispatch(setUser(res.data.user));
          const memberDetail = await getMemberDetail();
          dispatch(setDetail(memberDetail));
        } else {
          toast.error(res.data.errors[0] ?? 'Unable to Sign In');
        }
      })
      .catch(() => {
        toast.error('Something went wrong');
      });
  };
};

export const signOut = navigation => {
  return async dispatch => {
    try {
      await performLogoutCleanup(dispatch);
      try {
        const { unRegisterAppWithFcm } = await import('./firebase.services');
        await unRegisterAppWithFcm();
      } catch (fcmError) {
        console.error('FCM unregister error:', fcmError);
      }

      // End B2C browser session so next login prompts for credentials.
      await microsoftLogoutRedirect();
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
      dispatch(setDetail(null));
    }
  };
};
