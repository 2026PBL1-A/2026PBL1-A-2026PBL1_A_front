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

  // 投稿を新しい順にソート
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div>
      <div className="fixed top-4 left-4 z-10">
        <span className="font-bold text-gray-700 bg-white/80 px-3 py-1 rounded shadow-sm backdrop-blur-sm">
          {currentUserName}
        </span>
      </div>
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="mt-16 px-4 pb-20 max-w-4xl mx-auto">
        {error && (
          <div className="p-3 mb-6 bg-yellow-100 text-yellow-800 rounded">
            ⚠️ {error} (ダミーデータを表示しています)
          </div>
        )}

        {isLoading && <p className="text-gray-500 text-center py-10">読み込み中...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {sortedPosts.map((post) => (
            <Link href={`/post/${post.id}`} key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* 画像枠 */}
              <div className="w-full aspect-video bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden relative">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-xs font-medium text-gray-400">No Image</span>
                  </div>
                )}
                {/* タグを画像の上に絶対配置 */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${post.type === 'creation' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                    {post.type === 'creation' ? '制作物' : '質問'}
                  </span>
                </div>
              </div>

              {/* コンテンツエリア */}
              <div className="p-5 flex flex-col flex-grow">
                {post.createdAt && (
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    {new Date(post.createdAt).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="line-clamp-3 text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                  {post.content}
                </p>
                
                {/* 続きを読む要素 */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-600 transition-colors">詳細を見る</span>
                  <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 投稿ボタン群 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <Link href="/post/new/question">
          <button className="w-44 bg-orange-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-orange-600 transition font-bold flex items-center justify-center gap-2 hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            質問を投稿
          </button>
        </Link>
        <Link href="/post/new/creation">
          <button className="w-44 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-600 transition font-bold flex items-center justify-center gap-2 hover:-translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            制作物を投稿
          </button>
        </Link>
      </div>


    </div>
  );
}
