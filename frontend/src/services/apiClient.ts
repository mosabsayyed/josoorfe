import axios from 'axios';

// Get base URL from environment (same logic as adminSettingsService)
const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;
const RAW_API_BASE =
    (VITE_ENV?.VITE_API_URL as string | undefined) ||
    (VITE_ENV?.VITE_API_BASE as string | undefined) ||
    (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
    (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
    '';

// Remove trailing slashes and extract base URL (without /api/v1 suffix)
const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '').replace(/\/api\/v1$/, '') : '';

// Create generic axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL || '/', // Use external backend URL or fall back to relative path
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Language
apiClient.interceptors.request.use(
    (config) => {
        // 1. Auth: Look for token in localStorage. aligned with authService.ts (josoor_token)
        // Common keys: 'access_token' or 'sb-access-token' (Supabase)
        const token = localStorage.getItem('josoor_token') || localStorage.getItem('access_token') || localStorage.getItem('sb-access-token');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 2. Language: Look for i18n preference
        const lang = localStorage.getItem('i18nextLng') || 'en';
        config.headers['Accept-Language'] = lang;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 (Optional - redirect directly to login?)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized (e.g., clear token, redirect to login)
            console.warn('Unauthorized access. Token might be expired.');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
