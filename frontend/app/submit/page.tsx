'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/services/api';
import { MapPin } from 'lucide-react';

interface Location {
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  state?: string;
}

export default function SubmitPage() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if user is not authenticated or userId is missing
    if (!isAuthenticated || !userId) {
      console.log('Redirecting to login. Why?: ', isAuthenticated, userId);
      router.push('/login');
      return;
    }

    // Attempt to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Reverse geocode location
              const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();

              const address = data.address || {};
              const city = address.city || address.town || address.village || 'Unknown City';
              const state = address.state || '';

              setLocation({
                lat: latitude,
                lon: longitude,
                address: data.display_name,
                city,
                state,
              });
            } catch (err) {
              console.error('Error fetching location:', err);
              setLocation({
                lat: latitude,
                lon: longitude,
              });
            }
          },
          (err) => {
            console.error('Error getting geolocation:', err);
            setError('Please enable location services to create a post.');
          }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, [isAuthenticated, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError('Error: User ID is missing. Please log in again.');
      return;
    }

    if (!location) {
      setError('Location is required to create a post.');
      return;
    }

    if (!content.trim()) {
      setError('Please enter some content for your post.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createPost({
        user_id: userId,  // Ensure user_id is included
        content: content.trim(),
        file_name: "",
		    media: "",
        latitude: location.lat,
        longitude: location.lon,
      });

      router.push('/');
    } catch (err) {
      console.error('Post creation failed:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded px-4 py-3 mb-6 text-sm text-red-400">
                  {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full px-3 py-2 bg-black/40 border border-[#343536] rounded-md text-white text-sm focus:outline-none focus:border-[#4e4f50] transition-colors min-h-[180px] resize-none"
                  maxLength={500}
              />
                <div className="mt-1 text-xs text-[#818384] flex justify-between">
                  <span>{content.length}/500</span>
                </div>
              </div>

              {location && (
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm text-white">
                      <MapPin className="w-4 h-4 mr-2 text-[#818384]" />
                      <span className="font-medium">
                        {location.city}{location.state ? `, ${location.state}` : ''}
                      </span>
                    </div>
                    <div data-testid="location-coordinates" className="text-xs text-[#818384] ml-6">
                      {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                    </div>
                  </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-[#818384] hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading || !location}
                    className="px-4 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white text-black text-sm font-medium rounded-md transition-colors"
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
  );
}
