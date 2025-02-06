'use client';

import { MapPin, Users, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white big-logo-animation">
          SpotLight
        </h1>
        <p className="mt-4 text-lg text-[#d7dadc]">
          A geolocation-based social media platform
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-400 to-blue-400">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white ml-3">Local Discovery</h2>
          </div>
          <p className="text-[#d7dadc] mt-2">
            Connect with your surroundings in real-time. Share and discover posts from people nearby, creating a dynamic map of local experiences.
          </p>
        </div>
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-400 to-blue-400">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white ml-3">Community Focus</h2>
          </div>
          <p className="text-[#d7dadc] mt-2">
            Build meaningful connections with your local community. Engage with neighbors, discover local events, and stay connected to what matters most.
          </p>
        </div>
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
          <div className="flex items-center mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-400 to-blue-400">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white ml-3">Global Reach</h2>
          </div>
          <p className="text-[#d7dadc] mt-2">
            While rooted in local connections, explore content from around the world. See what's happening in different locations and broaden your perspective.
          </p>
        </div>
      </div>
    </main>
  );
} 