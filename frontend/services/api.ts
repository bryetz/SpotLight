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
export const login = (email: string, password: string) => 
  api.post('/api/login', { email, password });

export const register = (username: string, password: string) => 
  api.post('/api/register', { username, password });

export const getProfile = () => 
  api.get('/api/auth/profile');

export const updateProfile = (data: { username?: string, profile_picture?: string, bio?: string }) => 
  api.put('/api/auth/profile', data);

export const getUserProfile = (userId: string) => 
  api.get(`/api/users/${userId}`);

export const getPosts = async (params?: {
  sort?: 'new' | 'popular' | 'hot',
  time_filter?: 'today' | 'past_week' | 'past_month',
  latitude?: number,
  longitude?: number,
  radius?: number,
  limit?: number,
  offset?: number
}) => {
  // Round the radius to an integer to avoid decimal issues
  const distance = Math.round(params?.radius || 25000); // 25 kilometer default range
  var reqLatitude = Number.POSITIVE_INFINITY;
  var reqLongitude = Number.POSITIVE_INFINITY;

  try {
    const { latitude, longitude } = await getCurrentLocation();
    reqLatitude = latitude;
    reqLongitude = longitude;
    return api.get(`/api/posts?latitude=${reqLatitude}&longitude=${reqLongitude}&distance=${distance}`)
  } catch (error) {
    console.error(error);
    return api.get(`/api/posts?latitude=${reqLatitude}&longitude=${reqLongitude}&distan=${distance}`)
  }

  // example test, (26.062, -80.3368) versus (29.5, -82.3368)
  // passes with distance of 430km but not 420km, good!

  // comments of hardcoding for testing:
  // distance = 430_000;
  // reqLatitude = 29.5;
  // reqLongitude = -82.33680
}

export const createPost = (data: { 
  title?: string,
  body: string, 
  media?: string,
  latitude: number, 
  longitude: number 
}) => api.post('/api/posts', data);

export const getPost = (postId: string) => 
  api.get(`/api/posts/${postId}`);

export const updatePost = (postId: string, data: { 
  title?: string, 
  body?: string, 
  media?: string 
}) => api.put(`/api/posts/${postId}`, data);

export const deletePost = (postId: string) => 
  api.delete(`/api/posts/${postId}`);

// Comments endpoints
export const getComments = (postId: string) => 
  api.get(`/api/posts/${postId}/comments`);

export const createComment = (postId: string, data: { 
  content: string, 
  parent_comment_id?: string 
}) => api.post(`/api/posts/${postId}/comments`, data);

export const updateComment = (commentId: string, content: string) => 
  api.put(`/api/comments/${commentId}`, { content });

export const deleteComment = (commentId: string) => 
  api.delete(`/api/comments/${commentId}`);

// Likes endpoints
export const likePost = (postId: string) => 
  api.post(`/api/posts/${postId}/like`);

export const unlikePost = (postId: string) => 
  api.delete(`/api/posts/${postId}/like`);

export const likeComment = (commentId: string) => 
  api.post(`/api/comments/${commentId}/like`);

export const unlikeComment = (commentId: string) => 
  api.delete(`/api/comments/${commentId}/like`);

export default api; 