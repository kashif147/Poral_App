import request from './request';

export const createPolicyEvaluationRequest = data => {
  return request.post('/policy/evaluate', data);
};