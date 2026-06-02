"use client";

import Menu from "@/app/components/aikon";
import { useEffect, useState } from "react";
import Link from "next/link";
import { dummyPosts, Post } from "@/app/data/dummyPosts";
import { isUsingBackend } from "@/lib/api";

function PostCard({ post }: { post: any }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(post.imageUrl || null);

  useEffect(() => {
    if (thumbnailUrl || !isUsingBackend()) return;

    let isMounted = true;
    const fetchImage = async () => {
      try {
        const endpoint = post.itemType === 'creation'
          ? `/post-images/post/${post.id}`
          : `/question-images/question/${post.id}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${endpoint}`);
        if (res.ok) {
          const images = await res.json();
          // sortOrder が 0 の画像をサムネイルとして扱う
          if (isMounted && images && images.length > 0) {
            const thumbImg = images.find((img: any) => img.sortOrder === 0);
            if (thumbImg) {
              setThumbnailUrl(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${thumbImg.imageUrl}`);
            }
          }
        }
      } catch (e) { }
    };
    fetchImage();
    return () => { isMounted = false; };
  }, [post.id, post.itemType, thumbnailUrl]);

  return (
    <Link href={`/post/${post.id}`} className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* サムネイル画像エリア */}
      <div className="w-full aspect-video bg-gray-100 overflow-hidden shrink-0">
        <img
          src={thumbnailUrl || (post.itemType === "creation" ? "/default-creation.jpg" : "/default-question.jpg")}
          alt={post.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      {/* コンテンツエリア */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${((post as any).itemType ?? (post as any).type) === 'creation' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
            {((post as any).itemType ?? (post as any).type) === 'creation' ? '制作物' : '質問'}
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            {((post as any).itemType ?? (post as any).type) === 'creation' && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                {post.score ?? 0}
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
        <div className="flex flex-wrap gap-2 mt-3 max-h-16 overflow-y-auto pr-1">
          {post.tags?.map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full shrink-0"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-600 transition-colors">詳細を見る</span>
          <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </div>
      </div>
    </Link>
  );
}



export default function Page() {
  const [currentUserName, setCurrentUserName] = useState("ゲストユーザー");
  const [posts, setPosts] = useState<Post[]>(dummyPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "creation" | "question">("all");
  const [sortType, setSortType] = useState<"newest" | "evaluation">("newest");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tempSelectedTagNames, setTempSelectedTagNames] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Array<{ id: string; tag: string }>>([]);   // 全タグのリスト
  const [followingList, setFollowingList] = useState<{ id: string; username: string; iconUrl?: string | null }[]>([]);

  // ページネーション用ステート
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 検索条件やフィルターが変わったらページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, sortType, selectedTagIds, keywordSearch, tagSearch]);
  const normalizedKeywordSearch = keywordSearch.trim();
  const keywordTerms = normalizedKeywordSearch
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  useEffect(() => {
    // ユーザー名を取得
    const storedUserName = localStorage.getItem("user_name");
    if (storedUserName) {
      setCurrentUserName(storedUserName);
    }
    
    // フォロー一覧を取得
    const fetchFollowing = async () => {
      try {
        if (isUsingBackend()) {
          const token = localStorage.getItem("access_token");
          const userId = localStorage.getItem("user_id");
          if (token && userId) {
            const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}/follows/following/${userId}`, { headers });
            if (res.ok) {
              const followingData = await res.json();
              setFollowingList(followingData);
            }
          }
        }
      } catch (err) {
        console.error("[Following] 取得エラー:", err);
      }
    };
    fetchFollowing();

    // 投稿データを取得（ソース切り替え）
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isUsingBackend()) {
          // バックエンドから投稿データを取得
          const token = localStorage.getItem("access_token");
          const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

          const shouldUseServerSearch = keywordTerms.length === 1;
          const postsUrl = shouldUseServerSearch
            ? `/api/posts/search?keyword=${encodeURIComponent(normalizedKeywordSearch)}`
            : selectedTagIds.length > 0
              ? `/api/posts?tag_ids=${selectedTagIds.join(",")}`
              : "/api/posts";
          const questionsUrl = shouldUseServerSearch
            ? `/api/questions/search?keyword=${encodeURIComponent(normalizedKeywordSearch)}`
            : selectedTagIds.length > 0
              ? `/api/questions?tag_ids=${selectedTagIds.join(",")}`
              : "/api/questions";

          // デバッグ用ログ
          /*
          console.log("[DEBUG] selectedTagIds:", selectedTagIds);
          console.log("[DEBUG] tagQuery:", tagQuery);
          console.log("[DEBUG] postsUrl:", postsUrl);
          console.log("[DEBUG] questionsUrl:", questionsUrl);
          */

          // フィルター状態に応じてAPI呼び出しを分ける
          let postsRes: Response | null = null;
          let questionsRes: Response | null = null;

          if (filterType === "all") {
            [postsRes, questionsRes] = await Promise.all([
              fetch(postsUrl, { headers }).catch(() => null),
              fetch(questionsUrl, { headers }).catch(() => null),
            ]);
          } else if (filterType === "creation") {
            postsRes = await fetch(postsUrl, { headers }).catch(() => null);
          } else if (filterType === "question") {
            questionsRes = await fetch(questionsUrl, { headers }).catch(() => null);
          }

          // レスポンスのステータスをログで確認
          /*
          console.log("[DEBUG] postsRes status:", postsRes?.status, "ok:", postsRes?.ok);
          console.log("[DEBUG] questionsRes status:", questionsRes?.status, "ok:", questionsRes?.ok);
          */

          // タグの抽出関数（postTags/questionTags から tag.tag を抜き取る）
          const extractTagNames = (items?: any[]) =>
            (items || [])
              .map((item) => item?.tag?.tag)
              .filter((tag): tag is string => typeof tag === "string" && tag.length > 0);

          // API が検索条件に応じて tags を省略・縮約する場合があるため、
          // 表示用は関連データから復元したタグを優先する。
          const resolveDisplayTags = (item: any, relationKeys: string[]) => {
            for (const key of relationKeys) {
              const resolvedTags = extractTagNames(item?.[key]);
              if (resolvedTags.length > 0) {
                return resolvedTags;
              }
            }

            return Array.isArray(item?.tags) ? item.tags : [];
          };

          // postテーブルからの取得データは 'creation'
          let postsData: any[] = [];
          if (postsRes && postsRes.ok) {
            const data = await postsRes.json();
            const arr = Array.isArray(data) ? data : data.posts || [];    // データが配列でない場合は data.posts を試す

            // デバッグ用ログ
            /*
            console.log("[DEBUG] Posts response:", data);
            console.log("[DEBUG] Posts array length:", arr.length);
            */

            // postテーブルからの取得データは 'creation'
            postsData = arr.map((p: any) => ({
              ...p,
              itemType: "creation",
              tags: resolveDisplayTags(p, ["postTags"]),
            }));
          }

          // questionテーブルからの取得データは 'question'
          let questionsData: any[] = [];
          if (questionsRes && questionsRes.ok) {
            const data = await questionsRes.json();
            const arr = Array.isArray(data) ? data : data.questions || [];    // データが配列でない場合は data.questions を試す

            // デバッグ用ログ
            /*
            console.log("[DEBUG] Questions response:", data);
            console.log("[DEBUG] Questions array length:", arr.length);
            */

            // questionテーブルからの取得データは 'question'
            questionsData = arr.map((q: any) => ({
              ...q,
              itemType: "question",
              tags: resolveDisplayTags(q, ["questionTags"]),
            }));
          }

          // 取得エラー判定
          const isPostsFailed = filterType !== "question" && (!postsRes || !postsRes.ok);
          const isQuestionsFailed = filterType !== "creation" && (!questionsRes || !questionsRes.ok);

          if (isPostsFailed && isQuestionsFailed) {
            throw new Error(`Failed to fetch data`);
          }

          setPosts([...postsData, ...questionsData]);
          console.info(`[Posts] バックエンドからデータを取得しました (filter: ${filterType})`);
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
  }, [selectedTagIds, filterType, normalizedKeywordSearch]);

  // 全タグを取得（初回マウント時のみ）
  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        if (isUsingBackend()) {
          const token = localStorage.getItem("access_token");
          const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

          const res = await fetch("/api/tags", { headers });
          if (res.ok) {
            const tags = await res.json();
            const tagArray = Array.isArray(tags) ? tags : tags.tags || [];
            setAllTags(tagArray);
          }
        }
      } catch (err) {
        console.error("[Tags] 取得エラー:", err);
      }
    };

    fetchAllTags();
  }, []);

  // タグの選択・解除関数
  const toggleTag = (tag: string) => {
    setTempSelectedTagNames((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  // タグ検索
  const handleTagSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearch(e.target.value);
  };

  // タグ検索で選択されたタグ名リスト
  const selectedTagNames = selectedTagIds
    .map((id) => allTags.find((tag) => tag.id === id)?.tag)
    .filter((tag): tag is string => !!tag);

  // フィルタリング（種別とキーワードとタグ）
  const filteredPosts = posts.filter((post) => {
    const postType = (post as any).itemType ?? (post as any).type;
    const typeMatch = filterType === "all" || postType === filterType;

    // タグマッチ: 選択されたタグがすべて post に含まれているか (AND条件)
    const tagMatch = selectedTagNames.length === 0 ||
      selectedTagNames.every((tag) => post.tags?.includes(tag));

    const keywordMatch =
      keywordTerms.length === 0 ||
      keywordTerms.every((term) => {
        const keywordLower = term.toLowerCase();
        return (
          post.title.toLowerCase().includes(keywordLower) ||
          post.content.toLowerCase().includes(keywordLower) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(keywordLower))
        );
      });

    return typeMatch && tagMatch && keywordMatch;
  });

  // 投稿をソート
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortType === "newest") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() ?? 0 : 0;
      const dateB = b.created_at ? new Date(b.created_at)?.getTime() ?? 0 : 0;
      return dateB - dateA;
    } else {
      // 評価順 (スコアが高い順)
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      // スコアが同じ場合は新しい順
      const dateA = a.created_at ? new Date(a.created_at).getTime() ?? 0 : 0;
      const dateB = b.created_at ? new Date(b.created_at)?.getTime() ?? 0 : 0;
      return dateB - dateA;
    }
  });

  const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* サイドバー (PCでのみ表示) */}
      <aside className="hidden md:flex flex-col md:w-56 xl:w-64 2xl:w-72 border-r border-gray-100 fixed h-full bg-white z-20 top-0 left-0 pt-20 px-4 xl:px-6 overflow-y-auto pb-24 transition-all">
        <h3 className="text-sm xl:text-base font-bold text-gray-500 mb-4 px-2 uppercase tracking-wider">フォロー中</h3>
        <div className="space-y-2 xl:space-y-3">
          {followingList.map((user) => (
            <Link key={user.id} href={`/profile?userId=${user.id}`} className="flex items-center gap-3 xl:gap-4 px-2 xl:px-3 py-3 xl:py-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
              <div className="w-12 h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 group-hover:border-blue-300 transition-colors flex items-center justify-center">
                {user.iconUrl ? (
                  <img src={`${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${user.iconUrl}`} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 font-bold text-base xl:text-lg 2xl:text-xl">{user.username?.charAt(0)}</span>
                )}
              </div>
              <span className="text-base xl:text-lg 2xl:text-xl font-bold text-gray-700 group-hover:text-blue-600 truncate flex-1 transition-colors">
                {user.username}
              </span>
            </Link>
          ))}
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 md:ml-56 xl:ml-64 2xl:ml-72 w-full transition-all">
        {/* ヘッダー */}
        <div className="fixed top-4 left-4 md:left-[288px] xl:left-[320px] 2xl:left-[352px] z-10 transition-all">
          <span className="font-bold text-gray-700 bg-white/80 px-3 py-1 xl:px-4 xl:py-2 xl:text-lg rounded shadow-sm backdrop-blur-sm border border-gray-100">
            {currentUserName}
          </span>
        </div>
        <Menu />

        {/* 投稿一覧エリア */}
        <div className="mt-16 px-4 pb-20 w-[95%] xl:w-[90%] 2xl:w-[85%] max-w-[1800px] mx-auto">

          {/* キーワード検索エリア */}
          <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="キーワードで検索 (タイトル・本文・タグ)"
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* フィルタボタン */}
        {/* 上部操作エリア */}
        <div className="flex items-center justify-between mb-6">

          {/* 左：タグ検索 */}
          <button
            onClick={() => {
              // 選択中のタグ ID からタグ名に変換
              const tagNames = selectedTagIds
                .map(id => allTags.find(tag => tag.id === id)?.tag)
                .filter((tag): tag is string => !!tag);
              setTempSelectedTagNames(tagNames);
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

            {selectedTagIds.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {selectedTagIds.length}
              </span>
            )}
          </button>

          {/* 右：フィルタボタン */}
          <div className="flex gap-2">

            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${filterType === "all"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              全部表示
            </button>

            <button
              onClick={() => setFilterType("creation")}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${filterType === "creation"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              制作物
            </button>

            <button
              onClick={() => setFilterType("question")}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${filterType === "question"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              質問
            </button>

          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* ページネーションUI */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium text-gray-700"
            >
              前へ
            </button>
            <span className="px-4 py-2 text-gray-700 font-bold">
              {currentPage} <span className="text-gray-400 font-normal mx-1">/</span> {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium text-gray-700"
            >
              次へ
            </button>
          </div>
        )}
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
                {tempSelectedTagNames.map((tag) => (
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
                onClick={() => setTempSelectedTagNames([])}
                className="ml-4 shrink-0 px-3 py-1 bg-gray-200 rounded-full text-sm"
              >
                クリア
              </button>
            </div>

            {/* タグ候補 */}
            <div className="flex gap-2 flex-wrap max-h-64 overflow-y-auto">
              {allTags
                .filter((tag) =>
                  tag.tag.toLowerCase().includes(tagSearch.toLowerCase())
                )
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.tag)}
                    className={`px-3 py-1 rounded-full text-sm transition ${tempSelectedTagNames.includes(tag.tag)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                      }`}
                  >
                    #{tag.tag}
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
                  // 選択したタグ名からタグ ID に変換
                  const tagIds = tempSelectedTagNames
                    .map(name => allTags.find(tag => tag.tag === name)?.id)
                    .filter((id): id is string => !!id);
                  setSelectedTagIds(tagIds);
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
    </div>
  );
}
