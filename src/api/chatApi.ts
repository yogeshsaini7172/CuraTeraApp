import apiClient from './client';

export interface ChatMessageResponse {
  message: string;
  blocks?: any[];
  citations?: any[];
  citizen_profile?: any;
}

export const chatApi = {
  sendMessage: async (message: string): Promise<ChatMessageResponse> => {
    const response = await apiClient.post<ChatMessageResponse>('/api/chat/message', { message });
    return response.data;
  },
  getHistory: async (): Promise<{ messages: any[] }> => {
    const response = await apiClient.get<{ messages: any[] }>('/api/chat/history');
    return response.data;
  },
};
