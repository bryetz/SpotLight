'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { isAuthenticated, username, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername && !isAuthenticated) {
      login(storedUsername, token, 1); // TODO: remove this, this is placeholder because there is no user id in the database yet
    }

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    logout();
    setIsMenuOpen(false);
    router.push('/login'); // Redirect to login page
  };

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    router.push('/profile');
  };

  const handleCreateClick = () => {
    setIsMenuOpen(false);
    router.push('/submit');
  };

  return (
    <header className="bg-black/20 backdrop-blur-[4px] border-b border-[#343536] sticky top-0 z-[100]">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-lg font-bold logo-hover"
        >
          SpotLight
        </Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <button 
			  	className="px-4 py-1.5 bg-white hover:bg-gray-200 text-[#000000] text-xs font-medium rounded-[4px] transition-colors duration-100"
				onClick={handleCreateClick}
			  >
                Create
              </button>
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-1 p-1 hover:bg-white/5 rounded-md transition-colors"
                >
                  <User className="w-5 h-5 text-white" />
                  <ChevronDown className={`w-4 h-4 text-white transition-transform duration-100 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-48 bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg shadow-lg overflow-hidden transition-all duration-100 origin-top-right ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div 
                    onClick={handleProfileClick}
                    className="px-3 py-2 border-b border-[#343536] cursor-pointer transition-colors"
                  >
                    <div className="text-sm font-medium text-white">{username}</div>
                    <div className="text-xs text-[#818384] hover:text-white transition-colors">View Profile</div>
                  </div>
                  
                  <div className="py-1">
                    <button 
                      className="w-full px-3 py-1.5 text-sm text-white hover:bg-white/5 text-left transition-colors"
                      onClick={handleProfileClick}
                    >
                      Profile
                    </button>
                    <button 
                      className="w-full px-3 py-1.5 text-sm text-white hover:bg-white/5 text-left transition-colors"
                      onClick={() => {/* Handle settings */}}
                    >
                      Settings
                    </button>
                    <button 
                      className="w-full px-3 py-1.5 text-sm text-red-400 hover:bg-white/5 text-left transition-colors"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link 
              href="/login"
              className="text-sm text-white hover:text-[#d7dadc] transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}