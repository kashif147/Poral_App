/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { EVENTS_URL } from '../constants/api';

const events_request = axios.create();

events_request.interceptors.request.use(
  async config => {
    const headers = await getHeaders();

    if (headers?.token) {
      config.headers['Authorization'] = `Bearer ${headers.token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.baseURL = EVENTS_URL;

    return config;
  },
  error => Promise.reject(error),
);

events_request.interceptors.response.use(
  res => res,
  error => error.response,
);

export default events_request;
