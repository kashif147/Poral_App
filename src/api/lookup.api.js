import request from './request';

export const fetchAllLookupRequest = () => {
  return request.get('/lookup');
};

export const fetchLookupById = id => {
  return request.get(`/lookup/${id}`);
};

export const fetchLookupHierarchyByType = (typeId) => {
  return request.get(`/lookup/by-type/${typeId}/hierarchy`);
};

export const fetchAllCountry = () => {
  return request.get(`/countries`);
};