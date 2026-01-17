import apiClient from './apiClient';

// Controls Desk Service
export const getControlStats = async () => {
    const response = await apiClient.get('/api/domain-graph/stats');
    return response.data;
};
