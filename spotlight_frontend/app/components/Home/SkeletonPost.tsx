export default function SkeletonPost() {
	return (
	  <div className="bg-[#1a1a1b] border border-[#343536] rounded-md mb-3 animate-pulse">
		<div className="p-4">
		  <div className="flex gap-4">
			{/* Thumbnail Skeleton */}
			<div className="w-64 h-36 bg-[#272729] rounded-lg" />
  
			{/* Content Skeleton */}
			<div className="flex-1 space-y-3">
			  <div className="h-4 bg-[#272729] rounded w-3/4" />
			  <div className="h-3 bg-[#272729] rounded w-1/2" />
			  <div className="flex gap-4">
				<div className="h-3 bg-[#272729] rounded w-16" />
				<div className="h-3 bg-[#272729] rounded w-24" />
				<div className="h-3 bg-[#272729] rounded w-20" />
			  </div>
			  <div className="flex gap-2">
				<div className="h-4 bg-[#272729] rounded w-12" />
				<div className="h-4 bg-[#272729] rounded w-12" />
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	);
  }