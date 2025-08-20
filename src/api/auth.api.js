import request from './request';

export const signInMicrosoftRequest = data => {
  return request.post('/auth/microsoft', data);
};
