"use client"

import { useState, useRef } from 'react'
import { Slider } from '@/components/shadcn/ui/slider'
import { formatDistance, sliderValueToRadius, radiusToSliderValue } from '@/lib/slider_functions'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/shadcn/ui/input'
import { Button } from '@/components/shadcn/ui/button'

interface RadiusFilterProps {
  initialRadius?: number
  minRadius?: number
  maxRadius?: number
  onRadiusChange: (radius: number) => void
  isOpen?: boolean
}

export function RadiusFilter({ 
  initialRadius = 25000, 
  minRadius = 500, 
  maxRadius = 50000, 
  onRadiusChange,
  isOpen = false
}: RadiusFilterProps) {
  // Convert the initial radius to a slider value (0-100)
  const initialSliderValue = radiusToSliderValue(initialRadius, minRadius, maxRadius)
  
  const [sliderValue, setSliderValue] = useState<number>(initialSliderValue)
  const [radius, setRadius] = useState<number>(initialRadius)
  const [inputValue, setInputValue] = useState<string>(formatDistance(initialRadius))
  
  // Update local state when slider changes (no API call)
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0]
    setSliderValue(newValue)
    const newRadius = sliderValueToRadius(newValue, minRadius, maxRadius)
    setRadius(newRadius)
    setInputValue(formatDistance(newRadius))
  }
  
  // Only call the API when slider interaction ends
  const handleSliderCommit = (value: number[]) => {
    const newRadius = sliderValueToRadius(value[0], minRadius, maxRadius)
    onRadiusChange(newRadius)
  }

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Handle submit button click
  const handleSubmit = () => {
    // Parse the input value to extract numeric part
    const numericValue = parseInt(inputValue.replace(/[^0-9]/g, ''))
    
    if (!isNaN(numericValue)) {
      // Convert to meters based on unit (km or m)
      let newRadiusInMeters = numericValue
      if (inputValue.toLowerCase().includes('km')) {
        newRadiusInMeters = numericValue * 1000
      }
      
      // Clamp to min/max
      newRadiusInMeters = Math.max(minRadius, Math.min(maxRadius, newRadiusInMeters))
      
      // Update the slider value
      const newSliderValue = radiusToSliderValue(newRadiusInMeters, minRadius, maxRadius)
      setSliderValue(newSliderValue)
      setRadius(newRadiusInMeters)
      setInputValue(formatDistance(newRadiusInMeters))
      
      // Call the API
      onRadiusChange(newRadiusInMeters)
    }
  }
  
  return (
    <div 
      data-testid="radius-filter" 
      className={`bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg overflow-hidden transition-all duration-300 ease-in-out
                 ${isOpen ? 'max-h-[300px] opacity-100 p-4 mb-4' : 'max-h-0 opacity-0 p-0 mb-0 border-0'}`}
    >
      {/* Filter content - only visually rendered when isOpen is true but always in DOM */}
      <div className={`${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-in-out`}>
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
        
        <div className="flex justify-between text-xs text-[#818384] mb-4">
          <span>{formatDistance(minRadius)}</span>
          <span>{formatDistance(maxRadius)}</span>
        </div>

        {/* Manual input and submit button */}
        <div className="flex gap-2 mt-4">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter radius (e.g. 5km)"
            className="flex-grow bg-transparent border-[#343536] text-white text-sm"
          />
          <Button 
            onClick={handleSubmit}
            className="bg-[#343536] hover:bg-[#444546] text-white text-sm"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
} 