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
  export function sliderValueToRadius(value: number, minRadius: number = 500, maxRadius: number = 50000): number {
	// Convert slider value to radius between minRadius and maxRadius
	return minRadius + (value / 100) * (maxRadius - minRadius);
  }
  
  // Convert radius in meters to slider value (0-100)
  export function radiusToSliderValue(radius: number, minRadius: number = 500, maxRadius: number = 50000): number {
	// Convert radius to slider value between 0 and 100
	return ((radius - minRadius) / (maxRadius - minRadius)) * 100;
  }