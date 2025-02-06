import { Post } from '@/app/types/post';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, MessageCircle, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: { post: Post }) {
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(!isLiked);
    };

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

    return (
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 hover:border-[#4e4f50] transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
        <div className="flex items-center mb-3">
            <div className="flex items-center text-sm text-[#818384]">
            <span className="font-medium text-white/90 hover:text-white transition-colors">
                {post.username}
            </span>
            <span className="mx-1.5">•</span>
            <span className="text-[#818384]">
                {timeAgo}
            </span>
            </div>
        </div>

        <p className="text-[#d7dadc] mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        
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
            
            <button className="flex items-center space-x-1 text-sm text-[#818384] hover:text-white transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span>0</span>
            </button>
            
            <button className="flex items-center space-x-1 text-sm text-[#818384] hover:text-white transition-colors ml-auto">
            <Share2 className="w-4 h-4" />
            </button>
        </div>
        </div>
    );
}