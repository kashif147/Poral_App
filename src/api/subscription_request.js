/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { SUBSCRIPTION_URL } from '../constants/api';

const subscription_request = axios.create();

subscription_request.interceptors.request.use(
  async config => {
    const headers = await getHeaders();
    if (headers.token) {
      config.headers['Authorization'] = `Bearer ${headers.token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.baseURL = SUBSCRIPTION_URL;
    return config;
  },
  error => {
    Promise.reject(error);
  },
);

subscription_request.interceptors.response.use(
  res => {
    return res;
  },
  error => {
    return error.response;
  },
);

export default subscription_request;
