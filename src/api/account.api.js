import account_request from './account_request';

export const getAccountStatementRequest = memberId => {
  return account_request.get(`/api/reports/member/${memberId}/statement`);
};

export const getAccountNetBalanceRequest = memberId => {
  return account_request.get(`/api/reports/member/${memberId}/net-balance`);
};
