import { Post, Comment } from '@/types/post';
import { MapPin, MessageCircle, Heart, Share2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { likePost, unlikePost, getComments, createComment, getFile } from '@/services/api';

export function PostCard({ post }: { post: Post }) {
    const router = useRouter();
    const { userId, isAuthenticated } = useAuth();
    
    const [likes, setLikes] = useState(post.like_count);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch media if post has a file
        if (post.file_name) {
            fetchMedia();
        } else {
            setIsLoading(false);
        }
    }, [post.file_name]);

    const fetchMedia = async () => {
        try {
            const response = await getFile({
                userId: post.user_id,
                postId: post.post_id,
                fileName: post.file_name!
            });
            
            console.log(`Media response for ${post.file_name}:`, response);
            
            // Create a blob URL from the response data
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            setMediaUrl(url);
        } catch (err) {
            console.error('Failed to fetch media:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await getComments(post.post_id);
            setComments(response.data);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
            setComments([]);
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        try {
            if (liked) {
                await unlikePost(userId!, post.post_id);
                setLikes(prev => prev - 1);
            } else {
                await likePost(userId!, post.post_id);
                setLikes(prev => prev + 1);
            }
            setLiked(!liked);
        } catch (err) {
            console.error('Like action failed:', err);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!commentInput.trim()) return;

        try {
            await createComment(post.post_id, {
                user_id: userId!,
                content: commentInput.trim()
            });
            setCommentInput('');
            fetchComments();
        } catch (err) {
            console.error('Failed to post comment:', err);
        }
    };

    const renderMedia = () => {
        if (!mediaUrl) return null;

        const isVideo = post.file_name?.match(/\.(mp4|mov)$/i);
        
        if (isVideo) {
            return (
                <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
                    <video 
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );
        }

        return (
            <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
                <Image
                    src={mediaUrl}
                    alt="Post media"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        );
    };

    const renderComments = () => {
        if (!showComments) return null;

        return (
            <div className="mt-4 space-y-3">
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-black/40 border border-[#343536] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4e4f50]"
                    />
                    <button
                        type="submit"
                        disabled={!commentInput.trim()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm disabled:opacity-50"
                    >
                        Post
                    </button>
                </form>

                <div className="space-y-2">
                    {comments.map((comment) => (
                        <div key={comment.comment_id} className="text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white/90">{comment.username}</span>
                                <span className="text-[#818384] text-xs">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-white/80 mt-1">{comment.content}</p>
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-4 mt-2 space-y-2 border-l-2 border-[#343536] pl-4">
                                    {comment.replies.map(reply => (
                                        <div key={reply.comment_id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white/90">{reply.username}</span>
                                                <span className="text-[#818384] text-xs">
                                                    {new Date(reply.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-white/80 mt-1">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4">
            <div className="flex items-center mb-3">
                <div className="flex items-center text-sm text-[#818384]">
                    <span className="font-medium text-white/90">
                        {post.username}
                    </span>
                    <span className="mx-1.5">•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <p className="text-[#d7dadc] mb-4 whitespace-pre-wrap">{post.content}</p>
            
            {isLoading ? (
                <div className="w-full aspect-video mb-4 bg-black/40 rounded-lg flex items-center justify-center">
                    <span className="text-[#818384]">Loading media...</span>
                </div>
            ) : renderMedia()}
            
            <div className="flex items-center text-xs text-[#818384] font-medium mb-4">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>
                    {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                </span>
            </div>

            <div className="flex items-center space-x-4 pt-2 border-t border-[#343536]">
                <button 
                    onClick={handleLike}
                    className={`flex items-center space-x-1 text-sm ${liked ? 'text-red-400' : 'text-[#818384]'} hover:text-red-400 transition-colors`}
                >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    <span>{likes}</span>
                </button>
                
                <button 
                    onClick={() => {
                        setShowComments(!showComments);
                        if (!showComments) fetchComments();
                    }}
                    className="flex items-center space-x-1 text-sm text-[#818384] hover:text-white transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>{comments.length}</span>
                </button>
                
                <button 
                    className="flex items-center space-x-1 text-sm text-[#818384] hover:text-white transition-colors ml-auto"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {renderComments()}
        </div>
    );
}
