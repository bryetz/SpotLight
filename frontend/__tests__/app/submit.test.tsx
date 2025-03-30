import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmitPage from '@/app/submit/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

jest.mock('@/services/api', () => ({
  createPost: jest.fn().mockResolvedValue({ data: { message: 'Success' } })
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    userId: '123',
    username: 'testuser',
    isLoading: false
  })
}));

jest.mock('lucide-react', () => ({
  MapPin: () => <div>Location</div>,
  Image: () => <div>Image</div>,
  X: () => <div>Close</div>
}));

describe('SubmitPage', () => {
  beforeEach(() => {
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation(success => 
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        })
      )
    };
    global.navigator.geolocation = mockGeolocation;
  });

  test('renders submit form', () => {
    render(<SubmitPage />);
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
  });

  test('handles text input', () => {
    render(<SubmitPage />);
    const input = screen.getByPlaceholderText("What's on your mind?");
    fireEvent.change(input, { target: { value: 'Test post' } });
    expect(input).toHaveValue('Test post');
  });

  test('renders file upload section', () => {
    render(<SubmitPage />);
    expect(screen.getByText(/Add Image or Video/i)).toBeInTheDocument();
  });
}); 