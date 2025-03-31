import axios from 'axios';
import { API_URL } from '@/lib/api_url_config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header when token is available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// async helper function to get location
function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser"));
      } else {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  resolve({ latitude, longitude });
              },
              (error) => {
                  reject(new Error(`Geolocation error: ${error.message}`));
              }
          );
      }
  });
}

// Auth endpoints
export const login = (username: string, password: string) => 
  api.post('/api/login', { username, password });

export const register = (username: string, password: string) => 
  api.post('/api/register', { username, password });

export const deleteUser = (username: string) =>
  api.delete('/api/delete-user', { data: { username } });

export const getPosts = async (params?: {
  latitude?: number,
  longitude?: number,
  radius?: number,
}) => {
  // Round the radius to an integer to avoid decimal issues
  const distance = Math.round(params?.radius || 25000); // 25 kilometer default range
  let reqLatitude = Number.POSITIVE_INFINITY;
  let reqLongitude = Number.POSITIVE_INFINITY;

  try {
    const { latitude, longitude } = await getCurrentLocation();
    reqLatitude = latitude;
    reqLongitude = longitude;
    console.log(`/api/posts?latitude=${reqLatitude}&longitude=${reqLongitude}&distance=${distance}`);
    return api.get(`/api/posts?latitude=${reqLatitude}&longitude=${reqLongitude}&distance=${distance}`)
  } catch (error) {
    console.error(error);
    return api.get(`/api/posts?latitude=${reqLatitude}&longitude=${reqLongitude}&distance=${distance}`)
  }
}

export const createPost = (data: {
  user_id: number,
  content: string,
  file_name?: string, // media file name
  media?: string, // actual media data
  latitude: number, 
  longitude: number 
}) => api.post('/api/posts', data);

export const deletePost = (postId: string) =>  // ts prolly dont work because idk if its param based or req based
  api.delete(`/api/posts/${postId}`);


// Likes endpoints
export const likePost = (userId: number, postId: number) => 
  api.post(`/api/posts/${postId}/like`, { user_id: userId, post_id: postId });

export const unlikePost = (userId: number, postId: number) => 
  api.post(`/api/posts/${postId}/unlike`, { user_id: userId, post_id: postId });

export const getPostLikes = (postId: string) =>
  api.get(`/api/posts/${postId}/likes`);


// Comments endpoints
export const createComment = (postId: number, data: {
  user_id: number,
  content: string,
  parent_id?: number
}) => api.post(`/api/posts/${postId}/comments`, data);

export const getComments = (postId: number) =>
  api.get(`/api/posts/${postId}/comments`);

export const deleteComment = (commentId: number) =>
  api.delete(`/api/comments/${commentId}`);


// File endpoint
export const getFile = async ({
    userId,
    postId,
    fileName
}: {
    userId: number;
    postId: number;
    fileName: string;
}) => {
    return api.get('/api/file', {
        params: { userId, postId, fileName },
        responseType: 'arraybuffer'  // Important: tells axios to handle the response as binary data
    });
};

// check if a post is liked by the user
export const checkPostLiked = (postId: number, userId: number) =>
  api.get(`/api/posts/${postId}/liked`, { params: { userId } });

export default api; 