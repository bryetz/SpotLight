import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/app/login/page';
import { login, register } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the API service
jest.mock('@/services/api', () => ({
  login: jest.fn(),
  register: jest.fn()
}));

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('LoginPage Component', () => {
  // Set up mock implementations
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh
    });
    
    // Set up useAuth mock
    (useAuth as unknown as jest.Mock).mockReturnValue({
      login: mockLogin
    });
    
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  test('renders login form by default', () => {
    render(<LoginPage />);
    
    // Check that the login form is rendered
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  test('switches to register mode when "Sign up" is clicked', () => {
    render(<LoginPage />);
    
    // Click the "Sign up" button
    fireEvent.click(screen.getByText('Sign up'));
    
    // Check that the register form is rendered
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  test('switches back to login mode when "Sign in" is clicked', () => {
    render(<LoginPage />);
    
    // Switch to register mode
    fireEvent.click(screen.getByText('Sign up'));
    
    // Switch back to login mode
    fireEvent.click(screen.getByText('Sign in'));
    
    // Check that the login form is rendered again
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  test('handles login submission correctly', async () => {
    // Mock successful login response
    (login as jest.Mock).mockResolvedValue({
      data: { user_id: 123 }
    });
    
    render(<LoginPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Wait for the login process to complete
    await waitFor(() => {
      // Check that the API was called with correct parameters
      expect(login).toHaveBeenCalledWith('testuser', 'password123');
      
      // Check that localStorage was updated
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', '123');
      
      // Check that auth state was updated
      expect(mockLogin).toHaveBeenCalledWith('testuser', 123);
      
      // Check that navigation occurred
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('handles registration submission correctly', async () => {
    // Mock successful register and login responses
    (register as jest.Mock).mockResolvedValue({});
    (login as jest.Mock).mockResolvedValue({
      data: { user_id: 456 }
    });
    
    render(<LoginPage />);
    
    // Switch to register mode
    fireEvent.click(screen.getByText('Sign up'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'newuser' }
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'newpassword' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    
    // Wait for the registration process to complete
    await waitFor(() => {
      // Check that the register API was called
      expect(register).toHaveBeenCalledWith('newuser', 'newpassword');
      
      // Check that the login API was called after registration
      expect(login).toHaveBeenCalledWith('newuser', 'newpassword');
      
      // Check that localStorage was updated
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', '456');
      
      // Check that auth state was updated
      expect(mockLogin).toHaveBeenCalledWith('newuser', 456);
      
      // Check that navigation occurred
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('displays error message when login fails', async () => {
    // Mock failed login
    (login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    
    render(<LoginPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    
    // Check that navigation did not occur
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('displays error message when registration fails', async () => {
    // Mock failed registration
    (register as jest.Mock).mockRejectedValue(new Error('Username already taken'));
    
    render(<LoginPage />);
    
    // Switch to register mode
    fireEvent.click(screen.getByText('Sign up'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'existinguser' }
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument();
    });
    
    // Check that login was not called after failed registration
    expect(login).not.toHaveBeenCalled();
    
    // Check that navigation did not occur
    expect(mockPush).not.toHaveBeenCalled();
  });
}); 