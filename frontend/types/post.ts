export interface Post {
  post_id: number;
  username: string;
  content: string;
  media?: string;  // URL to media content
  media_type?: 'image' | 'video';  // Type of media
  latitude: number;
  longitude: number;
  created_at: string;
}