"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ title, category, content });
    alert("投稿しました（ダミー）");
    router.push("/itiran"); // 投稿後に一覧へ遷移
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
              <option value="post">投稿</option>
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
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            投稿
          </button>
        </form>
      </div>
    </div>
  );
}