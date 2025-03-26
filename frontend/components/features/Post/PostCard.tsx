'use client';

import { Post, Comment } from '@/types/post';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

export function PostCard({ post }: { post: Post }) {
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

    return (
        <div className="bg-black/30 p-4 rounded-xl text-white space-y-3 border border-white/10">
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium">@{post.username}</p>
                <p className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleString()}
                </p>
            </div>

            <p className="text-base">{post.content}</p>

            <div className="flex items-center gap-4">
                <button
                    className={`flex items-center gap-1 text-sm ${
                        liked ? 'text-red-400' : 'text-white/70'
                    }`}
                    onClick={handleLike}
                >
                    <Heart className="w-4 h-4" />
                    {likes}
                </button>
                <span className="text-white/70 text-sm">💬 {comments.length}</span>
            </div>

            <div className="flex items-center gap-2 mt-2">
                <input
                    type="text"
                    className="flex-1 px-2 py-1 rounded-md bg-white/10 border border-white/20 text-sm text-white"
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                />
                <button
                    onClick={handleCommentSubmit}
                    className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
                >
                    Post
                </button>
            </div>

            {comments.length > 0 && (
                <div className="border-t border-white/10 pt-2 space-y-1">
                    {renderComments(comments)}
                </div>
            )}
        </div>
    );
}
