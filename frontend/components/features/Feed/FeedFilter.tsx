"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Slider } from '@/components/shadcn/ui/slider'
import { formatDistance, sliderValueToRadius, radiusToSliderValue } from '@/lib/slider_functions'
import { MapPin, TrendingUp, Clock, Sparkles, LocateFixed, Loader2 } from 'lucide-react'
import { Input } from '@/components/shadcn/ui/input'
import { Button } from '@/components/shadcn/ui/button'
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/ui/toggle-group"

// Import Leaflet components dynamically to avoid SSR issues
import dynamic from 'next/dynamic'
import L, { LatLngExpression, LatLng } from 'leaflet'
import { useMapEvents } from 'react-leaflet'

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

// Define Leaflet icon (adjust paths if necessary)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Define type for location state
interface LocationState {
  lat: number
  lng: number
}

interface FeedFilterProps {
  initialRadius?: number
  minRadius?: number
  maxRadius?: number
  onRadiusChange: (radius: number) => void
  isOpen?: boolean
  currentSortOrder: string
  currentTimeFilter: string
  onSortChange: (value: string) => void
  onTimeChange: (value: string) => void
  currentLocation?: LocationState | null
  onLocationChange: (location: LocationState) => void
}

export function FeedFilter({ 
  initialRadius = 25000, 
  minRadius = 500, 
  maxRadius = 50000, 
  onRadiusChange,
  isOpen = false,
  currentSortOrder,
  currentTimeFilter,
  onSortChange,
  onTimeChange,
  currentLocation, // Can be null initially
  onLocationChange
}: FeedFilterProps) {
  // Convert the initial radius to a slider value (0-100)
  const initialSliderValue = radiusToSliderValue(initialRadius, minRadius, maxRadius)
  
  const [sliderValue, setSliderValue] = useState<number>(initialSliderValue)
  const [radius, setRadius] = useState<number>(initialRadius)
  const [inputValue, setInputValue] = useState<string>(formatDistance(initialRadius))
  
  // Map State
  const defaultLocation: LocationState = { lat: 51.505, lng: -0.09 } // Default fallback (London)
  const [mapCenter, setMapCenter] = useState<LocationState>(currentLocation || defaultLocation)
  const [mapZoom, setMapZoom] = useState<number>(10) // Default zoom
  const [isLocating, setIsLocating] = useState<boolean>(!currentLocation)

  const mapRef = useRef<L.Map | null>(null)

  // Effect to get user's current location on initial mount if not provided
  useEffect(() => {
    if (!currentLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setMapCenter(newLoc)
          onLocationChange(newLoc) // Update parent state immediately
          // Fly map to new location
          mapRef.current?.flyTo([newLoc.lat, newLoc.lng], 13)
          setIsLocating(false)
        },
        (error) => {
          console.error("Geolocation error:", error)
          // Keep default location if geolocation fails
          setMapCenter(defaultLocation)
          onLocationChange(defaultLocation) // Update parent with default
          setIsLocating(false)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      )
    } else {
         // If location is provided, set map center
         setMapCenter(currentLocation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  // Effect to update local radius when slider value changes
  useEffect(() => {
      const newRadius = sliderValueToRadius(sliderValue, minRadius, maxRadius)
      setRadius(newRadius)
      setInputValue(formatDistance(newRadius))
  }, [sliderValue, minRadius, maxRadius])

  // Radius handlers
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
    // Radius state is updated via useEffect
  }
  
  const handleSliderCommit = (value: number[]) => {
    const newRadius = sliderValueToRadius(value[0], minRadius, maxRadius)
    onRadiusChange(newRadius) // Inform parent (Feed) about the committed radius change
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSubmit = () => {
    const numericValue = parseInt(inputValue.replace(/[^0-9]/g, ''))
    if (!isNaN(numericValue)) {
      let newRadiusInMeters = numericValue
      if (inputValue.toLowerCase().includes('km')) {
        newRadiusInMeters = numericValue * 1000
      }
      newRadiusInMeters = Math.max(minRadius, Math.min(maxRadius, newRadiusInMeters))
      const newSliderValue = radiusToSliderValue(newRadiusInMeters, minRadius, maxRadius)
      setSliderValue(newSliderValue) // Update slider
      // Radius state is updated via useEffect
      onRadiusChange(newRadiusInMeters) // Inform parent
    }
  }
  
  // Function to center map on current location
  const centerMapOnUser = () => {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude }
          setMapCenter(newLoc)
          onLocationChange(newLoc)
          mapRef.current?.flyTo([newLoc.lat, newLoc.lng], 13)
          setIsLocating(false)
        },
        (error) => {
          console.error("Geolocation error:", error)
          setIsLocating(false)
          // Optionally show an error message to the user
        }
      )
    }

  // Memoize map center array to prevent unnecessary re-renders
  const mapCenterLatLng: LatLngExpression = useMemo(() => [mapCenter.lat, mapCenter.lng], [mapCenter.lat, mapCenter.lng])

  // Define Map Event Handling Logic *within* the main component
  const MapEvents = () => {
    const map = useMapEvents({
      moveend: () => {
        const center = map.getCenter()
        const newCenter = { lat: center.lat, lng: center.lng }
        setMapCenter(newCenter)
        onLocationChange(newCenter)
      },
      zoomend: () => {
         const currentZoom = map.getZoom()
         setMapZoom(currentZoom)
      }
    })
    return null
  }

  return (
    <div 
      data-testid="feed-filter" 
      className={`bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg overflow-hidden transition-all duration-300 ease-in-out
                 ${isOpen ? 'max-h-[800px] opacity-100 p-4 mb-4' : 'max-h-0 opacity-0 p-0 mb-0 border-0'}`} // Increased max-h
    >
      {/* Filter content - only visually rendered when isOpen is true but always in DOM */}
      <div className={`${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-in-out`}>
        {/* Location Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                 <MapPin className="w-4 h-4 mr-2 text-[#818384]" />
                 <span className="text-sm font-medium text-white">Location Filter</span>
              </div>
              <Button 
                 variant="ghost" 
                 size="icon"
                 onClick={centerMapOnUser}
                 disabled={isLocating}
                 className="h-6 w-6 text-[#818384] hover:text-white hover:bg-white/10"
                 title="Center map on my location"
               >
                 {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <LocateFixed className="h-4 w-4" />}
             </Button>
          </div>
           <div className="h-48 w-full rounded-md overflow-hidden border border-[#343536] mb-2 relative">
             {typeof window !== 'undefined' && (
                 <MapContainer 
                     center={mapCenterLatLng} 
                     zoom={mapZoom} 
                     style={{ height: '100%', width: '100%', backgroundColor: '#1a1a1b' }}
                     scrollWheelZoom={true}
                     ref={mapRef}
                     zoomControl={false} // Optional: hide default zoom control
                 >
                     <TileLayer
                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                         url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                     />
                     {/* Draggable Marker - Consider making this draggable later */}
                     <Marker position={mapCenterLatLng}></Marker>
                     {/* Radius Circle */}
                     <Circle 
                         center={mapCenterLatLng} 
                         radius={radius} 
                         pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.1, weight: 1 }}
                     />
                     <MapEvents />
                 </MapContainer>
             )}
           </div>
             <p className="text-xs text-center text-[#818384]">
               Location: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
             </p>
        </div>

        {/* Divider */}
        <hr className="border-t border-[#343536] my-4" />

        {/* Radius Section */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {/* <MapPin className="w-4 h-4 mr-2 text-[#818384]" /> remove icon? */}
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

        {/* Divider */}
        <hr className="border-t border-[#343536] my-4" />

        {/* Sort Order Section */}
         <div className="mb-4">
           <span className="text-sm font-medium text-white block mb-2">Sort By</span>
           <ToggleGroup 
             type="single" 
             value={currentSortOrder} 
             onValueChange={onSortChange}
             aria-label="Sort posts by"
             className="justify-start"
           >
             <ToggleGroupItem value="new" aria-label="Sort by new" title="Sort by New" className="px-2.5 py-1 h-auto data-[state=on]:bg-white/10 data-[state=on]:text-white text-[#818384] hover:bg-[#444546] text-xs rounded-md border border-transparent">
               <Sparkles className="h-3.5 w-3.5 mr-1.5" /> New
             </ToggleGroupItem>
             <ToggleGroupItem value="top" aria-label="Sort by top liked" title="Sort by Top Liked" className="ml-2 px-2.5 py-1 h-auto data-[state=on]:bg-white/10 data-[state=on]:text-white text-[#818384] hover:bg-[#444546] text-xs rounded-md border border-transparent">
               <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Top
             </ToggleGroupItem>
           </ToggleGroup>
        </div>

        {/* Time Frame Section */}
        <div>
           <span className="text-sm font-medium text-white block mb-2">Time Frame</span>
           <ToggleGroup 
             type="single" 
             value={currentTimeFilter} 
             onValueChange={onTimeChange} 
             aria-label="Filter posts by time frame"
             className="justify-start"
           >
             <ToggleGroupItem value="today" aria-label="Filter by today" title="Today" className="px-2.5 py-1 h-auto data-[state=on]:bg-white/10 data-[state=on]:text-white text-[#818384] hover:bg-[#444546] text-xs rounded-md border border-transparent">
               Today
             </ToggleGroupItem>
             <ToggleGroupItem value="week" aria-label="Filter by this week" title="This Week" className="ml-2 px-2.5 py-1 h-auto data-[state=on]:bg-white/10 data-[state=on]:text-white text-[#818384] hover:bg-[#444546] text-xs rounded-md border border-transparent">
               Week
             </ToggleGroupItem>
             <ToggleGroupItem value="month" aria-label="Filter by this month" title="This Month" className="ml-2 px-2.5 py-1 h-auto data-[state=on]:bg-white/10 data-[state=on]:text-white text-[#818384] hover:bg-[#444546] text-xs rounded-md border border-transparent">
               Month
             </ToggleGroupItem>
             <ToggleGroupItem value="all" aria-label="Filter by all time" title="All Time" className="ml-2 px-2.5 py-1 h-auto data-[state=on]:bg-white/10 data-[state=on]:text-white text-[#818384] hover:bg-[#444546] text-xs rounded-md border border-transparent">
               All Time
             </ToggleGroupItem>
           </ToggleGroup>
        </div>

      </div>
    </div>
  )
} 