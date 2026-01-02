/* eslint-disable dot-notation */
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';   // 👈 import UUID
import { getHeaders } from '../helpers/auth.helper';
import { ACCOUNT_URL } from '../constants/api';

const payment_request = axios.create();

payment_request.interceptors.request.use(
  async config => {
    const { token } = await getHeaders();
    config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['Content-Type'] = 'application/json';
    config.headers['x-idempotency-key'] = uuidv4(); 
    config.baseURL = ACCOUNT_URL;

    return config;
  },
  error => Promise.reject(error),
);

payment_request.interceptors.response.use(
  res => {
    return res;
  },
  error => {
    return Promise.reject(error);
  },
);

export default payment_request;
