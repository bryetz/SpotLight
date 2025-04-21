"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPostById } from '@/services/api';
import { Post } from '@/types/post';
import { PostCard } from '@/components/features/Post/PostCard';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PostPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params?.id ? Number(params.id) : null;

    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (postId !== null && !isNaN(postId)) {
            setIsLoading(true);
            setError(null);
            getPostById(postId)
                .then(response => {
                    console.log("Fetched post data:", response.data);
                    // Check if the response data is a valid post object
                    if (response.data && typeof response.data === 'object' && response.data.post_id) {
                         setPost(response.data as Post);
                    } else {
                         // Handle cases where the API might return unexpected data format or an empty object
                         console.error("Invalid post data received:", response.data);
                         setError("Post not found or invalid data format.");
                         setPost(null); // Ensure post state is cleared
                    }
                })
                .catch(err => {
                    console.error(`Error fetching post ${postId}:`, err);
                    if (err.response?.status === 404) {
                        setError("Post not found.");
                    } else {
                        // Try to parse error message from backend response
                        let backendMessage = "Failed to load post.";
                        try {
                             if (err.response?.data) {
                                if (err.response.data instanceof ArrayBuffer) {
                                    const decodedString = new TextDecoder().decode(err.response.data);
                                    const parsed = JSON.parse(decodedString);
                                    backendMessage = parsed.message || backendMessage;
                                } else if (typeof err.response.data === 'string') {
                                     backendMessage = err.response.data;
                                } else if (err.response.data.message) {
                                    backendMessage = err.response.data.message;
                                }
                            }
                        } catch (parseError) {
                            console.error("Could not parse error response:", parseError);
                        }
                         setError(backendMessage);
                    }
                     setPost(null); // Clear post state on error
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setError("Invalid Post ID.");
            setIsLoading(false);
        }
    }, [postId]); // Re-run effect if postId changes

    const handlePostDeleted = () => {
         // PostCard now handles redirection after delete, but we can still log or update state here if needed.
        console.log(`Post ${postId} was deleted.`);
        // Optionally show a message before redirecting, though PostCard handles the redirect.
         // router.push('/'); // Redundant if PostCard handles it, keep for safety?
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
             {/* Back Button */}
            <Link href="/" className="inline-flex items-center text-sm text-[#818384] hover:text-white mb-4 group">
                <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                Back to Feed
            </Link>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 data-testid="loader-icon" className="w-6 h-6 text-white animate-spin" />
                    <span className="ml-2 text-white/80">Loading post...</span>
                </div>
            ) : error ? (
                <div className="bg-black/20 backdrop-blur-[4px] border border-red-500/20 rounded-lg p-6 text-center">
                    <p className="text-red-400">{error}</p>
                </div>
            ) : post ? (
                 // Pass isClickable={false} and onDelete handler
                <PostCard 
                    post={post} 
                    isClickable={false} 
                    onDelete={handlePostDeleted} 
                />
            ) : (
                 // This state might occur briefly or if API returns null/empty object without error
                 <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6 text-center">
                    <p className="text-[#818384]">Post not available.</p>
                 </div>
            )}
        </div>
    );
} 