import application_request from './application_request';

export const createPaymentIntentRequest = payload => {
  return application_request.post('/payments/create-intent', payload);
};


