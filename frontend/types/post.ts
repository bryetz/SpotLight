export type Comment = {
  comment_id: number;
  username: string;
  content: string;
  created_at: string;
  replies?: Comment[];
  parent_id?: number;
};

export type Post = {
  post_id: number;
  user_id: number;
  username: string;
  content: string;
  file_name?: string;  // Changed from media to file_name to match backend
  latitude: number;
  longitude: number;
  created_at: string;
  like_count: number;
  comments?: Comment[];
};
