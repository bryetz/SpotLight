'use client';

import { deleteUser } from '@/services/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteUserPage() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await deleteUser(username);
            setSuccess(`Successfully deleted user: ${username}`);
            setUsername(''); // Clear input
            
            // Optional: redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError('Failed to delete user. Please try again.');
            console.error('Delete user error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
                    <h1 className="text-xl font-bold text-white mb-6">Delete User</h1>
                    
                    <form onSubmit={handleDelete} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-[#818384] mb-2">
                                Username to delete
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-[#343536] rounded px-3 py-2 text-white focus:outline-none focus:border-[#4e4f50]"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-3 py-2 rounded text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !username}
                            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Deleting...' : 'Delete User'}
                        </button>
                    </form>

                    <p className="mt-4 text-xs text-[#818384] text-center">
                        Warning: This action cannot be undone.
                    </p>
                </div>
            </div>
        </main>
    );
} 