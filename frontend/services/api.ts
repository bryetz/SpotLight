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
  latitude?: number; // Latitude from filter
  longitude?: number; // Longitude from filter
  radius?: number;
  limit?: number;
  offset?: number;
  sort?: string; 
  time?: string; 
}) => {
  // Use provided params or set defaults
  const distance = Math.round(params?.radius ?? 25000); 
  const limit = params?.limit ?? 20; 
  const offset = params?.offset ?? 0; 
  const sort = params?.sort ?? 'new'; 
  const time = params?.time ?? 'all'; 
  
  // Prioritize location passed in params
  let reqLatitude = params?.latitude;
  let reqLongitude = params?.longitude;
  let locationSource = 'filter'; // Keep track of where location came from

  // If no location was passed in params, try to get current geolocation
  if (reqLatitude === undefined || reqLongitude === undefined) {
    locationSource = 'geolocation';
    try {
      const { latitude, longitude } = await getCurrentLocation();
      reqLatitude = latitude;
      reqLongitude = longitude;
    } catch (error) {
      // If geolocation fails, use the fallback infinite values
      console.error("Geolocation failed or not available, using fallback:", error);
      locationSource = 'fallback';
      reqLatitude = Number.POSITIVE_INFINITY;
      reqLongitude = Number.POSITIVE_INFINITY;
      // Note: When using fallback, distance might still apply if backend handles infinite coords
    }
  }

  // Construct the base URL
  let url = `/api/posts?limit=${limit}&offset=${offset}&sort=${sort}&time=${time}`;
  
  // Append location parameters ONLY IF they are valid numbers (not undefined or Infinity)
  if (typeof reqLatitude === 'number' && typeof reqLongitude === 'number' && isFinite(reqLatitude) && isFinite(reqLongitude)) {
      url += `&latitude=${reqLatitude}&longitude=${reqLongitude}&distance=${distance}`;
       console.log(`Fetching posts with ${locationSource} location: ${url}`);
  } else {
       // Fetch without lat/lon if using fallback (or if filter explicitly provided invalid coords)
       // The backend defaults to no location filter if lat/lon are missing/infinite
       console.log(`Fetching posts without specific location (using ${locationSource}): ${url}`);
  }

  return api.get(url);
};

export const getPostById = (postId: number) =>
  api.get(`/api/posts/${postId}`);

export const createPost = (data: {
  user_id: number,
  content: string,
  file_name?: string, // media file name
  media?: string, // actual media data
  latitude: number, 
  longitude: number 
}) => api.post('/api/posts', data);

export const deletePost = (postId: number) => 
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

// Get user profile and posts
export const getProfile = (userId: number) => 
  api.get(`/api/profile/${userId}`);

// DM endpoints
export const sendDM = (sender_id: number, receiver_id: number, content: string) =>
  api.post('/api/dm/send', { sender_id, receiver_id, content });

export const getDMHistory = (sender_id: number, receiver_id: number) =>
  api.get('/api/dm/history', { params: { sender_id, receiver_id } });

// Search endpoint
export const searchContent = (query: string) => {
  // Only make the request if the query is not empty
  if (!query.trim()) {
    // Return a promise that resolves to null or an empty structure 
    // to avoid making an unnecessary API call and simplify SWR handling.
    return Promise.resolve({ data: { users: [], posts: [] } });
  }
  return api.get('/api/search', { params: { query } });
};

export default api; 