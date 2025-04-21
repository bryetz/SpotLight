"use client";

import { Post } from '@/types/post';
import { PostCard } from '@/components/features/Post/PostCard';
import { PostCardSkeleton } from '@/components/features/Post/PostCardSkeleton';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { getPosts } from '@/services/api';
import useSWRInfinite from 'swr/infinite';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';

const FeedFilter = dynamic(() => 
  import('./FeedFilter').then(mod => mod.FeedFilter),
  { 
    ssr: false, 
  }
);

const PAGE_LIMIT = 5;

interface LocationCoords {
  lat: number;
  lng: number;
}

const fetcher = async (url: string) => {
  const searchParams = new URLSearchParams(url.split('?')[1] || '');

  const params = {
    latitude: searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined,
    longitude: searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined,
    radius: searchParams.get('distance') ? parseInt(searchParams.get('distance')!, 10) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : PAGE_LIMIT,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0,
    sort: searchParams.get('sort') || 'new',
    time: searchParams.get('time') || 'all',
  };
  const response = await getPosts(params);
  return Array.isArray(response.data) ? response.data : [];
};

export function Feed() {
  const [radius, setRadius] = useState<number>(25000);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterLocation, setFilterLocation] = useState<LocationCoords | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('new');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const getKey = (pageIndex: number, previousPageData: Post[] | null) => {
    if (previousPageData && !previousPageData.length) return null;

    const offset = pageIndex * PAGE_LIMIT;
    let url = `/api/posts?limit=${PAGE_LIMIT}&offset=${offset}&distance=${radius}&sort=${sortOrder}&time=${timeFilter}`;

    if (filterLocation) {
      url += `&latitude=${filterLocation.lat}&longitude=${filterLocation.lng}`;
    } else {
      url += `&latitude=${Number.POSITIVE_INFINITY}&longitude=${Number.POSITIVE_INFINITY}`;
    }
    return url;
  };

  const {
    data: pages,
    error,
    size,
    setSize,
    isLoading: isLoadingSWR,
    isValidating 
  } = useSWRInfinite<Post[]>(getKey, fetcher, {
    revalidateFirstPage: false,
  });

  const posts: Post[] = pages ? pages.flat() : [];
  const isLoadingInitial = isLoadingSWR && !pages && !error;
  const isLoadingMore = isLoadingSWR && size > 1;
  const isEmpty = !isLoadingSWR && posts.length === 0 && !error;
  const isReachingEnd = pages && pages[pages.length - 1]?.length < PAGE_LIMIT;

  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && !isReachingEnd && !isLoadingMore && !isValidating) {
      setSize(size + 1);
    }
  }, [inView, isReachingEnd, isLoadingMore, isValidating, setSize, size]);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    setSize(1);
  };

  const handleSortChange = (value: string) => {
    if (value) {
      setSortOrder(value);
      setSize(1);
    }
  };

  const handleTimeChange = (value: string) => {
    if (value) {
      setTimeFilter(value);
      setSize(1);
    }
  };

  const handleLocationChange = (newLocation: LocationCoords) => {
    console.log("New location selected:", newLocation);
    setFilterLocation(newLocation);
    setSize(1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handlePostDeleted = (deletedPostId: number) => {
    console.log(`Post ${deletedPostId} deleted. Triggering revalidation.`);
    setSize(size);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-white">Feed</h1>
        <button 
          onClick={toggleFilters}
          title="Show/Hide Filters"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#d7dadc] bg-black/20 hover:bg-black/30 backdrop-blur-[4px] rounded-full transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>
      
      <FeedFilter 
        initialRadius={radius}
        minRadius={1000}
        maxRadius={200000}
        onRadiusChange={handleRadiusChange}
        isOpen={showFilters}
        currentSortOrder={sortOrder}
        currentTimeFilter={timeFilter}
        onSortChange={handleSortChange}
        onTimeChange={handleTimeChange}
        currentLocation={filterLocation}
        onLocationChange={handleLocationChange}
      />

      {error && !isLoadingSWR && (
        <div className="bg-black/20 backdrop-blur-[4px] border border-red-500/20 rounded-lg p-4 my-4">
          <p className="text-red-400 text-center">Error loading posts: {error.message}</p>
        </div>
      )}

      {isLoadingInitial && (
        <div className="space-y-4 mt-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {isEmpty && (
        <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6 mt-4">
          <p className="text-[#818384] text-center">No posts found matching the criteria.</p>
        </div>
      )}

      {!isLoadingInitial && posts.length > 0 && (
        <div className="space-y-4 mt-4">
          {posts.map((post) => (
            <PostCard 
              key={post.post_id} 
              post={post} 
              isClickable={true}
              onDelete={handlePostDeleted}
            />
          ))}
        </div>
      )}

      <div ref={ref} className="h-10 flex justify-center items-center">
        {isLoadingMore && !isReachingEnd && (
          <Loader2 data-testid="loader-icon" className="w-6 h-6 text-white animate-spin" />
        )}
        {isReachingEnd && posts.length > 0 && (
          <p className="text-sm text-[#818384]">You've reached the end!</p>
        )}
      </div>
    </div>
  );
}