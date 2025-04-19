'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MapPin, Calendar, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { isAuthenticated, username } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait a brief moment to check auth state
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{username}</h1>
              <div className="flex items-center mt-2 text-[#818384]">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-sm">Joined March 2025</span>
              </div>
            </div>
            <button className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-4 h-4 mr-2 text-white" />
              <span className="text-sm text-white">Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4">
            <h3 className="text-sm text-[#818384] mb-1">Total Posts</h3>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4">
            <h3 className="text-sm text-[#818384] mb-1">Locations</h3>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4">
            <h3 className="text-sm text-[#818384] mb-1">Interactions</h3>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-[#818384]">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </main>
  );
} 