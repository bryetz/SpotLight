import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Feed } from '@/components/features/Feed';
import { getPosts } from '@/services/api';

// Mock the dependencies
jest.mock('lucide-react', () => ({
  SlidersHorizontal: () => <div data-testid="sliders-icon">Filters</div>,
  Loader2: () => <div data-testid="loader-icon">Loading...</div>,
  MapPin: () => <div data-testid="map-pin">Location</div>,
  MessageCircle: () => <div>Comments</div>,
  Heart: () => <div>Heart</div>,
  Share2: () => <div>Share</div>
}));

jest.mock('@/components/features/Post/PostCard', () => ({
  PostCard: ({ post }: { post: any }) => (
    <div data-testid={`post-${post.post_id}`}>
      <div>{post.username}</div>
      <div>{post.content}</div>
    </div>
  )
}));

jest.mock('@/components/features/Feed/RadiusFilter', () => ({
  RadiusFilter: ({ onRadiusChange }: { onRadiusChange: (radius: number) => void }) => (
    <div data-testid="radius-filter">
      <button 
        data-testid="radius-change-button" 
        onClick={() => onRadiusChange(10000)}
      >
        Change Radius
      </button>
    </div>
  )
}));

// Mock the API service
jest.mock('@/services/api', () => ({
  getPosts: jest.fn()
}));

describe('TestFeed', () => {
  // Sample post data for testing
  const mockPosts = [
    {
      post_id: 1,
      username: 'user1',
      content: 'Test post 1',
      latitude: 25.7617,
      longitude: -80.1918,
      created_at: '2023-01-01T12:00:00Z'
    },
    {
      post_id: 2,
      username: 'user2',
      content: 'Test post 2',
      latitude: 25.7617,
      longitude: -80.1918,
      created_at: '2023-01-02T12:00:00Z'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    // Make the API call wait for our promise
    (getPosts as jest.Mock).mockImplementation(() => promise);
    
    render(<Feed />);
    
    // Now the component should be in loading state
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    
    // Resolve the promise to allow the test to complete
    resolvePromise({ data: mockPosts });
    await act(() => promise);
  });

  test('renders posts after loading', async () => {
    // Set up the mock to return posts
    (getPosts as jest.Mock).mockResolvedValue({
      data: mockPosts
    });
    
    render(<Feed />);
    
    // Wait for posts to appear
    await waitFor(() => {
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
    });
    
    // Check if posts are rendered correctly
    expect(screen.getByTestId('post-2')).toBeInTheDocument();
    expect(screen.getByText('Test post 1')).toBeInTheDocument();
    expect(screen.getByText('Test post 2')).toBeInTheDocument();
  });

  test('shows error message when API call fails', async () => {
    // Mock API failure
    (getPosts as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<Feed />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument();
    });
  });

  test('shows empty state when no posts are returned', async () => {
    // Mock empty posts array
    (getPosts as jest.Mock).mockResolvedValue({
      data: []
    });
    
    render(<Feed />);
    
    // Wait for the empty state message
    await waitFor(() => {
      expect(screen.getByText('No posts yet')).toBeInTheDocument();
    });
  });

  test('toggles filter visibility when filter button is clicked', async () => {
    // Set up the mock to return posts
    (getPosts as jest.Mock).mockResolvedValue({
      data: mockPosts
    });
    
    render(<Feed />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
    });
    
    // Filter should not be visible initially
    expect(screen.queryByTestId('radius-filter')).not.toBeInTheDocument();
    
    // Click the filter button
    fireEvent.click(screen.getByText('Filter'));
    
    // Filter should now be visible
    expect(screen.getByTestId('radius-filter')).toBeInTheDocument();
    
    // Click the filter button again
    fireEvent.click(screen.getByText('Filter'));
    
    // Filter should be hidden again
    expect(screen.queryByTestId('radius-filter')).not.toBeInTheDocument();
  });

  test('fetches new posts when radius changes', async () => {
    // Set up the mock to return posts
    (getPosts as jest.Mock).mockResolvedValue({
      data: mockPosts
    });
    
    render(<Feed />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
    });
    
    // Reset the mock to track new calls
    jest.clearAllMocks();
    (getPosts as jest.Mock).mockResolvedValue({
      data: mockPosts
    });
    
    // Show the filter
    fireEvent.click(screen.getByText('Filter'));
    
    // Change the radius
    fireEvent.click(screen.getByTestId('radius-change-button'));
    
    // API should be called with new radius
    expect(getPosts).toHaveBeenCalledWith({ radius: 10000 });
  });
}); 