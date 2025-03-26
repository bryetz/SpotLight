import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmitPage from '@/app/submit/page';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/services/api';
import { useRouter } from 'next/navigation';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the API service
jest.mock('@/services/api', () => ({
  createPost: jest.fn()
}));

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon">Location</div>
}));

describe('TestSubmitPage', () => {
  // Set up mock implementations
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  
  // Mock fetch for reverse geocoding
  const mockFetchResponse = {
    json: jest.fn().mockResolvedValue({
      display_name: '123 Main St, Anytown, USA',
      address: {
        city: 'Anytown',
        state: 'State'
      }
    })
  };
  global.fetch = jest.fn().mockResolvedValue(mockFetchResponse);
  
  // Mock geolocation
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
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack
    });
    
    // Set up useAuth mock with authenticated user
    (useAuth as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: 123
    });
    
    // Set up geolocation mock
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });
  });

  test('redirects to login if user is not authenticated', () => {
    // Mock unauthenticated user
    (useAuth as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null
    });
    
    render(<SubmitPage />);
    
    // Check that router.push was called with '/login'
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  test('gets user location on mount when authenticated', async () => {
    render(<SubmitPage />);
    
    // Check that geolocation was requested
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    
    // Check that fetch was called for reverse geocoding
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://nominatim.openstreetmap.org/reverse')
      );
    });
  });

  test('displays location information after getting coordinates', async () => {
    render(<SubmitPage />);
    
    // Wait for location to be set
    await waitFor(() => {
      // Check that city and state are displayed
      expect(screen.getByText('Anytown, State')).toBeInTheDocument();
      
      // Check that coordinates are displayed
      expect(screen.getByText('40.712800, -74.006000')).toBeInTheDocument();
    });
  });

  test('handles form submission with valid data', async () => {
    // Mock successful post creation
    (createPost as jest.Mock).mockResolvedValue({});
    
    render(<SubmitPage />);
    
    // Wait for location to be set
    await waitFor(() => {
      expect(screen.getByText('Anytown, State')).toBeInTheDocument();
    });
    
    // Fill in the content
    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
      target: { value: 'This is a test post' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));
    
    // Check that createPost was called with the correct data
    await waitFor(() => {
      expect(createPost).toHaveBeenCalledWith({
        user_id: 123,
        content: 'This is a test post',
        latitude: 40.7128,
        longitude: -74.0060
      });
      
      // Check that navigation occurred
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('displays error when content is empty', async () => {
    render(<SubmitPage />);
    
    // Wait for location to be set
    await waitFor(() => {
      expect(screen.getByText('Anytown, State')).toBeInTheDocument();
    });
    
    // Submit the form without content
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));
    
    // Check that error message is displayed
    expect(screen.getByText('Please enter some content for your post.')).toBeInTheDocument();
    
    // Check that createPost was not called
    expect(createPost).not.toHaveBeenCalled();
  });

  test('displays error when post creation fails', async () => {
    // Mock failed post creation
    (createPost as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<SubmitPage />);
    
    // Wait for location to be set
    await waitFor(() => {
      expect(screen.getByText('Anytown, State')).toBeInTheDocument();
    });
    
    // Fill in the content
    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
      target: { value: 'This is a test post' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));
    
    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create post. Please try again.')).toBeInTheDocument();
    });
    
    // Check that navigation did not occur
    expect(mockPush).not.toHaveBeenCalledWith('/');
  });

  test('handles geolocation error', async () => {
    // Mock geolocation error
    mockGeolocation.getCurrentPosition = jest.fn().mockImplementation((success, error) => 
      error({ message: 'User denied geolocation' })
    );
    
    render(<SubmitPage />);
    
    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Please enable location services to create a post.')).toBeInTheDocument();
    });
  });

  test('navigates back when cancel button is clicked', async () => {
    render(<SubmitPage />);
    
    // Click the cancel button
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Check that router.back was called
    expect(mockBack).toHaveBeenCalled();
  });

  test('shows character count for content', async () => {
    render(<SubmitPage />);
    
    // Check initial character count
    expect(screen.getByText('0/500')).toBeInTheDocument();
    
    // Enter some content
    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
      target: { value: 'This is a test post' } // 19 characters
    });
    
    // Check updated character count
    expect(screen.getByText('19/500')).toBeInTheDocument();
  });

  test('disables post button when location is not available', async () => {
    // Mock no location available yet
    mockGeolocation.getCurrentPosition = jest.fn(); // Don't call success callback
    
    render(<SubmitPage />);
    
    // Check that post button is disabled
    const postButton = screen.getByRole('button', { name: 'Post' });
    expect(postButton).toBeDisabled();
  });
}); 