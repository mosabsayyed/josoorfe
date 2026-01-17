import axios from 'axios';

// Create generic axios instance
const apiClient = axios.create({
    baseURL: '/', // Rely on Vite proxy to route to /api or /api/v1
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Language
apiClient.interceptors.request.use(
    (config) => {
        // 1. Auth: Look for token in localStorage
        // Common keys: 'access_token' or 'sb-access-token' (Supabase)
        const token = localStorage.getItem('access_token') || localStorage.getItem('sb-access-token');

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
