import application_request from './application_request';

export const createPaymentIntentRequest = payload => {
  // Backend should calculate amount based on membership category and return clientSecret
  // Payload may include: { membershipCategory, email, name, description, customPrice }
  return application_request.post('/payments/create-intent', payload);
};


