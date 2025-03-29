import { Post } from '@/types/post';
import { MapPin, MessageCircle, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Post, Comment } from '@/types/post';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

export function PostCard({ post }: { post: Post }) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/post/${post.post_id}`);
    };
    
    const [likes, setLikes] = useState(post.like_count);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const { userId, isAuthenticated } = useAuth();
    
    const fetchComments = async () => {
        try {
            const res = await axios.get(`/api/posts/${post.post_id}/comments`);
            setComments(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                console.error('Failed to fetch comments:', err);
            }
            setComments([]); // fallback
        }
    };

    const handleLike = async () => {
        e.stopPropagation();
        if (liked) return;
        setLiked(true);
        setLikes((prev) => prev + 1);
        try {
            await axios.post('/api/posts/like', {
                post_id: post.post_id,
                user_id: userId,
            });
        } catch (err) {
            console.error('Like failed:', err);
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentInput.trim()) return;
        try {
            await axios.post('/api/comments', {
                post_id: post.post_id,
                user_id: userId,
                content: commentInput,
            });
            setCommentInput('');
            fetchComments();
        } catch (err) {
            console.error('Comment failed:', err);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [post.post_id]);

    const renderComments = (commentList: Comment[], indent = 0) => {
        return commentList.map((comment) => (
            <div key={comment.comment_id} style={{ marginLeft: indent }}>
                <p className="text-sm text-white/80">
                    <span className="font-semibold text-blue-300">{comment.username}</span>: {comment.content}
                </p>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-1">{renderComments(comment.replies, indent + 16)}</div>
                )}
            </div>
        ));
    };

    const renderMedia = () => {
        if (!post.media) return null;

        if (post.media_type === 'video') {
            return (
                <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
                    <video 
                        className="w-full h-full object-cover"
                        controls
                        onClick={(e) => e.stopPropagation()}
                    >
                        <source src={post.media} />
                        Your browser does not support video playback.
                    </video>
                </div>
            );
        }

        if (post.media_type === 'image') {
            return (
                <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
                    <Image
                        src={post.media}
                        alt="Post media"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <div 
            onClick={handleClick}
            className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 hover:border-[#4e4f50] transition-all duration-300 hover:shadow-lg hover:shadow-black/5 cursor-pointer"
        >
            <div className="flex items-center mb-3">
                <div className="flex items-center text-sm text-[#818384]">
                    <span className="font-medium text-white/90 hover:text-white transition-colors">
                        {post.username}
                    </span>
                    <span className="mx-1.5">•</span>
                    <span className="text-[#818384]">{formattedDateTime}</span>
                </div>
            </div>

            <p className="text-[#d7dadc] mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {renderMedia()}
            
            <div className="flex items-center text-xs text-[#818384] font-medium mb-4">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>
                    {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                </span>
            </div>

            <div className="flex items-center space-x-4 pt-2 border-t border-[#343536]">
                <button 
                    onClick={handleLike}
                    className={`flex items-center space-x-1 text-sm ${isLiked ? 'text-red-400' : 'text-[#818384]'} hover:text-red-400 transition-colors`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likes}</span>
                </button>
                
                <button 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1 text-sm text-[#818384] hover:text-white transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>0</span>
                </button>
                
                <button 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1 text-sm text-[#818384] hover:text-white transition-colors ml-auto"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
