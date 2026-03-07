import apiClient from './apiClient';

export type MCPEntry = {
  label: string;
  url: string;
  allowed_tools: string[];
};

// Generic type - shows ALL fields from API
export type AdminSettings = Record<string, any>;

export async function fetchSettings(_token?: string | null): Promise<AdminSettings> {
  const response = await apiClient.get<AdminSettings>('/api/admin/settings');
  return response.data;
}

export async function saveSettings(settings: AdminSettings, _token?: string | null): Promise<AdminSettings> {
  const response = await apiClient.put<AdminSettings>('/api/admin/settings', settings);
  return response.data;
}
