export type Comment = {
  comment_id: number;
  username: string;
  content: string;
  created_at: string;
  replies?: Comment[];
};

export type Post = {
  post_id: number;
  user_id: number;
  username: string;
  content: string;
  media?: string;  // URL to media content
  media_type?: 'image' | 'video';  // Type of media
  latitude: number;
  longitude: number;
  created_at: string;
  like_count: number;
  comments?: Comment[];
};
