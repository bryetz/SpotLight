// slider_functions.test.ts
import { formatDistance, sliderValueToRadius, radiusToSliderValue } from '@/lib/slider_functions';

describe('Slider Utility Functions', () => {
  test('formatDistance formats meters correctly', () => {
    expect(formatDistance(500)).toBe('500m');
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(10000)).toBe('10.0km');
  });

  test('sliderValueToRadius converts values correctly', () => {
    // Test default min/max
    expect(sliderValueToRadius(0)).toBe(500);
    expect(sliderValueToRadius(50)).toBeCloseTo(25250);
    expect(sliderValueToRadius(100)).toBe(50000);
    
    // Test custom min/max
    expect(sliderValueToRadius(0, 1000, 10000)).toBe(1000);
    expect(sliderValueToRadius(50, 1000, 10000)).toBe(5500);
    expect(sliderValueToRadius(100, 1000, 10000)).toBe(10000);
  });

  test('radiusToSliderValue converts values correctly', () => {
    // Test default min/max
    expect(radiusToSliderValue(500)).toBe(0);
    expect(radiusToSliderValue(25250)).toBeCloseTo(50);
    expect(radiusToSliderValue(50000)).toBe(100);
    
    // Test custom min/max
    expect(radiusToSliderValue(1000, 1000, 10000)).toBe(0);
    expect(radiusToSliderValue(5500, 1000, 10000)).toBe(50);
    expect(radiusToSliderValue(10000, 1000, 10000)).toBe(100);
  });
});