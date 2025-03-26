'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    username: string | null;
    userId: number | null;
    login: (username: string, userId: number) => void;
    logout: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            username: null,
            userId: null,
            login: (username, userId) => {
                console.log('Login called with:', username, userId);

                if (typeof window !== 'undefined') {
                    localStorage.setItem('userId', userId.toString());
                }

                set({ isAuthenticated: true, username, userId });
                
                // Log state after login
                console.log(`State after login - isAuthenticated: ${get().isAuthenticated}, username: ${get().username}, userId: ${get().userId}`);
            },
            logout: () => {
                console.log('Logout called');

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('userId');
                }

                set({ isAuthenticated: false, username: null, userId: null });

                // Log state after logout
                console.log(`State after logout - isAuthenticated: ${get().isAuthenticated}, username: ${get().username}, userId: ${get().userId}`);
            },
        }),
        {
            name: 'auth-storage',
            storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
        }
    )
);
