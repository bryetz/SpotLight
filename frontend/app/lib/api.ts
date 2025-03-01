import axios from 'axios';
import { API_URL } from '@/app/config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


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

export const getPosts = async () => {
  // find distance from user specified obj not implemented yet, defining distance as default
  var distance = 25_000; // 25 kilometer default range
  var reqLatitude = Number.POSITIVE_INFINITY;
  var reqLongitude = Number.POSITIVE_INFINITY;

  try {
    const { latitude, longitude } = await getCurrentLocation();
    reqLatitude = latitude;
    reqLongitude = longitude;
    return api.get('/api/posts?' + 'latitude='+reqLatitude+'&longitude='+reqLongitude+'&distance='+distance)
  } catch (error) {
    console.error(error);
    return api.get('/api/posts?' + 'latitude='+reqLatitude+'&longitude='+reqLongitude+'&distance='+distance)
  }

  // example test, (26.062, -80.3368) versus (29.5, -82.3368)
  // passes with distance of 430km but not 420km, good!

  // comments of hardcoding for testing:
  // distance = 430_000;
  // reqLatitude = 29.5;
  // reqLongitude = -82.33680
}
export const login = (username: string, password: string) => 
  api.post('/api/login', { username, password });
export const register = (username: string, password: string) => 
  api.post('/api/register', { username, password });
export const createPost = (data: { 
  user_id: number,
  content: string, 
  latitude: number, 
  longitude: number 
}) => {
  console.log('Data to be sent:', data);
  return api.post('/api/posts', data);
};

export default api; 