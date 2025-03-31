'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    username: string | null;
    userId: number | null;
    isLoading: boolean;
    login: (username: string, userId: number) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            username: null,
            userId: null,
            isLoading: true,
            login: (username, userId) => {
                console.log('Login called with:', username, userId);

                if (typeof window !== 'undefined') {
                    localStorage.setItem('userId', userId.toString());
                }

                set({ isAuthenticated: true, username, userId, isLoading: false });
                
                // Log state after login
                console.log(`State after login - isAuthenticated: ${get().isAuthenticated}, username: ${get().username}, userId: ${get().userId}`);
            },
            logout: () => {
                console.log('Logout called');

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('userId');
                }

                set({ isAuthenticated: false, username: null, userId: null, isLoading: false });

                // Log state after logout
                console.log(`State after logout - isAuthenticated: ${get().isAuthenticated}, username: ${get().username}, userId: ${get().userId}`);
            },
            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
            onRehydrateStorage: () => (state) => {
                // When storage is rehydrated, set loading to false
                if (state) {
                    state.setLoading(false);
                }
            },
        }
    )
);
