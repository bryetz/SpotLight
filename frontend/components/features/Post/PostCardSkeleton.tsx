import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcn/ui/card";
import { Skeleton } from "@/components/shadcn/ui/skeleton";
import { MapPin, MessageCircle, Heart, Share2 } from 'lucide-react';

export function PostCardSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6 animate-pulse bg-black/20 border border-[#343536]">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32 bg-gray-700" />
            <Skeleton className="h-3 w-24 bg-gray-700/50" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
        <Skeleton className="h-4 w-5/6 mb-4 bg-gray-700" />
        
        {/* <Skeleton className="h-64 w-full rounded-md mb-4 bg-gray-700" /> */}
        <div className="flex items-center text-xs text-muted-foreground space-x-1">
          <MapPin className="h-3 w-3 text-gray-500" />
          <Skeleton className="h-3 w-20 bg-gray-700/50" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-4 text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 text-gray-500" />
            <Skeleton className="h-4 w-6 bg-gray-700/50" />
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4 text-gray-500" />
             <Skeleton className="h-4 w-6 bg-gray-700/50" />
          </div>
          <div className="flex items-center space-x-1">
            <Share2 className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 