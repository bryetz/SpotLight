import axios from 'axios';

// Mock the entire axios module
jest.mock('axios', () => {
  // Create a mock axios instance with methods we need
  const mockAxiosInstance = {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn(fn => fn({ headers: {} })) }
    }
  };
  
  // Return a mock of axios.create that returns our mock instance
  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance)
  };
});

// Mock the API_URL config
jest.mock('@/lib/api_url_config', () => ({
  API_URL: 'http://test-api.com'
}));

// Mock the geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation(success => 
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    })
  )
};

// Set up the global navigator object with our mock
Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: mockGeolocation
  },
  writable: true
});

// Import the API function after all mocks are set up
import { getPosts } from '@/services/api';

describe('TestAPI', () => {
  // Get a reference to our mocked axios instance
  const mockAxios = require('axios').create();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('calls the correct endpoint with default parameters', async () => {
    // Call the function
    await getPosts();
    
    // Check that the get method was called
    expect(mockAxios.get).toHaveBeenCalled();
    
    // Check that the URL contains the expected parameters
    const callArg = mockAxios.get.mock.calls[0][0];
    expect(callArg).toContain('/api/posts');
    expect(callArg).toContain('latitude=40.7128');
    expect(callArg).toContain('longitude=-74.006');
  });
  
  test('includes custom radius when provided', async () => {
    // Call with custom radius
    await getPosts({ radius: 10000 });
    
    // Check that the URL contains the custom radius
    const callArg = mockAxios.get.mock.calls[0][0];
    expect(callArg).toContain('distance=10000');
  });
  
  test('handles geolocation errors gracefully', async () => {
    // Temporarily mock geolocation to fail
    const originalGetCurrentPosition = mockGeolocation.getCurrentPosition;
    mockGeolocation.getCurrentPosition = jest.fn().mockImplementation((success, error) => 
      error(new Error('Geolocation error'))
    );
    
    // Call the function
    await getPosts();
    
    // Check that the get method was still called
    expect(mockAxios.get).toHaveBeenCalled();
    
    // Restore the original mock
    mockGeolocation.getCurrentPosition = originalGetCurrentPosition;
  });
});