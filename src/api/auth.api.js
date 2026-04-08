import request from './request';

export const signInMicrosoftRequest = data => {
  return request.post('/auth/azure-portal', data);
};

export const validationRequest = () => {
  return request.get('/api/me');
};

export const refreshTokenRequest = data => {
  return request.post('/auth/refresh', data);
};