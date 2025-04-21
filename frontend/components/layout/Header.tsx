'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { User, ChevronDown, Search, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/ui/popover";
import { useDebounce } from 'use-debounce';
import useSWR from 'swr';
import { searchContent } from '@/services/api';
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';

interface SearchResults {
  users: UserProfile[];
  posts: Post[];
}

export function Header() {
  const { isAuthenticated, username, userId, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetcher = async (query: string): Promise<SearchResults> => {
    if (!query.trim()) {
      return { users: [], posts: [] };
    }
    const response = await searchContent(query);
    return response.data || { users: [], posts: [] };
  };

  const { data: searchResults, error: searchError, isLoading: isSearchLoading } = useSWR<SearchResults>(
    debouncedQuery,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        const triggerElement = searchRef.current.querySelector('[data-state]');
        if (!triggerElement || !triggerElement.contains(event.target as Node)) {
             setIsSearchOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim()) {
        setIsSearchOpen(true);
    } 
  }, [debouncedQuery]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    logout();
    setIsMenuOpen(false);
    router.push('/login');
  };

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    if (userId) {
      router.push(`/profile/${userId}`);
    } else {
      console.error('User ID not available for profile navigation');
    }
  };

  const handleCreateClick = () => {
    setIsMenuOpen(false);
    router.push('/submit');
  };

  const handleResultClick = (url: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(url);
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
        
        <div className="flex-1 flex justify-center px-8">
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
             <PopoverTrigger asChild>
                 <div ref={searchRef} className="relative w-full max-w-md">
                   <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                     type="search"
                     placeholder="Search users or posts..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-8 pr-4 py-1.5 h-8 text-sm bg-black/10 border-[#343536] focus:border-white/50 focus:bg-black/30 rounded-md text-white placeholder:text-gray-500 w-full"
                     onClick={() => debouncedQuery && setIsSearchOpen(true)}
                   />
                 </div>
             </PopoverTrigger>
             <PopoverContent 
               className="w-[--radix-popover-trigger-width] mt-1 p-0 bg-[#1a1a1b] border-[#343536] text-white" 
               onOpenAutoFocus={(e: Event) => e.preventDefault()}
             >
                 <div className="max-h-[400px] overflow-y-auto text-sm">
                     {isSearchLoading && debouncedQuery && (
                         <div className="p-4 flex items-center justify-center text-gray-400">
                           <Loader2 className="h-4 w-4 animate-spin mr-2" />
                           Searching...
                         </div>
                     )}
                     {!isSearchLoading && !searchResults?.users.length && !searchResults?.posts.length && debouncedQuery && (
                         <div className="p-4 text-center text-gray-500">No results found.</div>
                     )}
                     {searchError && (
                        <div className="p-4 text-center text-red-400">Error: {searchError.message}</div>
                     )}

                     {searchResults && searchResults.users.length > 0 && (
                       <>
                         <div className="px-3 py-1.5 text-xs font-semibold text-gray-400">Users</div>
                         <ul>
                           {searchResults.users.map((user) => (
                             <li key={`user-${user.user_id}`}>
                               <button 
                                 onClick={() => handleResultClick(`/profile/${user.user_id}`)}
                                 className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/10 text-left"
                               >
                                 <User className="h-4 w-4 text-gray-400" />
                                 <span>{user.username}</span>
                               </button>
                             </li>
                           ))}
                         </ul>
                       </>
                     )}

                     {searchResults && searchResults.posts.length > 0 && (
                       <>
                         <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-t border-[#343536] mt-1 pt-2">Posts</div>
                         <ul>
                           {searchResults.posts.map((post) => (
                             <li key={`post-${post.post_id}`}>
                               <button 
                                 onClick={() => handleResultClick(`/post/${post.post_id}`)}
                                 className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/10 text-left"
                               >
                                 <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                 <span className="truncate" title={post.content}>{post.content}</span>
                               </button>
                             </li>
                           ))}
                         </ul>
                       </>
                     )}
                 </div>
             </PopoverContent>
          </Popover>
        </div>
        
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

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1b] border border-[#343536] rounded-md shadow-lg overflow-hidden">
                    <div 
                      onClick={handleProfileClick}
                      className="px-3 py-2 border-b border-[#343536] cursor-pointer transition-colors hover:bg-white/5"
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
                )}
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