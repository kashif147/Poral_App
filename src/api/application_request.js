/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { PORTAL_URL } from '../constants/api';

const application_request = axios.create();

application_request.interceptors.request.use(
  async config => {
    try {
      const { token } = await getHeaders();
      if (token) {
        // token may already include 'Bearer '
        config.headers['Authorization'] = token;
      }
    } catch {}
    config.headers['Content-Type'] = 'application/json';
    config.baseURL = PORTAL_URL;
    return config;
  },
  error => Promise.reject(error),
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
