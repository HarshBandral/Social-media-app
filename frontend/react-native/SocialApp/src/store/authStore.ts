import { create } from 'zustand';
import type { User } from '../types';
import * as authService from '../services/auth';
import { getToken } from '../services/api';
import { queryClient } from '../services/queryClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const response = await authService.login(email, password);
    // Clear all cached data from previous user
    queryClient.clear();
    set({ user: response.user, isAuthenticated: true });
  },

  register: async (email, username, fullName, password) => {
    const response = await authService.register(email, username, fullName, password);
    queryClient.clear();
    set({ user: response.user, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    // Clear ALL cached queries so next user gets fresh data
    queryClient.clear();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await getToken();
      if (token) {
        const user = await authService.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
