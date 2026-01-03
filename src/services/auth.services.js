import { signInMicrosoftRequest } from '../api/auth.api';
import {
  deleteHeaders,
  deleteUser,
  getHeaders,
  getUser,
  saveUser,
  setHeaders,
} from '../helpers/auth.helper';
import { deleteVerifier } from '../helpers/verifier.helper';
import { setSignedIn, setUser } from '../store/slice/auth.slice';

export const validation = () => {
  return async dispatch => {
    try {
      const res = await getHeaders();
      const user = await getUser();
      if (
        res?.token &&
        typeof res.token === 'string' &&
        res.token.trim().length > 0 &&
        user?.user &&
        typeof user.user === 'string' &&
        user.user.trim().length > 0
      ) {
        dispatch(setSignedIn(true));
        try {
          const parsedUser = JSON.parse(user.user);
          dispatch(setUser(parsedUser));
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          dispatch(setUser({}));
        }
      } else {
        dispatch(setSignedIn(false));
        dispatch(setUser({}));
      }
    } catch (error) {
      console.error('Validation error:', error);
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
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
