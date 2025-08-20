/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { BASE_URL } from '../constants/api';

const request = axios.create();

request.interceptors.request.use(
  config => {
    const headers = getHeaders();
    config.headers['Authorization'] = headers.token;
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
    return res;
  },
  error => {
    return error.response;
  },
);

export default request;
