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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);

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

  // タグの選択・解除関数
      const toggleTag = (tag: string) => {
        setTempSelectedTags((prev) =>
          prev.includes(tag)
            ? prev.filter((t) => t !== tag)
            : [...prev, tag]
        );
      };

  // タグ検索
  const handleTagSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearch(e.target.value);
  };

  // フィルタリング
  const filteredPosts = posts.filter((post) => {
  const typeMatch =
    filterType === "all" ||
    post.type === filterType;

  const tagMatch =
  selectedTags.length === 0 ||
  selectedTags.every((tag) =>
    post.tags.includes(tag)
  );

  return typeMatch && tagMatch;
});

  // 投稿を新しい順にソート
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() ?? 0 : 0;
    const dateB = b.created_at ? new Date(b.created_at)?.getTime() ?? 0 : 0;
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

        {/* フィルタボタン */}
        {/* 上部操作エリア */}
          <div className="flex items-center justify-between mb-6">

            {/* 左：タグ検索 */}
            <button
              onClick={() => {
                setTempSelectedTags(selectedTags);
                setIsTagModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
            >
              {/* 虫眼鏡 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <span className="font-medium text-gray-700 whitespace-nowrap">
                タグ検索
              </span>

              {selectedTags.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* 右：フィルタボタン */}
            <div className="flex gap-2">
              
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${
                  filterType === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                全部表示
              </button>

              <button
                onClick={() => setFilterType("creation")}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${
                  filterType === "creation"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                制作物
              </button>

              <button
                onClick={() => setFilterType("question")}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${
                  filterType === "question"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                質問
              </button>

            </div>
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
                  {/* 日付 */}
                  {post.created_at && (
                    <div className="text-xs text-gray-500 font-medium">
                      {new Date(post.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="line-clamp-3 text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                  {post.content}
                </p>
                {/* タグ一覧 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

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

      {/* タグモーダル*/}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
            
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                タグ検索
              </h2>

            </div>

            {/* 検索input */}
            <input
              type="text"
              placeholder="タグを検索"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />

            {/* 選択中タグ */}
            <div className="flex items-center justify-between mb-4">
              
              <div className="flex gap-2 flex-wrap">
                {tempSelectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                  >
                    #{tag}
                    <span className="text-xs">×</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setTempSelectedTags([])}
                className="ml-4 shrink-0 px-3 py-1 bg-gray-200 rounded-full text-sm"
              >
                クリア
              </button>
            </div>

            {/* タグ候補 */}
                <div className="flex gap-2 flex-wrap max-h-64 overflow-y-auto">
                  {Object.entries(
                    posts.flatMap((post) => post.tags).reduce(
                      (acc, tag) => {
                        acc[tag] = (acc[tag] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  )
                    .sort((a, b) => b[1] - a[1])
                    .filter(([tag]) =>
                      tag.toLowerCase().includes(tagSearch.toLowerCase())
                    )
                    .slice(0, 10)
                    .map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          tempSelectedTags.includes(tag)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        #{tag} ({count})
                      </button>
                    ))}
                </div>

                {/* ボタンエリア */}
                <div className="flex justify-end gap-3">
                  
                  <button
                    onClick={() => setIsTagModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    キャンセル
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTags(tempSelectedTags);
                      setIsTagModalOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    決定
                  </button>
                </div>
              </div>
            </div>
      )}
      </div>
  );
}
