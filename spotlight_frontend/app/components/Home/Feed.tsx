'use client';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import SkeletonPost from '../Home/SkeletonPost';

export default function Feed() {
  const [postCount, setPostCount] = useState(5);
  const { ref, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      setTimeout(() => setPostCount(prev => prev + 3), 1500);
    }
  }, [inView]);

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-5xl mx-auto py-6 px-4">
          <div className="space-y-4">
            {Array.from({ length: postCount }).map((_, i) => (
              <SkeletonPost key={i} />
            ))}
            
            {/* infinite scroll */}
            <div ref={ref} className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4500]" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}