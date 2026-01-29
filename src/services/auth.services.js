import { signInMicrosoftRequest, validationRequest } from '../api/auth.api';
import {
  deleteHeaders,
  deleteUser,
  getHeaders,
  saveUser,
  setHeaders,
} from '../helpers/auth.helper';
import { deleteVerifier } from '../helpers/verifier.helper';
import { setSignedIn, setUser } from '../store/slice/auth.slice';

const performLogoutCleanup = async dispatch => {
  await deleteHeaders();
  await deleteUser();
  await deleteVerifier();
  dispatch(setSignedIn(false));
  dispatch(setUser({}));
};

export const validation = () => {
  return async dispatch => {
    try {
      const res = await getHeaders();
      const hasToken =
        res?.token &&
        typeof res.token === 'string' &&
        res.token.trim().length > 0;

      if (!hasToken) {
        dispatch(setSignedIn(false));
        dispatch(setUser({}));
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
      .then(res => {
        if (res.status === 200) {
          setHeaders(res.data);
          saveUser(res.data.user);
          deleteVerifier();
          dispatch(setSignedIn(true));
          dispatch(setUser(res.data.user));
        } else {
          toast.error(res.data.errors[0] ?? 'Unable to Sign In');
        }
      })
      .catch(() => {
        toast.error('Something went wrong');
        navigate('/');
      });
  };
};

export const signOut = navigation => {
  return async dispatch => {
    try {
      await deleteHeaders();
      await deleteUser();
      await deleteVerifier();
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
    }
  };
};
