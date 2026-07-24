import axios from "axios";
import { getToken } from "./tokenService";

const API = axios.create({
    baseURL: 'https://monthend.onrender.com/api',
    timeout: 60000
});

API.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Retry interceptor for Render free tier cold starts
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (config && (!config._retryCount || config._retryCount < 2) && (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response)) {
      config._retryCount = (config._retryCount || 0) + 1;
      console.log(`Backend may be starting up (Render free tier). Retrying request (${config._retryCount}/2)...`);
      return new Promise((resolve) => setTimeout(() => resolve(API(config)), 3000));
    }
    return Promise.reject(error);
  }
);

export default API;