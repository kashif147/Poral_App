/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { PORTAL_URL } from '../constants/api';

const application_request = axios.create();

application_request.interceptors.request.use(
  config => {
    const headers = getHeaders();
    console.log('Headers======>',headers.token);
    config.headers['Authorization'] = headers.token;
    config.headers['Content-Type'] = 'application/json';

    config.baseURL = PORTAL_URL;

    return config;
  },
  error => {
    Promise.reject(error);
  },
);

application_request.interceptors.response.use(
  res => {
    return res;
  },
  error => {
    return error.response;
  },
);

export default application_request;
