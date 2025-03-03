"use client"

import { useState } from 'react'
import { Slider } from '@/components/shadcn/ui/slider'
import { formatDistance, sliderValueToRadius, radiusToSliderValue } from '@/lib/slider_functions'
import { MapPin } from 'lucide-react'

interface RadiusFilterProps {
  initialRadius?: number
  minRadius?: number
  maxRadius?: number
  onRadiusChange: (radius: number) => void
}

export function RadiusFilter({ 
  initialRadius = 25000, 
  minRadius = 500, 
  maxRadius = 50000, 
  onRadiusChange 
}: RadiusFilterProps) {
  // Convert the initial radius to a slider value (0-100)
  const initialSliderValue = radiusToSliderValue(initialRadius, minRadius, maxRadius)
  
  const [sliderValue, setSliderValue] = useState<number>(initialSliderValue)
  const [radius, setRadius] = useState<number>(initialRadius)
  
  // Update local state when slider changes (no API call)
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0]
    setSliderValue(newValue)
    const newRadius = sliderValueToRadius(newValue, minRadius, maxRadius)
    setRadius(newRadius)
  }
  
  // Only call the API when slider interaction ends
  const handleSliderCommit = (value: number[]) => {
    const newRadius = sliderValueToRadius(value[0], minRadius, maxRadius)
    onRadiusChange(newRadius)
  }
  
  return (
    <div data-testid="radius-filter" className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-[#818384]" />
          <span className="text-sm font-medium text-white">Search Radius</span>
        </div>
        <span className="text-sm text-[#818384]">{formatDistance(radius)}</span>
      </div>
      
      <Slider
        value={[sliderValue]}
        min={0}
        max={100}
        step={1}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}

        className="my-4"
      />
      
      <div className="flex justify-between text-xs text-[#818384]">
        <span>{formatDistance(minRadius)}</span>
        <span>{formatDistance(maxRadius)}</span>
      </div>
    </div>
  )
} 