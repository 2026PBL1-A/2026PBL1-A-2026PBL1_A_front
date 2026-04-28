"use client";

import Menu from "@/app/components/aikon";
import { useEffect, useState } from "react";
import Link from "next/link";
import { dummyPosts, Post } from "@/app/data/dummyPosts";
import { isUsingBackend } from "@/lib/api";

export default function Page() {
  const [currentUserName, setCurrentUserName] = useState("ゲストユーザー");
  const [posts, setPosts] = useState<Post[]>(dummyPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ユーザー名を取得
    const storedUserName = localStorage.getItem("user_name");
    if (storedUserName) {
      setCurrentUserName(storedUserName);
    }

    // 投稿データを取得（ソース切り替え）
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isUsingBackend()) {
          // バックエンドから投稿データを取得
          const token = localStorage.getItem("access_token");
          const response = await fetch("/api/posts", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch posts: ${response.status}`);
          }

          const data = await response.json();
          // バックエンドのレスポンス形式に応じて調整（配列を想定）
          setPosts(Array.isArray(data) ? data : data.posts || []);
          console.info("[Posts] バックエンドから投稿を取得");
        } else {
          // ローカルダミーデータを使用
          setPosts(dummyPosts);
          console.info("[Posts] ローカルダミーデータを使用");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "投稿の取得に失敗しました";
        console.error("[Posts] 取得エラー:", message);
        // エラー時はダミーデータにフォールバック
        setPosts(dummyPosts);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <div className="fixed top-4 left-4 z-10">
        <span className="font-bold text-gray-700 bg-white/80 px-3 py-1 rounded shadow-sm backdrop-blur-sm">
          {currentUserName}
        </span>
      </div>
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="mt-16 space-y-6 px-4 pb-20 max-w-2xl mx-auto">
        {error && (
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded">
            ⚠️ {error} (ダミーデータを表示しています)
          </div>
        )}

        {isLoading && <p className="text-gray-500">読み込み中...</p>}

        {posts.map((post) => (
          <Link href={`/post/${post.id}`} key={post.id} className="block border rounded shadow p-4 hover:bg-gray-50 transition">
            {/* 見出し */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-bold rounded ${post.type === 'creation' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                {post.type === 'creation' ? '制作物' : '質問'}
              </span>
              <h2 className="text-lg font-bold">
                {post.title}
              </h2>
            </div>
            {/* 画像枠 */}
            <div className="w-full h-40 bg-gray-200 mb-2 flex items-center justify-center text-gray-500 rounded">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover rounded" />
              ) : (
                "画像エリア"
              )}
            </div>

            {/* 本文 */}
            <p className="line-clamp-2 text-gray-700">
              {post.content}
            </p>
          </Link>
        ))}

      </div>

      {/* 投稿ボタン */}
      <Link href="/post/new">
        <button className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition">
          投稿
        </button>
      </Link>
    </div>
  );
}