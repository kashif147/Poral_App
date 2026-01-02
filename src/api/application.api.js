import application_request from './application_request';

export const fetchPersonalDetail = () => {
  return application_request.get('/api/personal-details');
};

export const createPersonalDetailRequest = data => {
  return application_request.post('/api/personal-details', data);
};

export const updatePersonalDetailRequest = (id, data) => {
  return application_request.put(`/api/personal-details/${id}`, data);
};

export const deletePersonalDetailRequest = () => {
  return application_request.put('/api/personal-details');
};

export const fetchProfessionalDetail = id => {
  return application_request.get(`/api/professional-details/${id}`);
};

export const createProfessionalDetailRequest = (id, data) => {
  return application_request.post(`/api/professional-details/${id}`, data);
};

export const updateProfessionalDetailRequest = (id, data) => {
  return application_request.put(`/api/professional-details/${id}`, data);
};

export const deleteProfessionalDetailRequest = () => {
  return application_request.put('/api/professional-details');
};

export const fetchSubscriptionDetail = id => {
  return application_request.get(`/api/subscription-details/${id}`);
};

export const createSubscriptionDetailRequest = (id, data) => {
  return application_request.post(`/api/subscription-details/${id}`, data);
};

export const updateSubscriptionDetailRequest = (id, data) => {
  return application_request.put(`/api/subscription-details/${id}`, data);
};

export const deleteSubscriptionDetailRequest = () => {
  return application_request.put('/api/subscription-details');
};

export const applicationConfirmationRequest = (id) => {
  return application_request.get(`/api/personal-details/${id}/status`);
};