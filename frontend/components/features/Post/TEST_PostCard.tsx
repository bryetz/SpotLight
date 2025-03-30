import { Post } from '@/types/post';
import { useState, useEffect } from 'react';
import { getFile } from '@/services/api';

export function PostCard({ post }: { post: Post }) {
    const [imageData, setImageData] = useState<string | null>(null);

    useEffect(() => {
        if (post.file_name) {
            loadImage();
        }
    }, [post.file_name]);

    const loadImage = async () => {
        try {
            // Get the file data
            const response = await getFile({
                userId: post.user_id,
                postId: post.post_id,
                fileName: post.file_name!
            });

            // Create base64 string from array buffer
            const arrayBuffer = response.data;
            const base64 = arrayBufferToBase64(arrayBuffer);
            const dataUrl = `data:image/jpeg;base64,${base64}`;
            setImageData(dataUrl);

        } catch (error) {
            console.error('Error loading image:', error);
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

    return (
        <div className="border border-gray-700 rounded-lg p-4 mb-4">
            {/* Basic post info */}
            <div className="mb-4">
                <p>User: {post.username}</p>
                <p>Content: {post.content}</p>
                {post.file_name && <p>File: {post.file_name}</p>}
            </div>

            {/* Image display */}
            {imageData && (
                <img 
                    src={imageData} 
                    alt="Post image" 
                    className="w-full rounded-lg"
                />
            )}
        </div>
    );
}