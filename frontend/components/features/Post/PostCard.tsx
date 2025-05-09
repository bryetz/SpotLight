import { Post, Comment } from '@/types/post';
import { MapPin, MessageCircle, Heart, Share2, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, MouseEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { likePost, unlikePost, getComments, createComment, getFile, checkPostLiked, deleteComment, deletePost as apiDeletePost } from '@/services/api';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

interface ExpandedComments {
    [key: number]: boolean;
}

interface PostCardProps {
    post: Post;
    isClickable?: boolean;
    onDelete?: (postId: number) => void;
}

export function PostCard({ post, isClickable = true, onDelete }: PostCardProps) {
    const router = useRouter();
    const { userId, isAuthenticated, username } = useAuth();

    const [likes, setLikes] = useState(post.like_count);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [mediaData, setMediaData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedComments, setExpandedComments] = useState<ExpandedComments>({});
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyInput, setReplyInput] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchComments();
        if (post.file_name) {
            loadMedia();
        }
        const checkInitialLikeStatus = async () => {
            if (isAuthenticated && userId) {
                try {
                    const response = await checkPostLiked(post.post_id, userId);
                    console.log('Initial like status response:', response.data);
                    setLiked(response.data.result);
                } catch (err) {
                    console.error('Failed to check initial like status:', err);
                }
            }
        };

        checkInitialLikeStatus();
    }, [post.post_id, post.file_name, post.user_id, userId, isAuthenticated]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const response = await getComments(post.post_id);
            console.log('Fetch comments response:', response.data);
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
                const response = await unlikePost(userId!, post.post_id);
                console.log('Unlike response:', response.data);
                if (response.data.message === "Post unliked successfully") {
                    setLikes(prev => prev - 1);
                    setLiked(false);
                }
            } else {
                const response = await likePost(userId!, post.post_id);
                console.log('Like response:', response.data);
                if (response.data.message === "Post liked successfully") {
                    setLikes(prev => prev + 1);
                    setLiked(true);
                }
            }
        } catch (err) {
            console.error('Like action failed:', err);
            // Optionally recheck like status on error
            const response = await checkPostLiked(post.post_id, userId!);
            setLiked(response.data.result);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, parentId?: number) => {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const input = parentId ? replyInput : commentInput;
        if (!input.trim()) return;

        try {
            const response = await createComment(post.post_id, {
                user_id: userId!,
                content: input.trim(),
                parent_id: parentId || undefined
            });
            console.log('Comment creation response:', response.data);

            if (parentId) {
                setReplyInput('');
            } else {
                setCommentInput('');
            }

            setReplyingTo(null);
            fetchComments();
        } catch (err) {
            console.error('Failed to post comment:', err);
        }
    };

    const loadMedia = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('Requesting file:', {
                userId: post.user_id,
                postId: post.post_id,
                fileName: post.file_name
            });

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
        } catch (error: any) {
            console.error('Error loading media:', error);
            // Try to parse the error message from the response
            let errorMessage = 'Failed to load media';
            try {
                if (error.response?.data) {
                    if (typeof error.response.data === 'string') {
                        try {
                            const parsed = JSON.parse(error.response.data);
                            errorMessage = parsed.message || errorMessage;
                        } catch {
                            errorMessage = error.response.data;
                        }
                    } else {
                        errorMessage = error.response.data.message || errorMessage;
                    }
                }
                console.error('Detailed error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    message: errorMessage
                });
            } catch (e) {
                console.error('Error parsing error message:', e);
            }
            setError(errorMessage);
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

    const toggleComment = (commentId: number) => {
        setExpandedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            const response = await deleteComment(commentId);
            console.log('Delete comment response:', response.data);
            fetchComments(); // Refresh comments after deletion
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const handleCardClick = () => {
        if (isClickable) {
             const postIdNum = Number(post.post_id);
            if (!isNaN(postIdNum)) {
                router.push(`/post/${postIdNum}`);
            } else {
                console.error('Invalid post_id for navigation');
            }
        }
    };
    
    const handleShare = async (e: MouseEvent) => {
        e.stopPropagation();
        const postIdNum = Number(post.post_id);
        if (isNaN(postIdNum)) {
            console.error('Invalid post_id for sharing');
            return;
        }
        
        const shareData = {
            title: `SpotLight Post by ${post.username}`,
            text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            url: `${window.location.origin}/post/${postIdNum}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                console.log('Post shared successfully via Web Share API');
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.url);
                alert('Post URL copied to clipboard!');
            } else {
                 alert('Sharing is not supported on this browser.');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing post:', err);
                try {
                    if (navigator.clipboard) {
                        await navigator.clipboard.writeText(shareData.url);
                        alert('Sharing failed. Post URL copied to clipboard instead.');
                    } else {
                         alert('Failed to share or copy URL.');
                    }
                } catch (copyErr) {
                    console.error('Error copying URL as fallback:', copyErr);
                    alert('Failed to share or copy URL.');
                }
            } else {
                console.log('Share action cancelled by user.');
            }
        }
    };

    const handleDeletePostClick = async (e: MouseEvent) => {
        e.stopPropagation();
        
        const postIdNum = Number(post.post_id);
        if (isNaN(postIdNum)) {
            console.error('Invalid post_id for deletion');
            return;
        }

        if (!isAuthenticated || userId !== post.user_id) {
             console.warn('Attempted to delete post without authentication or ownership.');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            setIsDeleting(true);
            setError(null);
            try {
                await apiDeletePost(postIdNum);
                console.log(`Post ${postIdNum} deleted successfully.`);
                if (onDelete) {
                    onDelete(postIdNum);
                } else {
                    router.push('/'); 
                }
            } catch (err) {
                console.error(`Failed to delete post ${postIdNum}:`, err);
                setError('Failed to delete post.');
                setIsDeleting(false);
                setTimeout(() => setError(null), 3000);
            }
        }
    };

    const renderComment = (comment: Comment, depth: number = 0) => {
        const isExpanded = expandedComments[comment.comment_id] ?? true;
        const hasReplies = comment.replies && comment.replies.length > 0;
        const isOwnComment = comment.username === username;

        const formatDate = (dateString: string) => {
            const date = parseISO(dateString.replace('Z', ''));
            return format(date, 'MMM d, h:mm a');
        };

        return (
            <div
                key={comment.comment_id}
                className={`relative ${depth > 0 ? 'ml-4 mt-2' : 'mt-4'}`}
            >
                {depth > 0 && (
                    <button
                        onClick={() => toggleComment(comment.comment_id)}
                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#343536] hover:bg-white/50 transition-all duration-200 cursor-pointer group"
                        title={isExpanded ? "Collapse thread" : "Expand thread"}
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/30" />
                    </button>
                )}
                <div className={`pl-4 transition-all duration-200 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/profile/${comment.user_id}`} 
                            onClick={(e) => e.stopPropagation()} 
                            className="font-medium text-white/90 hover:underline"
                        >
                            {comment.username}
                        </Link>
                        <span className="text-[#818384] text-xs">
                            {formatDate(comment.created_at)}
                        </span>
                        {isOwnComment && (
                            <button
                                onClick={() => handleDeleteComment(comment.comment_id)}
                                className="ml-auto p-1 text-[#818384] hover:text-red-400 transition-colors"
                                title="Delete comment"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <p className="text-white/80 mt-1">{comment.content}</p>

                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => setReplyingTo(comment.comment_id)}
                            className="text-xs text-[#818384] hover:text-white transition-colors"
                        >
                            Reply
                        </button>
                        {hasReplies && (
                            <button
                                onClick={() => toggleComment(comment.comment_id)}
                                className="flex items-center gap-1 text-xs text-[#818384] hover:text-white transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3 transition-transform duration-200" />
                                        Hide Replies
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3 transition-transform duration-200" />
                                        Show Replies ({comment.replies?.length ?? 0})
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {replyingTo === comment.comment_id && (
                        <div className="mt-2 overflow-hidden transition-all duration-200 ease-in-out">
                            <form onSubmit={(e) => handleCommentSubmit(e, comment.comment_id)} className="animate-slideDown">
                                <input
                                    type="text"
                                    value={replyInput}
                                    onChange={(e) => setReplyInput(e.target.value)}
                                    placeholder={`Reply to ${comment.username}...`}
                                    className="w-full bg-black/40 border border-[#343536] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4e4f50]"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setReplyInput('');
                                        }}
                                        className="px-3 py-1 text-[#818384] hover:text-white text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!replyInput.trim()}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm disabled:opacity-50"
                                    >
                                        Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {hasReplies && comment.replies && (
                        <div
                            className={`
                                overflow-hidden transition-all duration-200 ease-in-out
                                ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}
                            `}
                        >
                            <div className={`space-y-2 pt-2 transition-all duration-200 ease-in-out
                                ${isExpanded ? 'translate-y-0' : '-translate-y-2'}
                            `}>
                                {comment.replies.map(reply => renderComment(reply, depth + 1))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderComments = () => {
        if (!showComments) return null;

        return (
            <div className="mt-4">
                <form onSubmit={(e) => handleCommentSubmit(e)} className="flex gap-2">
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
                ) : comments.length > 0 ? (
                    <div>
                        {comments.map(comment => renderComment(comment))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-[#818384]">
                        No comments yet
                    </div>
                )}
            </div>
        );
    };

    const CardWrapper = isClickable ? 'div' : 'div';
    const cardProps = isClickable ? { onClick: handleCardClick, role: 'button', tabIndex: 0, 'aria-label': `View post by ${post.username}` } : {};

    return (
        <CardWrapper 
            className={`bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 relative ${isClickable ? 'cursor-pointer hover:border-[#4e4f50] transition-colors' : ''} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            {...cardProps}
            data-testid={`post-card-${post.post_id}`}
        >
            {isAuthenticated && userId === post.user_id && (
                <button
                    onClick={handleDeletePostClick}
                    className="absolute top-2 right-2 p-1.5 text-[#818384] hover:text-red-400 bg-black/30 rounded-full transition-colors z-10"
                    title="Delete post"
                    aria-label="Delete post"
                    disabled={isDeleting}
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            )}
            
            <div className="flex items-center mb-3">
                <div className="flex items-center text-sm text-[#818384]">
                    <Link 
                        href={`/profile/${post.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-white/90 hover:underline"
                    >
                        {post.username}
                    </Link>
                    <span className="mx-1.5">•</span>
                    <span>
                        {format(parseISO(post.created_at.replace('Z', '')), 'MMM d, h:mm a')}
                    </span>
                </div>
            </div>

            <p className="text-[#d7dadc] mb-4 whitespace-pre-wrap">{post.content}</p>
            
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

            <div className="flex items-center space-x-4 pt-3 border-t border-[#343536]">
                <button 
                    onClick={handleLike}
                    className={`flex items-center space-x-1.5 text-sm ${liked ? 'text-red-400 font-medium' : 'text-[#818384]'} hover:text-red-400 transition-colors duration-150`}
                    aria-pressed={liked}
                    aria-label={`Like post, currently ${likes} likes`}
                >
                    <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
                    <span>{likes}</span>
                </button>
                
                <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        setShowComments(!showComments);
                        if (!showComments && comments.length === 0) {
                            fetchComments();
                        }
                    }}
                    className="flex items-center space-x-1.5 text-sm text-[#818384] hover:text-white transition-colors duration-150"
                     aria-expanded={showComments}
                     aria-controls={`comments-section-${post.post_id}`}
                >
                    <MessageCircle className="w-4 h-4" />
                     <span>
                        {isLoadingComments ? '...' : Array.isArray(comments) ? comments.length : 0}
                     </span>
                </button>
                
                <button 
                    onClick={handleShare}
                    className="flex items-center space-x-1.5 text-sm text-[#818384] hover:text-white transition-colors duration-150 ml-auto"
                    aria-label="Share post"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </button>
            </div>

            {renderComments()}
        </CardWrapper>
    );
}