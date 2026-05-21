"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend } from "@/lib/api";
import { getAllTags, createTag} from "@/lib/profileApi";
import Image from "next/image";

export default function CreateCreationPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: string; tag: string }[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [headerImage, setHeaderImage] = useState<File | null>(null);
  const [topImage, setTopImage] = useState<File | null>(null);
  const [bottomImage, setBottomImage] = useState<File | null>(null);
  const [tempThumbnailImage, setTempThumbnailImage] = useState<File | null>(null);
  const [tempHeaderImage, setTempHeaderImage] = useState<File | null>(null);
  const [tempTopImage, setTempTopImage] = useState<File | null>(null);
  const [tempBottomImage, setTempBottomImage] = useState<File | null>(null);
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

  const skillCandidates = isUsingBackend()
    ? availableTags.map((tag) => tag.tag)
    : presetTags;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTags = selectedTags;

    // if (image) {
    //   formData.append("image", image);
    // }

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
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `投稿に失敗しました (${response.status})`
          );
        }

        // 作成された投稿情報を取得
        const createdPost = await response.json();

        // 投稿IDを取得
        const postId = createdPost.id;

        const images = [
          { file: thumbnailImage, order: 0 },
          { file: headerImage, order: 1 },
          { file: topImage, order: 2 },
          { file: bottomImage, order: 3 },
        ];

        let uploadFailed = false;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000";

        for (const img of images) {
          if (!img.file) continue;

          const formData = new FormData();
          formData.append("file", img.file);

          formData.append("Order", String(img.order));

          try {
            const uploadResponse = await fetch(
              `${backendUrl}/post-images/upload/${postId}`,
              {
                method: "POST",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
              }
            );

            if (!uploadResponse.ok) {
              uploadFailed = true;
              break;
            }
          } catch (err) {
            console.error("画像アップロードエラー:", err);
            uploadFailed = true;
            break;
          }
        }

        if (uploadFailed) {
          // 画像アップロードに失敗した場合は投稿を削除（ロールバック）
          await fetch(`/api/posts/${postId}`, {
            method: "DELETE",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }).catch(console.error); // 削除エラーはログだけ残す

          throw new Error("画像のアップロードに失敗したため、投稿を中止しました");
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

  const displayHeaderImage = headerImage || thumbnailImage;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-8">
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

          {/* 画像 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              画像
            </label>

            {/* 開くボタン */}
            <button
              type="button"
              onClick={() => {
                setTempThumbnailImage(thumbnailImage);
                setTempHeaderImage(headerImage);
                setTempTopImage(topImage);
                setTempBottomImage(bottomImage);
                setIsImageModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              📷 画像を選択
            </button>

            <div className="grid grid-cols-2 gap-4 mt-4">

              {/* サムネイル */}
              {thumbnailImage && (
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-600">
                    サムネイル
                  </p>

                  <Image
                    src={URL.createObjectURL(thumbnailImage)}
                    alt="thumbnail"
                    width={400}
                    height={200}
                    className="rounded-xl border w-full h-auto object-contain"
                  />
                </div>
              )}

              {/* ヘッダー */}
              {displayHeaderImage && (
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-600">
                    ヘッダー
                  </p>

                  <Image
                    src={URL.createObjectURL(displayHeaderImage)}
                    alt="header"
                    width={400}
                    height={200}
                    className="rounded-xl border w-full h-auto object-contain"
                  />
                </div>
              )}

              {/* 本文上部 */}
              {topImage && (
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-600">
                    本文上部
                  </p>

                  <Image
                    src={URL.createObjectURL(topImage)}
                    alt="top"
                    width={400}
                    height={200}
                    className="rounded-xl border w-full h-auto object-contain"
                  />
                </div>
              )}

              {/* 本文下部 */}
              {bottomImage && (
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-600">
                    本文下部
                  </p>

                  <Image
                    src={URL.createObjectURL(bottomImage)}
                    alt="bottom"
                    width={400}
                    height={200}
                    className="rounded-xl border w-full h-auto object-contain"
                  />
                </div>
              )}

            </div>
          </div>

          {/* 画像選択モーダル */}
            {isImageModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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

                  <div className="space-y-4">

                  {/* サムネイル */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      サムネイル
                    </p>

                    <div className="border rounded-xl p-4 bg-gray-50">
                      <p className="text-sm font-semibold mb-3 text-gray-700">
                        サムネイル
                      </p>

                      <label className="flex items-center justify-center w-full px-4 py-3 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition shadow-sm">
                        📷 サムネイル画像を選択

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setTempThumbnailImage(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {tempThumbnailImage && (
                        <p className="mt-2 text-sm text-green-600">
                          ✅ {tempThumbnailImage.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ヘッダー */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      ヘッダー
                    </p>

                    <div className="border rounded-xl p-4 bg-gray-50">
                      <p className="text-sm font-semibold mb-3 text-gray-700">
                        ヘッダー
                      </p>

                      <label className="flex items-center justify-center w-full px-4 py-3 bg-purple-500 text-white rounded-xl cursor-pointer hover:bg-purple-600 transition shadow-sm">
                        🖼 ヘッダー画像を選択

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setTempHeaderImage(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {tempHeaderImage && (
                        <p className="mt-2 text-sm text-green-600">
                          ✅ {tempHeaderImage.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 本文上部 */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      本文上部
                    </p>

                    <div className="border rounded-xl p-4 bg-gray-50">
                      <p className="text-sm font-semibold mb-3 text-gray-700">
                        本文上部
                      </p>

                      <label className="flex items-center justify-center w-full px-4 py-3 bg-orange-500 text-white rounded-xl cursor-pointer hover:bg-orange-600 transition shadow-sm">
                        ⬆ 本文上部画像を選択

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setTempTopImage(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {tempTopImage && (
                        <p className="mt-2 text-sm text-green-600">
                          ✅ {tempTopImage.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 本文下部 */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      本文下部
                    </p>

                    <div className="border rounded-xl p-4 bg-gray-50">
                      <p className="text-sm font-semibold mb-3 text-gray-700">
                        本文下部
                      </p>

                      <label className="flex items-center justify-center w-full px-4 py-3 bg-green-500 text-white rounded-xl cursor-pointer hover:bg-green-600 transition shadow-sm">
                        ⬇ 本文下部画像を選択

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setTempBottomImage(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {tempBottomImage && (
                        <p className="mt-2 text-sm text-green-600">
                          ✅ {tempBottomImage.name}
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                  

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
                          setThumbnailImage(tempThumbnailImage);
                          setHeaderImage(tempHeaderImage);
                          setTopImage(tempTopImage);
                          setBottomImage(tempBottomImage);

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

            <div className="mt-10 bg-white rounded-2xl shadow border">

            <div className="p-6">
              

              {/* ヘッダー */}
              {displayHeaderImage && (
                <Image
                  src={URL.createObjectURL(displayHeaderImage)}
                  alt="header"
                  width={400}
                  height={200}
                  className="rounded-xl border w-full max-h-[150px] object-cover mb-6"
                />
              )}

              <h1 className="text-3xl font-bold mb-4 break-words">
                {title || "タイトルプレビュー"}
              </h1>

              {/* 本文上部 */}
              {topImage && (
                <Image
                  src={URL.createObjectURL(topImage)}
                  alt="top"
                  width={400}
                  height={200}
                  className="rounded-xl border w-full max-h-[350px] object-contain"
                />
              )}

              <p className="text-gray-700 whitespace-pre-wrap break-words leading-8">
                {content || "本文プレビュー"}
              </p>

              {/* 本文下部 */}
              {bottomImage && (
                <Image
                  src={URL.createObjectURL(bottomImage)}
                  alt="bottom"
                  width={400}
                  height={200}
                  className="rounded-xl border w-full max-h-[350px] object-contain"
                />
              )}

            </div>
          </div>

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
