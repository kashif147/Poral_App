/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { BASE_URL } from '../constants/api';

const request = axios.create();

request.interceptors.request.use(
  async config => {
    const headers = await getHeaders();
   
    if (headers.token) {
      config.headers['Authorization'] = `Bearer ${headers.token}`;
    }
    config.headers['Content-Type'] = 'application/json';

    config.baseURL = BASE_URL;

    return config;
  },
  error => {
    Promise.reject(error);
  },
);

request.interceptors.response.use(
  res => {
    console.log('✅ API Response:', res.config.url, 'Status:', res.status);
    return res;
  },
  error => {
    console.error('❌ API Error:', error.config?.url, 'Status:', error.response?.status);
    console.error('❌ Error message:', error.message);
    return error.response;
  },
);

export default request;

