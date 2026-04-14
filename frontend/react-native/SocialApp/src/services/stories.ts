import api from './api';
import type { Story, StoryGroup } from '../types';

export async function getStoriesFeed(): Promise<StoryGroup[]> {
  const { data } = await api.get<StoryGroup[]>('/stories');
  return data;
}

export async function getMyStories(): Promise<Story[]> {
  const { data } = await api.get<Story[]>('/stories/me');
  return data;
}

export async function createStory(imageUri: string): Promise<Story> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'story.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const { data } = await api.post<Story>('/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteStory(storyId: string): Promise<void> {
  await api.delete(`/stories/${storyId}`);
}
