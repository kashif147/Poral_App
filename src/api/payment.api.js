import payment_request from './payment_request';

export const createPaymentIntentRequest = data => {
  return payment_request.post('/api/payments/intents', data);
};