"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend } from "@/lib/api";
import { getAllTags, createTag } from "@/lib/profileApi";
import Image from "next/image";

export default function CreateQuestionPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: string; tag: string }[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [tempImage, setTempImage] = useState<File | null>(null);
  const presetTags = [
    "React",
    "Next.js",
    "TypeScript",
    "Java",
    "Python",
    "Spring",
    "Node.js",
    "HTML",
    "CSS",
    "Tailwind",
  ];

  const skillCandidates = isUsingBackend()
    ? availableTags.map((tag) => tag.tag)
    : presetTags;

  useEffect(() => {
    // バックエンド使用モードならタグも読み込む
    const loadTags = async () => {
      // バックエンドを使用しないモードならタグの読み込みはスキップする
      if (!isUsingBackend()) {
        return;
      }

      try {
        // バックエンドからタグを取得して選択肢をセットする
        const tags = await getAllTags();
        setAvailableTags(tags);
      } catch (error) {
        // タグの取得に失敗しても画面自体は表示できるようにエラーをキャッチする
        console.error("タグ読み込みエラー:", error);
      }
    };

    // タグを読み込む（バックエンド使用モードの場合）
    loadTags();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTags = selectedTags;

    if (!title || !content) {
      alert("タイトルと本文を入力してください");
      return;
    }

    setIsLoading(true);
    try {
      if (isUsingBackend()) {
        // タグID解決フロー（プロフィール編集と同じロジック）
        const uniqueSelectedTags = Array.from(
          new Set(finalTags.map((tag) => tag.trim()).filter(Boolean))
        );
        const existingTagNames = new Set(availableTags.map((tag) => tag.tag));
        const missingTags = uniqueSelectedTags.filter(
          (tag) => !existingTagNames.has(tag)
        );

        // バックエンドに存在しないタグは先に作成しておく
        if (missingTags.length > 0) {
          await Promise.all(
            missingTags.map((tag) => createTag({ tag }))
          );
        }

        // タグを再取得して最新のタグリストを得る（新規作成したタグのIDを取得するため）
        const refreshedTags = await getAllTags();
        setAvailableTags(refreshedTags);

        const resolvedTagIds = Array.from(
          new Set([
            ...selectedTagIds,
            ...uniqueSelectedTags
              .map((tag) => refreshedTags.find((t) => t.tag === tag)?.id)
              .filter((tagId): tagId is string => Boolean(tagId)),
          ])
        );

        const payload = {
          title,
          content,
          ...(resolvedTagIds.length > 0 ? { tag_ids: resolvedTagIds } : {}),
        };

        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `投稿に失敗しました (${response.status})`);
        }
        alert("投稿しました");
      } else {
        alert("投稿しました（ローカル）");
      }
      router.push("/list");
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

          {/* タグ選択 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              タグ
            </label>

            {/* タグ候補 */}
            <div className="flex flex-wrap gap-2">
              {skillCandidates.map((tag) => (
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
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
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
              className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="質問の内容を詳細に入力してください"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* 画像 */}
           <div className="space-y-3">
             <label className="block text-sm font-medium text-gray-700">
               画像
             </label>
 
             {/* 開くボタン */}
             <button
               type="button"
               onClick={() => {
                 setTempImage(image);
                 setIsImageModalOpen(true);
               }}
               className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
             >
               📷 画像を選択
             </button>
 
             {/* 選択済み画像 */}
             {image && (
               <div className="mt-3">
                 <Image
                   src={URL.createObjectURL(image)}
                   alt="preview"
                   width={400}
                   height={200}
                   className="rounded-xl object-contain max-h-[300px] w-full border"
                 />
               </div>
             )}
           </div>

            {/* 画像選択モーダル */}
            {isImageModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
                  
                  {/* ヘッダー */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">
                      画像を選択
                    </h2>

                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(false)}
                      className="text-gray-500 hover:text-black text-xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* ファイル選択 */}
                  <label className="block">
                    <div className="px-4 py-3 bg-gray-100 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition">
                      画像をアップロード
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setTempImage(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {/* プレビュー */}
                  {tempImage && (
                    <div className="mt-4">
                      <Image
                        src={URL.createObjectURL(tempImage)}
                        alt="preview"
                        width={400}
                        height={200}
                        className="rounded-xl object-contain max-h-[300px] w-full border"
                      />
                    </div>
                  )}

                  {/* ボタン */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      キャンセル
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImage(tempImage);
                        setIsImageModalOpen(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      決定
                    </button>
                  </div>
                </div>
              </div>
            )}         

          {/* 投稿・キャンセルボタン */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.push("/list")}
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
