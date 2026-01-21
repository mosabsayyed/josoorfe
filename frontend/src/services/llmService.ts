import apiClient from './apiClient';
import { LLMRequest, APIResponse, LLMResponseData } from '../types/llm';

export const llmService = {
    /**
     * Execute a completion request against the active LLM provider
     */
    execute: async (request: LLMRequest): Promise<LLMResponseData> => {
        try {
            const response = await apiClient.post<APIResponse<LLMResponseData>>('/api/llm/execute', request);

            if (response.data.status === 'error') {
                throw new Error(response.data.error?.message || 'Unknown error occurred');
            }

            if (!response.data.data) {
                throw new Error('No data received from LLM provider');
            }

            return response.data.data;
        } catch (error: any) {
            // If the error comes from the API response (e.g. 400, 500 but with JSON body)
            if (error.response && error.response.data && error.response.data.error) {
                throw new Error(error.response.data.error.message);
            }
            throw error;
        }
    }
};
