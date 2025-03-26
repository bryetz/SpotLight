import { Post } from '@/types/post';
import { MapPin, MessageCircle, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: { post: Post }) {
    const router = useRouter();
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const handleClick = () => {
        router.push(`/post/${post.post_id}`);
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent post navigation when clicking like
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(!isLiked);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: 'UTC',
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    const formattedDateTime = formatDate(post.created_at);

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