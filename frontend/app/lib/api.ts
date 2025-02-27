import axios from 'axios';
import { API_URL } from '@/app/config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPosts = () => api.get('/api/posts');
export const login = (username: string, password: string) => 
  api.post('/api/login', { username, password });
export const register = (username: string, password: string) => 
  api.post('/api/register', { username, password });
export const createPost = (data: { 
  // user_id: number, 
  content: string, 
  latitude: number, 
  longitude: number 
}) => {
  console.log('Data to be sent:', data);
  return api.post('/api/posts', data);
};

export default api; 