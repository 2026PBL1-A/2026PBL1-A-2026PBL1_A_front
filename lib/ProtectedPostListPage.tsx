"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Menu from "@/app/components/aikon";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { apiCall } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  type: "creation" | "question";
  content: string;
  imageUrl?: string;
}

export default function ProtectedPostListPage() {
  const router = useRouter();

  // 認証状態の参照とログアウト処理を Context から受け取る
  const { isLoggedIn, logout } = useAuth();

  // API 取得結果と表示状態
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ログインしていない場合はログインページへ
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 認証付きで投稿一覧を取得
    // apiCall は Authorization ヘッダーの付与を内部で実施する
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const data = await apiCall<Post[]>("/posts");
        setPosts(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "データ取得に失敗しました";
        // 開発時の調査をしやすくするため詳細をコンソールへ出す
        console.error("Posts fetch error:", message);
        setError(message);
        // エラーログなどの処理
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [isLoggedIn, router]);

  const handleLogout = () => {
    // 保存済み token を削除して、ログイン画面へ戻す
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <Menu />
      
      {/* ログアウトボタン */}
      <div className="flex justify-end px-4 py-2">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          ログアウト
        </button>
      </div>

      {/* 投稿一覧エリア */}
      <div className="mt-10 space-y-6 px-4 pb-20 max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center">投稿がまだありません</p>
        ) : (
          posts.map((post) => (
            <Link href={`/post/${post.id}`} key={post.id} className="block border rounded shadow p-4 hover:bg-gray-50 transition">
              {/* 見出し */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    post.type === "creation"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {post.type === "creation" ? "制作物" : "質問"}
                </span>
                <h2 className="text-lg font-bold">{post.title}</h2>
              </div>
              {/* 画像枠 */}
              <div className="w-full h-40 bg-gray-200 mb-2 flex items-center justify-center text-gray-500 rounded">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  "画像エリア"
                )}
              </div>

              {/* 本文 */}
              <p className="line-clamp-2 text-gray-700">{post.content}</p>
            </Link>
          ))
        )}
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
