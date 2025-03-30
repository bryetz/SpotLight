import { Post, Comment } from '@/types/post';
import { MapPin, MessageCircle, Heart, Share2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [mediaData, setMediaData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchComments();
        if (post.file_name) {
            loadMedia();
        }
    }, [post.post_id, post.file_name, post.user_id]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const response = await getComments(post.post_id);
            setComments(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
            setComments([]);
        } finally {
            setIsLoadingComments(false);
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

    const loadMedia = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await getFile({
                userId: post.user_id,
                postId: post.post_id,
                fileName: post.file_name!
            });

            // Convert array buffer to base64
            const arrayBuffer = response.data;
            const base64 = arrayBufferToBase64(arrayBuffer);
            
            // Determine content type from file extension
            const ext = post.file_name!.split('.').pop()?.toLowerCase();
            const isVideo = ['mp4', 'mov', 'quicktime'].includes(ext || '');
            const mimeType = isVideo ? 'video' : 'image';
            const dataUrl = `data:${mimeType}/${ext};base64,${base64}`;
            
            setMediaData(dataUrl);
        } catch (error) {
            console.error('Error loading media:', error);
            setError('Failed to load media');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to convert array buffer to base64
    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
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

                {isLoadingComments ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                ) : Array.isArray(comments) && comments.length > 0 ? (
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
                                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
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
                ) : (
                    <div className="text-center py-4 text-[#818384]">
                        No comments yet
                    </div>
                )}
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
            
            {/* Media Display */}
            {post.file_name && (
                <div className="mb-4">
                    {isLoading ? (
                        <div className="w-full h-48 bg-black/40 rounded-lg flex items-center justify-center">
                            <span className="text-[#818384]">Loading media...</span>
                        </div>
                    ) : error ? (
                        <div className="w-full bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    ) : mediaData && (
                        <div className="relative">
                            {post.file_name.match(/\.(mp4|mov|quicktime)$/i) ? (
                                <video 
                                    src={mediaData}
                                    controls
                                    className="w-full rounded-lg max-h-[512px] object-contain bg-black/40"
                                />
                            ) : (
                                <img 
                                    src={mediaData}
                                    alt="Post media"
                                    className="w-full rounded-lg max-h-[512px] object-contain bg-black/40"
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
            
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
                    <span>{Array.isArray(comments) ? comments.length : 0}</span>
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
