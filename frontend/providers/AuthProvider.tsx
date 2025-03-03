'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login } = useAuth();

  useEffect(() => {
    // Check for existing auth on mount
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (userId && username) {
      login(username, parseInt(userId, 10));
    }
  }, [login]);

  return <>{children}</>;
}