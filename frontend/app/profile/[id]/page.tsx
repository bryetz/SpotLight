'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProfile } from '@/services/api';
import { Post } from '@/types/post';
import { PostCard } from '@/components/features/Post/PostCard';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UserProfile {
    user_id: number;
    username: string;
    created_at: string;
}

interface ProfileData {
    user: UserProfile;
    posts: Post[];
}

export default function ProfilePage() {
    const params = useParams();
    const userId = params?.id ? parseInt(params.id as string, 10) : null;
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchProfileData(userId);
        } else {
            setError('Invalid user ID.');
            setLoading(false);
        }
    }, [userId]);

    const fetchProfileData = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getProfile(id);
            setProfileData(response.data);
        } catch (err: any) { // Consider more specific error typing
            console.error('Failed to fetch profile data:', err);
            if (err.response?.status === 404) {
                setError('User not found.');
            } else {
                setError('Failed to load profile data. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePostDelete = (deletedPostId: number) => {
        setProfileData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                posts: prevData.posts.filter(post => post.post_id !== deletedPostId)
            };
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-400">{error}</div>
        );
    }

    if (!profileData) {
        return <div className="text-center py-10 text-[#818384]">No profile data available.</div>;
    }

    const { user, posts } = profileData;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6 mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{user.username}</h1>
                <p className="text-sm text-[#818384]">
                    Joined: {format(parseISO(user.created_at.replace('Z', '')), 'MMMM d, yyyy')}
                </p>
                {/* Add more profile details here later if needed, e.g., bio, profile picture */}
            </div>

            <h2 className="text-2xl font-semibold text-white mb-6">Posts by {user.username}</h2>
            
            {posts && posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <PostCard 
                            key={post.post_id} 
                            post={post} 
                            isClickable={true} 
                            onDelete={() => handlePostDelete(post.post_id)} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-[#818384] bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg">
                    This user hasn't posted anything yet.
                </div>
            )}
        </div>
    );
}
