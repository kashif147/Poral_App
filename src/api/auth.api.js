import request from './request';

export const signInMicrosoftRequest = data => {
  return request.post('/auth/azure-portal', data);
};

export const validationRequest = () => {
  return request.post('/auth/me');
};