import apiClient from './apiClient';
import {
    APIResponse,
    ProviderConfig,
    ProviderDetail,
    MetricsSummary,
    ABTestConfig
} from '../types/llm';

export const adminService = {
    // --- Providers ---

    getProviders: async (): Promise<ProviderConfig[]> => {
        const response = await apiClient.get<any>('/api/admin/providers');
        // Handle raw response { providers: [...] } (Actual Backend behavior)
        if (response.data && Array.isArray(response.data.providers)) {
            return response.data.providers.map((p: any) => ({
                ...p,
                supported_models: p.models || p.supported_models || []
            }));
        }
        // Handle wrapper response { status: 'success', data: { providers: [...] } } (Documentation spec)
        if (response.data?.data?.providers) {
            return response.data.data.providers.map((p: any) => ({
                ...p,
                supported_models: p.models || p.supported_models || []
            }));
        }
        return [];
    },

    getProvider: async (id: string): Promise<ProviderDetail> => {
        const response = await apiClient.get<any>(`/api/admin/providers/${id}`);
        // Handle raw response (Actual Backend behavior likely matches list)
        if (response.data && response.data.id) {
            return {
                ...response.data,
                supported_models: response.data.models || response.data.supported_models || []
            };
        }
        // Handle wrapper response
        if (response.data?.data) {
            return {
                ...response.data.data,
                supported_models: response.data.data.models || response.data.data.supported_models || []
            };
        }
        throw new Error('Invalid response format');
    },

    updateProvider: async (id: string, config: Partial<ProviderDetail>): Promise<any> => {
        const response = await apiClient.put<any>(`/api/admin/providers/${id}`, config);
        return response.data?.data || response.data;
    },

    activateProvider: async (id: string): Promise<any> => {
        const response = await apiClient.put<any>(`/api/admin/providers/${id}/activate`);
        return response.data?.data || response.data;
    },

    testProvider: async (id: string, model: string, testMessage: string = 'Hello'): Promise<any> => {
        const response = await apiClient.post<any>(`/api/admin/providers/${id}/test`, {
            model,
            test_message: testMessage
        });
        return response.data?.data || response.data;
    },

    // --- A/B Testing ---

    getABConfig: async (): Promise<ABTestConfig> => {
        const response = await apiClient.get<any>('/api/admin/ab-testing/config');
        return response.data?.data || response.data;
    },

    updateTrafficSplit: async (split: Record<string, number>, testName?: string): Promise<any> => {
        const response = await apiClient.put<any>('/api/admin/ab-testing/traffic-split', {
            split,
            test_name: testName
        });
        return response.data?.data || response.data;
    },

    getABComparison: async (timeRange: string = '24h', metric: string = 'all'): Promise<any> => {
        const response = await apiClient.get<any>('/api/admin/ab-testing/comparison', {
            params: { time_range: timeRange, metric }
        });
        return response.data?.data || response.data;
    },

    // --- Metrics ---

    getMetricsSummary: async (timeRange: string = '24h'): Promise<MetricsSummary> => {
        const response = await apiClient.get<any>('/api/admin/metrics/summary', {
            params: { time_range: timeRange }
        });
        return response.data?.data?.summary || response.data?.summary || response.data;
    },

    getProviderMetrics: async (timeRange: string = '24h'): Promise<any> => {
        const response = await apiClient.get<any>('/api/admin/metrics/providers', {
            params: { time_range: timeRange }
        });
        return response.data?.data?.providers || response.data?.providers || response.data;
    }
};
