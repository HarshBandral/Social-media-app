import api from './api';
import type { User } from '../types';

export async function getUser(userId: string): Promise<User> {
  const { data } = await api.get<User>(`/users/${userId}`);
  return data;
}

export async function updateProfile(updates: {
  full_name?: string;
  bio?: string;
  username?: string;
}): Promise<User> {
  const { data } = await api.put<User>('/users/me', updates);
  return data;
}

export async function updatePrivacy(isPrivate: boolean): Promise<User> {
  const { data } = await api.patch<User>('/users/me/privacy', {
    is_private: isPrivate,
  });
  return data;
}

export async function uploadAvatar(imageUri: string): Promise<User> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const { data } = await api.post<User>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await api.get<User[]>(`/users/search/${query}`);
  return data;
}

export async function getRecommendedUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users/recommended');
  return data;
}
