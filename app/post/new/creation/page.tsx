"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend } from "@/lib/api";
//import Image from "next/image";

export default function CreateCreationPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  // const [image, setImage] = useState<File | null>(null);
  const presetTags = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Java",
    "Python",
    "C",
    "C++",
    "HTML",
    "CSS",
    "Node.js",
    "Webアプリ",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    const finalTags = selectedTags;

    // if (image) {
    //   formData.append("image", image);
    // }

    if (
      !title ||
      finalTags.length === 0 ||
      !content
    ) {
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
            tags: finalTags,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-10 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          制作物を投稿
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
              placeholder="制作物のタイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* タグ選択 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              タグ
            </label>

            {/* プリセットタグ */}
            <div className="flex flex-wrap gap-2">
              {presetTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedTags.includes(tag)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* 自由入力 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="タグを入力"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() => {
                  const trimmed = customTag.trim();

                  if (
                    trimmed &&
                    !selectedTags.includes(trimmed)
                  ) {
                    setSelectedTags([
                      ...selectedTags,
                      trimmed,
                    ]);
                  }

                  setCustomTag("");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                追加
              </button>
            </div>

            {/* 選択中タグ */}
            {(selectedTags.length > 0 || customTag) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 本文 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="制作物の説明やアピールポイントを入力してください"
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
            <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition">
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
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "投稿中..." : "制作物を投稿"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
