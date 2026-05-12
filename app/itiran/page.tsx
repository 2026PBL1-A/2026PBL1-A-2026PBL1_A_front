"use client";

import Menu from "@/app/components/aikon";
import { useEffect, useState } from "react";
import Link from "next/link";
import { dummyPosts, Post } from "@/app/data/dummyPosts";
import { isUsingBackend } from "@/lib/api";
import { parseDateString, formatDate } from "@/lib/formatDate";

export default function Page() {
  const [currentUserName, setCurrentUserName] = useState("ゲストユーザー");
  const [posts, setPosts] = useState<Post[]>(dummyPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "creation" | "question">("all");
  const [sortType, setSortType] = useState<"newest" | "evaluation">("newest");

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
          const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

          // 制作物 (postテーブル) と 質問 (questionテーブル) の両方から取得
          const [postsRes, questionsRes] = await Promise.all([
            fetch("/api/posts", { headers }).catch(() => null),
            fetch("/api/questions", { headers }).catch(() => null),
          ]);

          let postsData: any[] = [];
          if (postsRes && postsRes.ok) {
            const data = await postsRes.json();
            const arr = Array.isArray(data) ? data : data.posts || [];
            // postテーブルからの取得データは 'creation'
            postsData = arr.map((p: any) => ({ ...p, type: 'creation' }));
          }

          let questionsData: any[] = [];
          if (questionsRes && questionsRes.ok) {
            const data = await questionsRes.json();
            const arr = Array.isArray(data) ? data : data.questions || [];
            // questionテーブルからの取得データは 'question'
            questionsData = arr.map((q: any) => ({ ...q, type: 'question' }));
          }

          // 両方とも取得に失敗（サーバーエラーなど）した場合はエラーとする
          if ((!postsRes || !postsRes.ok) && (!questionsRes || !questionsRes.ok)) {
            throw new Error(`Failed to fetch posts and questions`);
          }

          setPosts([...postsData, ...questionsData]);
          console.info("[Posts] バックエンドから投稿(post)と質問(question)を取得しました");
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

  // フィルタリング
  const filteredPosts = posts.filter((post) => {
    if (filterType === "all") return true;
    return post.type === filterType;
  });

  // 投稿をソート
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortType === "newest") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() ?? 0 : 0;
      const dateB = b.created_at ? new Date(b.created_at)?.getTime() ?? 0 : 0;
      return dateB - dateA;
    } else {
      // 評価順 (likes が多い順)
      const likesA = a.likes ?? 0;
      const likesB = b.likes ?? 0;
      if (likesA !== likesB) {
        return likesB - likesA;
      }
      // いいねが同じ場合は新しい順
      const dateA = a.created_at ? new Date(a.created_at).getTime() ?? 0 : 0;
      const dateB = b.created_at ? new Date(b.created_at)?.getTime() ?? 0 : 0;
      return dateB - dateA;
    }
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

        {/* フィルタボタン */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${filterType === "all" ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            全部表示
          </button>
          <button
            onClick={() => setFilterType("creation")}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${filterType === "creation" ? "bg-blue-500 text-white border-transparent" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            制作物を表示
          </button>
          <button
            onClick={() => setFilterType("question")}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${filterType === "question" ? "bg-orange-500 text-white border-transparent" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            質問を表示
          </button>
        </div>

        {/* ソートボタン */}
        <div className="flex gap-4 mb-6 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="sortOrder"
              checked={sortType === "newest"}
              onChange={() => setSortType("newest")}
              className="accent-blue-600"
            />
            <span className={sortType === "newest" ? "font-bold text-gray-800" : "text-gray-600"}>新着順</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="sortOrder"
              checked={sortType === "evaluation"}
              onChange={() => setSortType("evaluation")}
              className="accent-blue-600"
            />
            <span className={sortType === "evaluation" ? "font-bold text-gray-800" : "text-gray-600"}>評価順</span>
          </label>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-yellow-100 text-yellow-800 rounded">
            ⚠️ {error} (ダミーデータを表示しています)
          </div>
        )}

        {isLoading && <p className="text-gray-500 text-center py-10">読み込み中...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {sortedPosts.map((post) => (
            <Link href={`/post/${post.id}`} key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* コンテンツエリア */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-3">
                  {/* タグ */}
                  <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${post.type === 'creation' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                    {post.type === 'creation' ? '制作物' : '質問'}
                  </span>
                  {/* 日付と評価 */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    {post.type === 'creation' && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        {post.likes ?? 0}
                      </span>
                    )}
                    {post.created_at && (
                      <span>
                        {new Date(post.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })}
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
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
