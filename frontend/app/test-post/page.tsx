"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Textarea } from "@/components/shadcn/ui/textarea";
import { Slider } from "@/components/shadcn/ui/slider";
import { Label } from "@/components/shadcn/ui/label";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { toast } from "sonner";
import { createPost } from '@/services/api';

interface Location {
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  state?: string;
}

export default function TestPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [customLocation, setCustomLocation] = useState<Location>({ lat: 0, lon: 0 });
  const [distance, setDistance] = useState(1); // in kilometers
  const [direction, setDirection] = useState(0); // in degrees, 0 = North, 90 = East, etc.
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Get current location when component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setCurrentLocation(userLocation);
          setCustomLocation(userLocation); // Initialize custom location with current location
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get your location. Please enter location manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  }, []);

  // Calculate a new location based on distance and direction
  const calculateNewLocation = () => {
    if (!currentLocation) return;
    
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert degrees to radians
    const lat1 = currentLocation.lat * Math.PI / 180;
    const lon1 = currentLocation.lon * Math.PI / 180;
    const directionRad = direction * Math.PI / 180;
    
    // Calculate new latitude and longitude
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(directionRad)
    );
    
    const lon2 = lon1 + Math.atan2(
      Math.sin(directionRad) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    // Convert back to degrees
    const newLat = lat2 * 180 / Math.PI;
    const newLon = lon2 * 180 / Math.PI;
    
    setCustomLocation({
      ...customLocation,
      lat: parseFloat(newLat.toFixed(6)),
      lon: parseFloat(newLon.toFixed(6))
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customLocation || !title || !content) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          title,
          body: content,
          latitude: customLocation.lat,
          longitude: customLocation.lon
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      toast.success("Test post created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDirectionLabel = (degrees: number) => {
    const directions = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Create Test Post</h1>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Location Settings</h2>
          
          {currentLocation ? (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Current Location:</p>
              <p>Latitude: {currentLocation.lat.toFixed(6)}, Longitude: {currentLocation.lon.toFixed(6)}</p>
            </div>
          ) : (
            <p className="mb-4 text-yellow-600">Fetching your current location...</p>
          )}
          
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="distance">Distance from current location (km): {distance.toFixed(2)}</Label>
              <Slider 
                id="distance"
                value={[distance]} 
                min={0.1} 
                max={200} 
                step={0.1} 
                onValueChange={(value) => setDistance(value[0])}
                className="my-2" 
              />
            </div>
            
            <div>
              <Label htmlFor="direction">Direction: {direction}° ({getDirectionLabel(direction)})</Label>
              <Slider 
                id="direction"
                value={[direction]} 
                min={0} 
                max={359} 
                step={1} 
                onValueChange={(value) => setDirection(value[0])}
                className="my-2" 
              />
            </div>
            
            <Button 
              type="button" 
              onClick={calculateNewLocation}
              disabled={!currentLocation}
              className="w-full"
            >
              Calculate New Location
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="custom-lat">Custom Latitude</Label>
              <Input 
                id="custom-lat"
                type="number" 
                step="0.000001"
                value={customLocation.lat} 
                onChange={(e) => setCustomLocation({...customLocation, lat: parseFloat(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="custom-lon">Custom Longitude</Label>
              <Input 
                id="custom-lon"
                type="number" 
                step="0.000001"
                value={customLocation.lon} 
                onChange={(e) => setCustomLocation({...customLocation, lon: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-address">Address (optional)</Label>
              <Input 
                id="custom-address"
                value={customLocation.address || ""} 
                onChange={(e) => setCustomLocation({...customLocation, address: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-city">City (optional)</Label>
                <Input 
                  id="custom-city"
                  value={customLocation.city || ""} 
                  onChange={(e) => setCustomLocation({...customLocation, city: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="custom-state">State (optional)</Label>
                <Input 
                  id="custom-state"
                  value={customLocation.state || ""} 
                  onChange={(e) => setCustomLocation({...customLocation, state: e.target.value})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Post title" 
            required 
          />
        </div>
        
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea 
            id="content"
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="What's on your mind?" 
            rows={5} 
            required 
          />
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating Test Post..." : "Create Test Post"}
        </Button>
      </form>
    </div>
  );
} 