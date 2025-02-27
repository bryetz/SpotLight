'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login } = useAuth();

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    if (token && storedUsername && userId) {
      login(storedUsername, token, parseInt(userId));
    }
  }, []);

  return <>{children}</>;
} 