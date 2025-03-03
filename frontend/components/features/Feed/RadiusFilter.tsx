"use client"

import { useState, useEffect } from 'react'
import { Slider } from '@/components/shadcn/ui/slider'
import { formatDistance, sliderValueToRadius, radiusToSliderValue } from '@/lib/shadcn/utils'
import { MapPin } from 'lucide-react'

interface RadiusFilterProps {
  initialRadius?: number
  onRadiusChange: (radius: number) => void
}

export function RadiusFilter({ initialRadius = 25000, onRadiusChange }: RadiusFilterProps) {
  // Convert the initial radius to a slider value (0-100)
  const initialSliderValue = radiusToSliderValue(initialRadius)
  
  const [sliderValue, setSliderValue] = useState<number>(initialSliderValue)
  const [radius, setRadius] = useState<number>(initialRadius)
  
  // Update radius when slider changes
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0]
    setSliderValue(newValue)
    const newRadius = sliderValueToRadius(newValue)
    setRadius(newRadius)
    onRadiusChange(newRadius)
  }
  
  return (
    <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-4 mb-4">
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
        className="my-4"
      />
      
      <div className="flex justify-between text-xs text-[#818384]">
        <span>500m</span>
        <span>50km</span>
      </div>
    </div>
  )
} 