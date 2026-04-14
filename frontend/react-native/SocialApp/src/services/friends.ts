import api from './api';
import type { Friend, FriendRequest } from '../types';

export interface FriendshipStatus {
  status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  request_id: string | null;
}

export async function sendFriendRequest(toUserId: string): Promise<FriendRequest> {
  const { data } = await api.post<FriendRequest>('/friends/request', {
    to_user_id: toUserId,
  });
  return data;
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await api.delete(`/friends/requests/${requestId}/cancel`);
}

export async function getFriendshipStatus(userId: string): Promise<FriendshipStatus> {
  const { data } = await api.get<FriendshipStatus>(`/friends/status/${userId}`);
  return data;
}

export async function getReceivedRequests(): Promise<FriendRequest[]> {
  const { data } = await api.get<FriendRequest[]>('/friends/requests/received');
  return data;
}

export async function getSentRequests(): Promise<FriendRequest[]> {
  const { data } = await api.get<FriendRequest[]>('/friends/requests/sent');
  return data;
}

export async function acceptRequest(requestId: string): Promise<FriendRequest> {
  const { data } = await api.put<FriendRequest>(`/friends/requests/${requestId}/accept`);
  return data;
}

export async function rejectRequest(requestId: string): Promise<FriendRequest> {
  const { data } = await api.put<FriendRequest>(`/friends/requests/${requestId}/reject`);
  return data;
}

export async function getFriends(): Promise<Friend[]> {
  const { data } = await api.get<Friend[]>('/friends');
  return data;
}

export async function removeFriend(userId: string): Promise<void> {
  await api.delete(`/friends/${userId}`);
}
