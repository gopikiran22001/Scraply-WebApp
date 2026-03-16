import axios from 'axios';

const configuredBaseUrl = String(import.meta.env.VITE_API_URL || 'http://localhost:8080').trim();
const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;

const api = axios.create({
    baseURL: normalizedBaseUrl,
    withCredentials: true,
    timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // You can add auth headers here if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized API request. Session may be expired.');
        }
        return Promise.reject(error);
    }
);

export default api;
