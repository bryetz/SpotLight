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
  latitude: number;
  longitude: number;
  created_at: string;
  like_count: number;
  comments?: Comment[];
};
