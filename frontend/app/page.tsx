import { Feed } from '@/app/components/features/Feed';
import { getPosts } from '@/app/lib/api';
import { Post } from '@/app/types/post';

async function fetchPosts(): Promise<Post[]> {
  try {
    const response = await getPosts();
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Failed to fetch posts');
  }
}

export default async function Home() {
  const initialPosts = await fetchPosts();
  
  return (
    <main className="min-h-screen">
      <Feed initialPosts={initialPosts} />
    </main>
  );
}