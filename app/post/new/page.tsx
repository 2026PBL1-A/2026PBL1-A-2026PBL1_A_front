"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend } from "@/lib/api";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !content) {
      alert("すべてのフィールドを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      if (isUsingBackend()) {
        // バックエンドに投稿を送信
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title,
            type: category === "question" ? "question" : "creation",
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `投稿に失敗しました (${response.status})`
          );
        }

        console.info("[Post] バックエンドに投稿を送信しました");
        alert("投稿しました");
      } else {
        // ローカルモード（ダミー処理）
        console.info("[Post] ローカルダミーで投稿を処理しました", {
          title,
          category,
          content,
        });
        alert("投稿しました（ローカル）");
      }

      // 投稿後に一覧へ遷移
      router.push("/itiran");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "投稿に失敗しました";
      console.error("[Post] 投稿エラー:", message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          投稿作成
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="タイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">選択してください</option>
              <option value="creation">制作物</option>
              <option value="question">質問</option>
            </select>
          </div>

          {/* 本文 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="本文を入力"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* 投稿ボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "投稿中..." : "投稿"}
          </button>
        </form>
      </div>
    </div>
  );
}