import api from './api';
import type { Post } from '../types';

export async function getFeed(page: number = 1): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/posts', { params: { page } });
  return data;
}

export async function getUserPosts(userId: string, page: number = 1): Promise<Post[]> {
  const { data } = await api.get<Post[]>(`/posts/user/${userId}`, { params: { page } });
  return data;
}

export async function getPost(postId: string): Promise<Post> {
  const { data } = await api.get<Post>(`/posts/${postId}`);
  return data;
}

export async function createPost(imageUri: string, caption?: string): Promise<Post> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  if (caption) {
    formData.append('caption', caption);
  }

  const { data } = await api.post<Post>('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}`);
}

export async function likePost(postId: string): Promise<void> {
  await api.post(`/posts/${postId}/like`);
}

export async function unlikePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}/like`);
}

export async function bookmarkPost(postId: string): Promise<void> {
  await api.post(`/posts/${postId}/bookmark`);
}

export async function unbookmarkPost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}/bookmark`);
}

export async function getSavedPosts(page: number = 1): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/posts/saved/all', { params: { page } });
  return data;
}
