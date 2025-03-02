// RadiusFilter.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the lucide-react MapPin component to avoid the ES module issue
jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon">MapPin Icon</div>
}));

// Mock the slider component
jest.mock('@/components/shadcn/ui/slider', () => ({
  Slider: ({ value, onValueChange, onValueCommit }: { value: number[], onValueChange: (value: number[]) => void, onValueCommit: (value: number[]) => void }) => (
    <input 
      type="range" 
      data-testid="slider" 
      value={value[0]} 
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      onMouseUp={(e) => onValueCommit([parseInt(e.target.value)])}
    />
  )
}));

// Mock the slider functions
jest.mock('@/lib/slider_functions', () => ({
  formatDistance: (meters: number) => meters < 1000 ? `${meters}m` : `${(meters/1000).toFixed(1)}km`,
  sliderValueToRadius: (value: number, min = 500, max = 50000) => min + (value / 100) * (max - min),
  radiusToSliderValue: (radius: number, min = 500, max = 50000) => ((radius - min) / (max - min)) * 100
}));

// Import the component after mocking its dependencies
import { RadiusFilter } from '@/components/features/Feed/RadiusFilter';

describe('RadiusFilter Component', () => {
  // Basic rendering test
  test('renders the component', () => {
    const mockOnRadiusChange = jest.fn();
    const { getByText } = render(<RadiusFilter onRadiusChange={mockOnRadiusChange} />);
    
    // Check if the component renders with the correct title
    expect(getByText('Search Radius')).toBeInTheDocument();
  });

  // Test with custom initial radius
  test('renders with custom initial radius', () => {
    const mockOnRadiusChange = jest.fn();
    const customRadius = 10000;
    const { getByText } = render(
      <RadiusFilter 
        initialRadius={customRadius} 
        onRadiusChange={mockOnRadiusChange} 
      />
    );
    
    // Check if the formatted distance is displayed
    expect(getByText('10.0km')).toBeInTheDocument();
  });

  // Test slider interaction
  test('updates radius when slider changes', () => {
    const mockOnRadiusChange = jest.fn();
    const { getByTestId, getByText } = render(
      <RadiusFilter onRadiusChange={mockOnRadiusChange} />
    );
    
    const slider = getByTestId('slider');
    
    // Simulate slider change to 50% (middle value)
    fireEvent.change(slider, { target: { value: '50' } });
    
    // Check if the displayed radius updates (should be 25.3km)
    expect(getByText('25.3km')).toBeInTheDocument();
    
    // The callback shouldn't be called yet (only on commit)
    expect(mockOnRadiusChange).not.toHaveBeenCalled();
  });

  // Test callback on slider commit
  test('calls onRadiusChange when slider is committed', () => {
    const mockOnRadiusChange = jest.fn();
    const { getByTestId } = render(
      <RadiusFilter onRadiusChange={mockOnRadiusChange} />
    );
    
    const slider = getByTestId('slider');
    
    // Simulate slider change and commit
    fireEvent.change(slider, { target: { value: '75' } });
    fireEvent.mouseUp(slider);
    
    // Check if the callback was called with the correct value
    expect(mockOnRadiusChange).toHaveBeenCalledTimes(1);
    expect(mockOnRadiusChange).toHaveBeenCalledWith(37625); // 75% between 500 and 50000
  });

  // Test with custom min/max radius
  test('respects custom min and max radius values', () => {
    const mockOnRadiusChange = jest.fn();
    const minRadius = 1000;
    const maxRadius = 20000;
    
    const { getByText } = render(
      <RadiusFilter 
        minRadius={minRadius}
        maxRadius={maxRadius}
        onRadiusChange={mockOnRadiusChange}
      />
    );
    
    // Check if min and max values are displayed correctly
    expect(getByText('1.0km')).toBeInTheDocument();
    expect(getByText('20.0km')).toBeInTheDocument();
  });
});