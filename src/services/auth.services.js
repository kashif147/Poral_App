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
import { deleteVerifier } from '../helpers/verifier.helper';
import { setSignedIn, setUser, setDetail } from '../store/slice/auth.slice';
import { getMemberDetail } from '../helpers/decode.helper';
import { toast } from '../utils/toast.utils';
import { decryptToken } from '../helpers/crypt.helper';

const performLogoutCleanup = async dispatch => {
  await deleteHeaders();
  await deleteRefreshToken();
  await deleteUser();
  await deleteVerifier();
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

      const refreshUser = await refreshTokenRequest({ refreshToken });
      if (refreshUser?.status === 200) {
        const tokenPayload = refreshUser?.data?.data ?? refreshUser?.data;
        await setHeaders(tokenPayload);
        if (tokenPayload?.refreshToken) {
          const refreshDectoken = await decryptToken(tokenPayload.refreshToken);
          await setRefreshToken(refreshDectoken);
        }
      } else {
        await performLogoutCleanup(dispatch);
        return;
      }

      const meRes = await validationRequest();
      const isSuccess =
        meRes?.status >= 200 && meRes?.status < 300;

      if (isSuccess) {
        // /api/me returns { success, data: { id, email, firstName, ... }, policyVersion }
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
          deleteVerifier();
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
      await deleteHeaders();
      await deleteRefreshToken();
      await deleteUser();
      await deleteVerifier();
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
      dispatch(setDetail(null));
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
      dispatch(setDetail(null));
    }
  };
};
