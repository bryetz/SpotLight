'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/app/lib/api';
import { useAuth } from '@/app/hooks/useAuth';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login: setAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const response = await login(username, password);
        
        // Store auth token and update auth state
        console.log('Response from login is:', response.data);
        console.log('Response from login is:', response.data.token);
        const token = response.data.token;
        localStorage.setItem('authToken', token);
        setAuth(username, token, 1); // TODO: remove this, this is placeholder because there is no user id in the database yet
        
        // Redirect to home page
        router.push('/');
        router.refresh();
      } else {
        // Registration mode
        await register(username, password);
        
        // Automatically log in the user after successful registration
        const loginResponse = await login(username, password);
        const token = loginResponse.data.token;
        localStorage.setItem('authToken', token);
        setAuth(username, token, 1);
        
        // Redirect to home page
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded px-4 py-3 mb-6 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#d7dadc] mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-[#343536] rounded-md text-white text-sm focus:outline-none focus:border-[#4e4f50] transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#d7dadc] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-[#343536] rounded-md text-white text-sm focus:outline-none focus:border-[#4e4f50] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-white hover:bg-gray-200 text-black font-medium rounded-md transition-colors"
            >
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#818384]">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-white hover:text-[#d7dadc] transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-white hover:text-[#d7dadc] transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 