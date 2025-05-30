'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/services/api';
import { MapPin, Image, X, ChartNoAxesColumnDecreasing } from 'lucide-react';

interface Location {
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  state?: string;
}

// File configuration
const MB_IN_BYTES = 1024 * 1024;
const MAX_FILE_SIZE_MB = 100; // Easily change this value to any MB limit
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * MB_IN_BYTES;

// Add supported file types with more video formats
const SUPPORTED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  // Videos
  'video/mp4',
  'video/quicktime', // .mov files
  'video/x-msvideo',  // .avi files
  'video/webm'
];

export default function SubmitPage() {
  const { isAuthenticated, userId, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Add media states
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');

  useEffect(() => {
    // Only proceed with auth check after useAuth has finished loading
    if (!isAuthLoading) {
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
    }
  }, [isAuthenticated, userId, isAuthLoading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setError(`Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.map(type => type.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / MB_IN_BYTES).toFixed(1)}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result will be a data URL like "data:image/jpeg;base64,/9j/4AAQ..."
      // We store the full data URL for preview
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setMediaFile(file);
    setError('');
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

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
      let mediaData = '';
      let fileName = '';

      if (mediaFile) {
        // Read file as base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            // Extract only the base64 data part after the comma
            // e.g., from "data:image/jpeg;base64,/9j/4AAQ..." we only want "/9j/4AAQ..."
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(mediaFile);
        mediaData = await base64Promise;
        fileName = mediaFile.name;
      }

      const postData = {
        user_id: userId,
        content: content.trim(),
        file_name: fileName,
        media: mediaData,
        latitude: location.lat,
        longitude: location.lon,
      };

      await createPost(postData);
      router.push('/');
    } catch (err) {
      console.error('Post creation failed:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while useAuth is determining status
  if (isAuthLoading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

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

            {/* Media Upload Section */}
            <div className="space-y-2">
              {mediaPreview ? (
                <div className="relative">
                  {mediaFile?.type.startsWith('image/') ? (
                    <img 
                      src={mediaPreview} 
                      alt="Upload preview" 
                      className="max-h-64 rounded-lg object-contain bg-black/40"
                    />
                  ) : (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="max-h-64 rounded-lg w-full"
                    />
                  )}
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept={SUPPORTED_FILE_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#343536] rounded-lg hover:border-[#4e4f50] transition-colors">
                    <div className="flex flex-col items-center text-[#818384]">
                      <Image className="w-6 h-6 mb-2" />
                      <span className="text-sm">Add Image or Video</span>
                      <span className="text-xs mt-1">Max size: {MAX_FILE_SIZE_MB}MB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Location Display */}
            {location && (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center text-sm text-white">
                  <MapPin className="w-4 h-4 mr-2 text-[#818384]" />
                  <span className="font-medium">
                    {location.city}{location.state ? `, ${location.state}` : ''}
                  </span>
                </div>
                <div className="text-xs text-[#818384] ml-6">
                  {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                </div>
              </div>
            )}

            {/* Existing Submit Buttons */}
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