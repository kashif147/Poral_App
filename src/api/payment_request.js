/* eslint-disable dot-notation */
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';   // 👈 import UUID
import { getHeaders } from '../helpers/auth.helper';
import { ACCOUNT_URL } from '../constants/api';

const payment_request = axios.create();

payment_request.interceptors.request.use(
  async config => {
    const { token } = await getHeaders();
    console.log('💳 Payment request headers:', token);

    config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['Content-Type'] = 'application/json';
    config.headers['x-idempotency-key'] = uuidv4(); 
    config.baseURL = ACCOUNT_URL;
    console.log('💳 Payment request URL:', config.baseURL + config.url);

    return config;
  },
  error => Promise.reject(error),
);

payment_request.interceptors.response.use(
  res => {
    console.log('✅ Payment API Response:', res.config.url, 'Status:', res.status);
    return res;
  },
  error => {
    console.error('❌ Payment API Error:', error.config?.url, 'Status:', error.response?.status);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error response:', error.response?.data);
    return Promise.reject(error);
  },
);

export default payment_request;
