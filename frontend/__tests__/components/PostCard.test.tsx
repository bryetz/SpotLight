import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostCard } from '@/components/features/Post/PostCard';

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon">Location</div>,
  MessageCircle: () => <div data-testid="message-icon">Comments</div>,
  Heart: ({ className }: { className: string }) => <div data-testid="heart-icon" className={className}>Heart</div>,
  Share2: () => <div data-testid="share-icon">Share</div>
}));

describe('TestPostCard', () => {
  // Sample post data for testing
  const mockPost = {
    post_id: 123,
    username: 'testuser',
    content: 'This is a test post content',
    latitude: 25.7617,
    longitude: -80.1918,
    created_at: '2023-06-15T14:30:00Z'
  };

  test('renders post content correctly', () => {
    render(<PostCard post={mockPost} />);
    
    // Check username is displayed
    expect(screen.getByText('testuser')).toBeInTheDocument();
    
    // Check post content is displayed
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    
    // Check coordinates are displayed
    expect(screen.getByText('25.761700, -80.191800')).toBeInTheDocument();
    
    // Check date is formatted and displayed (partial match since formatting might vary)
    const dateElement = screen.getByText(/Jun 15, 2023/i);
    expect(dateElement).toBeInTheDocument();
  });

  test('handles like button click', () => {
    render(<PostCard post={mockPost} />);
    
    // Find the like button and its count
    const likeButton = screen.getByTestId('heart-icon').closest('button');
    const getLikeCount = () => {
      // Get the text content of the span that's a sibling of the heart icon
      const heartIcon = screen.getByTestId('heart-icon');
      const likeCountElement = heartIcon.parentElement.querySelector('span');
      return parseInt(likeCountElement.textContent);
    };
    
    // Initially, like count should be 0
    expect(getLikeCount()).toBe(0);
    
    // Click the like button
    fireEvent.click(likeButton);
    
    // Like count should increase to 1
    expect(getLikeCount()).toBe(1);
    
    // Heart icon should have the filled class
    const heartIcon = screen.getByTestId('heart-icon');
    expect(heartIcon).toHaveClass('fill-current');
    
    // Click again to unlike
    fireEvent.click(likeButton);
    
    // Like count should decrease back to 0
    expect(getLikeCount()).toBe(0);
    
    // Heart icon should not have the filled class
    expect(heartIcon).not.toHaveClass('fill-current');
  });

  test('displays location information', () => {
    render(<PostCard post={mockPost} />);
    
    // Check if location icon is present
    expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    
    // Check if coordinates are formatted correctly
    const coordsText = `${mockPost.latitude.toFixed(6)}, ${mockPost.longitude.toFixed(6)}`;
    expect(screen.getByText(coordsText)).toBeInTheDocument();
  });

  test('formats date correctly', () => {
    // Create a post with a known date
    const postWithSpecificDate = {
      ...mockPost,
      created_at: '2023-01-15T10:30:00Z'
    };
    
    render(<PostCard post={postWithSpecificDate} />);
    
    // Check if date is formatted correctly (using partial match)
    expect(screen.getByText(/Jan 15, 2023/i)).toBeInTheDocument();
    
    // Time should also be displayed (using partial match for flexibility with AM/PM formatting)
    expect(screen.getByText(/10:30/i)).toBeInTheDocument();
  });

  test('handles long post content correctly', () => {
    // Create a post with long content
    const longContent = 'A'.repeat(300); // 300 character string
    const postWithLongContent = {
      ...mockPost,
      content: longContent
    };
    
    render(<PostCard post={postWithLongContent} />);
    
    // The content should be displayed without truncation
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  test('renders with minimal post data', () => {
    // Create a post with minimal data
    const minimalPost = {
      post_id: 456,
      username: 'minimaluser',
      content: 'Minimal content',
      latitude: 0,
      longitude: 0,
      created_at: '2023-01-01T00:00:00Z'
    };
    
    render(<PostCard post={minimalPost} />);
    
    // Check if minimal content is displayed
    expect(screen.getByText('minimaluser')).toBeInTheDocument();
    expect(screen.getByText('Minimal content')).toBeInTheDocument();
    expect(screen.getByText('0.000000, 0.000000')).toBeInTheDocument();
  });
}); 