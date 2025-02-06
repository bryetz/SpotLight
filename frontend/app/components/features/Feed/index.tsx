"use client";

import { Post } from '@/app/types/post';
import { PostCard } from '@/app/components/features/Post/PostCard';
import { SlidersHorizontal } from 'lucide-react';

export function Feed({ initialPosts }: { initialPosts: Post[] }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-white">Feed</h1>
        <button className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#d7dadc] bg-black/20 hover:bg-black/30 backdrop-blur-[4px] rounded-full transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>
      <div className="space-y-4">
        {initialPosts.map((post) => (
          <PostCard key={post.post_id} post={post} />
        ))}
      </div>
    </div>
  );
}