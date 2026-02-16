/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { ACCOUNT_URL } from '../constants/api';

const account_request = axios.create();

account_request.interceptors.request.use(
  async config => {
    const headers = await getHeaders();
    if (headers?.token) {
      config.headers['Authorization'] = `Bearer ${headers.token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.baseURL = ACCOUNT_URL;

    return config;
  },
  error => {
    Promise.reject(error);
  },
);

account_request.interceptors.response.use(
  res => {
    return res;
  },
  error => {
    return error.response;
  },
);

export default account_request;
