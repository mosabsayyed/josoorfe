import apiClient from './apiClient';

// Reporting Desk Service
export const getReportingStats = async () => {
    const response = await apiClient.get('/api/business-chain/counts');
    return response.data;
};
