import request from './request';

export const fetchAllCategoryRequest = () => {
  return request.get('/api/products');
};

export const fetchCategoryByTypeId = id => {
  return request.get(`/api/products/by-type/${id}`);
};

export const fetchCategoryByCategoryId = (categoryId) => {
  return request.get(`/api/products/${categoryId}`);
};
