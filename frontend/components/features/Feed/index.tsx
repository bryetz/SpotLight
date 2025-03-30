"use client";

import { Post } from '@/types/post';
import { PostCard } from '@/components/features/Post/PostCard';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPosts } from '@/services/api';
import { RadiusFilter } from './RadiusFilter';

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(25000); // Default 25km
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const fetchPosts = async (searchRadius: number) => {
    setIsLoading(true);
    try {
      const response = await getPosts({ radius: searchRadius });
      
      console.log('Posts received:', response.data);
      setPosts(response.data || []); // Ensure we always set an array
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts');
      setPosts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(radius);
  }, []);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    fetchPosts(newRadius);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-black/20 backdrop-blur-[4px] border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-white">Feed</h1>
        <button 
          onClick={toggleFilters}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#d7dadc] bg-black/20 hover:bg-black/30 backdrop-blur-[4px] rounded-full transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>
      
      <RadiusFilter 
        initialRadius={radius}
        minRadius={1000}
        maxRadius={50000}
        onRadiusChange={handleRadiusChange}
        isOpen={showFilters}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 data-testid="loader-icon" className="w-6 h-6 text-white animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
          <p className="text-[#818384] text-center">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.post_id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}