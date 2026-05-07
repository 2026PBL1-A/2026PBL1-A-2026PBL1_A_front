"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend } from "@/lib/api";
import Image from "next/image";

export default function CreateQuestionPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(""); // 自由入力のカテゴリ
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("type", "question"); // 質問固定

    // if (image) {
    //   formData.append("image", image);
    // }

    if (!title || !category || !content) {
      alert("すべてのフィールドを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      if (isUsingBackend()) {
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title,
            type: "question",
            category,
            content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `投稿に失敗しました (${response.status})`);
        }
        alert("投稿しました");
      } else {
        alert("投稿しました（ローカル）");
      }
      router.push("/itiran");
    } catch (error) {
      const message = error instanceof Error ? error.message : "投稿に失敗しました";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          質問を投稿
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="質問のタイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 自由入力カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ (例: Javaなどの言語)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Java, React, エラー解決など"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          {/* 本文 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="質問の内容を詳細に入力してください"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* 画像 (後で実装するためコメントアウト) */}
          {/*
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像
            </label>
            <label className="inline-block px-4 py-2 bg-orange-500 text-white rounded cursor-pointer hover:bg-orange-600 transition">
              📷 画像を選択
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    // setImage(e.target.files[0]);
                  }
                }}
              />
            </label>
            {/* image && (
              <Image src={URL.createObjectURL(image)} alt="preview" width={400} height={200} className="object-contain max-h-full max-w-full" />
            ) *\/}
          </div>
          */}

          {/* 投稿・キャンセルボタン */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.push("/itiran")}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "投稿中..." : "質問を投稿"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
