import axios from 'axios';
import {
  signInMicrosoftRequest,
} from '../api/auth.api';
import { deleteHeaders, deleteUser, getHeaders, getUser, saveUser, setHeaders } from '../helpers/auth.helper';
import { deleteVerifier } from '../helpers/verifier.helper';
import { setSignedIn, setUser } from '../store/slice/auth.slice';
import { microSoftUrlRedirect } from '../helpers/B2C.helper';

export const validation = () => {
  return async (dispatch) => {
    try {
      const res = getHeaders();
      const user = getUser()
      if (res?.token && user?.user) {
        dispatch(setSignedIn(true));
        dispatch(setUser(JSON.parse(user?.user)));
      } else {
        dispatch(setSignedIn(false));
      }
    } catch (error) {
      dispatch(setSignedIn(false));
    }
  };
};

export const signInMicrosoft = data => {
  return dispatch => {
    signInMicrosoftRequest(data)
      .then(res => {
        if (res.status === 200) {
          setHeaders(res.data);
          saveUser(res.data.user)
          deleteVerifier()
          dispatch(setSignedIn(true));
          dispatch(setUser(res.data.user));
        } else {
          toast.error(res.data.errors[0] ?? 'Unable to Sign In');
        }
      })
      .catch(() => {
        toast.error('Something went wrong')
        navigate('/')
      });
  };
};


export const signOut = (navigate) => {
  return async (dispatch) => {
    try {
      dispatch(setSignedIn(false));
      dispatch(setUser({}));
      deleteHeaders();
      deleteUser();
      navigate('/')
      // await microSoftUrlRedirect();
    } catch (error) {
      toast.error('Something went wrong');
    }
  };
};
