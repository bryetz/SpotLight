'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Post } from '@/types/post';
import { PostCard } from '@/components/features/Post/PostCard';
import { getPost } from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function PostPage() {
    const params = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await getPost(params.id as string);
                setPost(response.data);
            } catch (error) {
                console.error('Error fetching post:', error);
                setError('Failed to load post');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-black/20 backdrop-blur-[4px] border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-center">{error || 'Post not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-6">
            <PostCard post={post} />
            {/* Comments section will be added here */}
        </main>
    );
} 