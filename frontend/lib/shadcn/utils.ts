import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert kilometers to a readable format
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  } else {
    const km = meters / 1000;
    return `${km.toFixed(1)}km`;
  }
}

// Convert slider value (0-100) to radius in meters
export function sliderValueToRadius(value: number): number {
  // Min radius: 500m, Max radius: 50km
  return 500 + (value / 100) * 49500;
}

// Convert radius in meters to slider value (0-100)
export function radiusToSliderValue(radius: number): number {
  return ((radius - 500) / 49500) * 100;
}