import request from './request';

export const fetchAllLookupRequest = () => {
  return request.get('/api/lookup');
};

export const fetchLookupById = id => {
  return request.get(`/api/lookup/${id}`);
};

export const fetchLookupHierarchyByType = (typeId) => {
  return request.get(`/api/lookup/by-type/${typeId}/hierarchy`);
};

export const fetchAllCountry = () => {
  return request.get(`/api/countries`);
};