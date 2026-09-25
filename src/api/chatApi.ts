import apiClient from './client';

export interface ChatMessageResponse {
  message: string;
  blocks?: any[];
  citations?: any[];
}

export const chatApi = {
  sendMessage: async (message: string): Promise<ChatMessageResponse> => {
    const response = await apiClient.post<ChatMessageResponse>('/api/chat/message', { message });
    return response.data;
  },
};
