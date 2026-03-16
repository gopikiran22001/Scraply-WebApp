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

const AUTH_TOKEN_KEY = 'scraply_auth_token';

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

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
            localStorage.removeItem(AUTH_TOKEN_KEY);
            console.warn('Unauthorized API request. Session may be expired.');
        }
        return Promise.reject(error);
    }
);

export default api;
