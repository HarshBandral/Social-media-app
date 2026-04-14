import api, { getToken } from './api';
import { API_URL } from '../constants';
import type { ChatMessage, Conversation } from '../types';

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>('/chat/conversations');
  return data;
}

export async function startConversation(
  userId: string,
  message: string
): Promise<Conversation> {
  const { data } = await api.post<Conversation>('/chat/conversations', {
    user_id: userId,
    message,
  });
  return data;
}

export async function getMessages(
  conversationId: string,
  page: number = 1
): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page } }
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(
    `/chat/conversations/${conversationId}/messages`,
    { content }
  );
  return data;
}

export function createChatWebSocket(
  onMessage: (data: { type: string; message?: ChatMessage; conversation_id?: string; user_id?: string }) => void,
  onError?: (error: Event) => void
): { connect: () => Promise<WebSocket | null>; disconnect: () => void; sendTyping: (conversationId: string) => void } {
  let ws: WebSocket | null = null;

  const connect = async (): Promise<WebSocket | null> => {
    const token = await getToken();
    if (!token) return null;

    const wsUrl = API_URL.replace('http', 'ws');
    ws = new WebSocket(`${wsUrl}/chat/ws/${token}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    ws.onclose = () => {
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        connect();
      }, 3000);
    };

    return ws;
  };

  const disconnect = () => {
    if (ws) {
      ws.onclose = null; // prevent auto-reconnect
      ws.close();
      ws = null;
    }
  };

  const sendTyping = (conversationId: string) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', conversation_id: conversationId }));
    }
  };

  return { connect, disconnect, sendTyping };
}
