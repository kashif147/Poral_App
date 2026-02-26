/* eslint-disable dot-notation */
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';   // 👈 import UUID
import { getHeaders } from '../helpers/auth.helper';
import { ACCOUNT_URL } from '../constants/api';

const payment_request = axios.create();

payment_request.interceptors.request.use(
  async config => {
    const headers = await getHeaders();
    const idempotencyKey = await uuidv4(); 
    if (headers?.token) {
      config.headers['Authorization'] = `Bearer ${headers?.token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.headers['x-idempotency-key'] = idempotencyKey; 
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
    return error.response;
  },
);

export default payment_request;
