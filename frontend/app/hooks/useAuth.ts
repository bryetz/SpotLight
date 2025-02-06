'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  userId: number | null;
  login: (username: string, token: string, userId: number) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      token: null,
      userId: null,
      login: (username, token, userId) => {
        console.log('Login called with:', username, token, userId);
        set({ isAuthenticated: true, username, token, userId });
      },
      logout: () => {
        console.log('Logout called');
        set({ isAuthenticated: false, username: null, token: null, userId: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
); 