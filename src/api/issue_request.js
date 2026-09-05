/* eslint-disable dot-notation */
import axios from 'axios';
import { getHeaders } from '../helpers/auth.helper';
import { ISSUE_URL } from '../constants/api';

const issue_request = axios.create();

issue_request.interceptors.request.use(
  async config => {
    const headers = await getHeaders();

    if (headers?.token) {
      config.headers['Authorization'] = `Bearer ${headers.token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    config.baseURL = ISSUE_URL;
    return config;
  },
  error => Promise.reject(error),
);

issue_request.interceptors.response.use(
  res => res,
  error => error.response,
);

export default issue_request;
