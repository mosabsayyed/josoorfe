import apiClient from './apiClient';

/**
 * Service to handle Enterprise Desk data (Capabilities).
 */

export interface EnterpriseChainData {
    nodes: any[];
    edges: any[];
}

// 1. Strategic Initiatives (Capabilities & Gaps)
export const getStrategicInitiatives = async (year: number | string = '0') => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await apiClient.get<EnterpriseChainData>(`/api/business-chain/setting_strategic_initiatives?${params.toString()}`);
    return response.data;
};
