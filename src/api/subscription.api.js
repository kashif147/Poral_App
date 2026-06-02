import subscription_request from './subscription_request';

export const getSubscriptionRequest = profileId => {
  return subscription_request.get(`/api/v1/subscriptions/profile/${profileId}`);
};
