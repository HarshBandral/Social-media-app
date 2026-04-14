import api from './api';
import type { Comment } from '../types';

export async function getComments(postId: string, page: number = 1): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/posts/${postId}/comments`, {
    params: { page },
  });
  return data;
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  const { data } = await api.post<Comment>(`/posts/${postId}/comments`, { content });
  return data;
}

export async function getReplies(
  postId: string,
  commentId: string,
  page: number = 1
): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(
    `/posts/${postId}/comments/${commentId}/replies`,
    { params: { page } }
  );
  return data;
}

export async function replyToComment(
  postId: string,
  commentId: string,
  content: string
): Promise<Comment> {
  const { data } = await api.post<Comment>(
    `/posts/${postId}/comments/${commentId}/replies`,
    { content }
  );
  return data;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}
