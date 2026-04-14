import api, { saveToken, clearToken } from './api';
import type { AuthResponse, User } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  await saveToken(data.access_token);
  return data;
}

export async function register(
  email: string,
  username: string,
  full_name: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    email,
    username,
    full_name,
    password,
  });
  await saveToken(data.access_token);
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, new_password });
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  await api.post('/auth/change-password', { current_password, new_password });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  return data;
}

export async function logout(): Promise<void> {
  await clearToken();
}
