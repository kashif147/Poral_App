import profile_request from './profile_request';

export const profileRequest = data => {
  return profile_request.post('/api/transfer-request', data);
};

export const fetchProfileRequest = () => {
  return profile_request.get('/api/profile/my-profile');
};

export const fetchProfileByIdRequest = id => {
  return profile_request.get(`/api/profile/${id}`);
};

export const fetchTransferRequest = () => {
  return profile_request.get('/api/transfer-request/portal');
};

export const updateProfileRequest = data => {
  return profile_request.put('/api/profile/my-profile', data);
};
