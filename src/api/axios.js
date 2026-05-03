import axios from 'axios';

const apiActivityListeners = new Set();
let activeRequestCount = 0;

function notifyApiActivity() {
    apiActivityListeners.forEach((listener) => {
        listener(activeRequestCount);
    });
}

function startApiActivity() {
    activeRequestCount += 1;
    notifyApiActivity();
}

function stopApiActivity() {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    notifyApiActivity();
}

export function subscribeToApiActivity(listener) {
    apiActivityListeners.add(listener);
    listener(activeRequestCount);

    return () => {
        apiActivityListeners.delete(listener);
    };
}

const configuredBaseUrl = String(import.meta.env.VITE_API_URL || 'http://localhost:8080').trim();
const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;

console.log('[Axios] Configured API Base URL:', normalizedBaseUrl);

const api = axios.create({
    baseURL: normalizedBaseUrl,
    withCredentials: true,
    timeout: 10000
});

const AUTH_TOKEN_KEY = 'scraply_auth_token';

// Request interceptor
api.interceptors.request.use(
    (config) => {
        config.__trackGlobalLoader = config.showGlobalLoader !== false;

        if (config.__trackGlobalLoader) {
            startApiActivity();
        }

        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const hasToken = !!token;

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`[Axios] ${config.method.toUpperCase()} ${config.url} - Token: ${hasToken ? '✓' : '✗'}`);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        if (response.config?.__trackGlobalLoader) {
            stopApiActivity();
        }

        const dataLength = Array.isArray(response.data) ? response.data.length : (typeof response.data === 'object' ? Object.keys(response.data || {}).length : 'N/A');
        console.log(`[Axios] Response ${response.status} from ${response.config.url} - Data items: ${dataLength}`);

        return response;
    },
    (error) => {
        if (error.config?.__trackGlobalLoader) {
            stopApiActivity();
        }

        console.error(`[Axios] Error ${error.response?.status || 'unknown'} from ${error.config?.url}:`, error.response?.data || error.message);

        if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            console.warn('[Axios] Unauthorized API request (401). Session may be expired.');
        }
        return Promise.reject(error);
    }
);

export default api;
