import profile_request from './profile_request';

const PORTAL_PAYMENT_FORMS_BASE = '/api/payment-forms/portal';

export const getPortalPaymentForm = () => {
  return profile_request.get(`${PORTAL_PAYMENT_FORMS_BASE}/`);
};

export const getMyPortalPaymentForms = () => {
  return profile_request.get(`${PORTAL_PAYMENT_FORMS_BASE}/mine`);
};

export const getPaymentFormPrefill = profileId => {
  return profile_request.get('/api/payment-forms/prefill', {
    params: { profileId },
  });
};

export const createPortalPaymentForm = data => {
  return profile_request.post(`${PORTAL_PAYMENT_FORMS_BASE}/`, data);
};

export const updatePortalPaymentForm = data => {
  return profile_request.patch(`${PORTAL_PAYMENT_FORMS_BASE}/`, data);
};

export const submitPortalPaymentForm = id => {
  return profile_request.post(`${PORTAL_PAYMENT_FORMS_BASE}/${id}/submit`);
};

export const uploadPortalPaymentSignature = (id, data) => {
  return profile_request.post(
    `${PORTAL_PAYMENT_FORMS_BASE}/${id}/upload-signature`,
    data,
  );
};

export const uploadPortalPaymentSignatureFile = formData => {
  return profile_request.post(
    `${PORTAL_PAYMENT_FORMS_BASE}/upload-signature`,
    formData,
  );
};

export const uploadPortalPaymentSigned = formData => {
  return profile_request.post(`${PORTAL_PAYMENT_FORMS_BASE}/upload-signed`, formData);
};
