import { getPosts } from '@/app/lib/api';

async function fetchPosts() {
  try {
	const response = await getPosts();
	return response.data;
  } catch (error) {
	console.error('Error fetching posts:', error);
	throw new Error('Failed to fetch posts');
  }
}

export default async function TestPage() {
  const posts = await fetchPosts();
  
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">API Response Test</h1>
      <pre className="p-4 rounded-lg overflow-auto">
        {JSON.stringify(posts)}
      </pre>
    </div>
  );
} 