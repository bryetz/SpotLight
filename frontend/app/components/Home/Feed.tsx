"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useInView } from "react-intersection-observer";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import SkeletonPost from "../Home/SkeletonPost";

interface Post {
    post_id: number;
    username: string;
    content: string;
    created_at: string;
    latitude: number;
    longitude: number;
}

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { ref, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        axios
            .get<Post[]>("http://localhost:8080/api/posts")
            .then((response) => {
                setPosts(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching posts:", error);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-[#030303] flex flex-col text-white">
            <Header />

            <main className="flex-1">
                <div className="max-w-5xl mx-auto py-6 px-4">
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonPost key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <div
                                    key={post.post_id}
                                    className="p-4 bg-[#1a1a1b] border border-[#343536] rounded-md shadow-lg"
                                >
                                    <div className="flex justify-between">
                                        {/* Username */}
                                        <h3 className="text-lg font-semibold text-white">
                                            {post.username}
                                        </h3>
                                        {/* Formatted Date */}
                                        <span className="text-xs text-gray-500">
                                            {new Date(post.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Post Content */}
                                    <p className="text-gray-300 mt-1">{post.content}</p>
                                    {/* Location */}
                                    <div className="text-xs text-gray-500 mt-2">
                                        📍 {post.latitude}, {post.longitude}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Infinite Scroll Placeholder */}
                    <div ref={ref} className="h-32 flex items-center justify-center">
                        {inView && loading && (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4500]" />
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
