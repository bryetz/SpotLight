// Basic User Profile structure matching backend response
export interface UserProfile {
    user_id: number;
    username: string;
    created_at: string; // Keep as string as formatted by backend
    // Add other fields like profile_picture, bio if they exist
} 