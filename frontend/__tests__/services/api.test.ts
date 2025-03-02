import axios from 'axios';

// Mock the API_URL import
jest.mock('@/lib/api_url_config', () => ({
  API_URL: 'http://test-api.com'
}));

// Mock axios with inline functions
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ data: [] }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
      interceptors: {
        request: {
          use: jest.fn(cb => cb({ headers: {} }))
        }
      }
    }))
  };
});

// Import the API functions after mocking dependencies
import { getPosts, createPost, likePost, unlikePost } from '@/services/api';

// Mock localStorage for token retrieval
const mockLocalStorage = {
  getItem: jest.fn().mockReturnValue('test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) => 
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    })
  )
};
global.navigator.geolocation = mockGeolocation;

describe('API Service', () => {
  // Get references to the mock functions
  let mockAxiosInstance;
  let mockGet;
  let mockPost;
  let mockDelete;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Get fresh references to the mock functions
    mockAxiosInstance = axios.create();
    mockGet = mockAxiosInstance.get;
    mockPost = mockAxiosInstance.post;
    mockDelete = mockAxiosInstance.delete;
  });

  test('getPosts calls the correct endpoint with location', async () => {
    // Call the function
    await getPosts();
    
    // Check if axios.get was called with the correct URL
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts?latitude=40.7128&longitude=-74.006')
    );
  });

  test('getPosts includes custom radius when provided', async () => {
    // Call the function with custom radius
    await getPosts({ radius: 10000 });
    
    // Check if axios.get was called with the correct URL including custom radius
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('distance=10000')
    );
  });

  test('createPost sends correct data', async () => {
    // Post data
    const postData = {
      body: 'New post content',
      latitude: 40.7128,
      longitude: -74.0060
    };
    
    // Call the function
    await createPost(postData);
    
    // Check if axios.post was called with the correct URL and data
    expect(mockPost).toHaveBeenCalledWith('/api/posts', postData);
  });

  test('likePost calls the correct endpoint', async () => {
    // Call the function
    await likePost('123');
    
    // Check if axios.post was called with the correct URL
    expect(mockPost).toHaveBeenCalledWith('/api/posts/123/like');
  });

  test('unlikePost calls the correct endpoint', async () => {
    // Call the function
    await unlikePost('123');
    
    // Check if axios.delete was called with the correct URL
    expect(mockDelete).toHaveBeenCalledWith('/api/posts/123/like');
  });

  test('adds authorization header when token exists', async () => {
    // Call any API function to trigger the interceptor
    await getPosts();
    
    // Check if the interceptor was called
    expect(mockUse).toHaveBeenCalled();
    
    // Make another call to verify the token is being used
    mockLocalStorage.getItem.mockReturnValue('another-test-token');
    await createPost({ body: 'test', latitude: 0, longitude: 0 });
    
    // The interceptor should have been called again
    expect(mockUse).toHaveBeenCalled();
  });
}); 