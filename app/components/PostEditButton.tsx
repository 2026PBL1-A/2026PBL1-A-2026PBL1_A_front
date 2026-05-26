"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { isUsingBackend, fetchWithAuth } from "@/lib/api";
import { getAllTags, createTag } from "@/lib/profileApi";
import { useRouter } from "next/navigation";

// 画像スロットの定義
interface ImageSlot {
  order: number;
  label: string;
  color: string;       // ボタンの色クラス
  hoverColor: string;  // ホバー時の色クラス
}

const IMAGE_SLOTS: ImageSlot[] = [
  { order: 0, label: "サムネイル", color: "bg-blue-500", hoverColor: "hover:bg-blue-600" },
  { order: 1, label: "ヘッダー", color: "bg-purple-500", hoverColor: "hover:bg-purple-600" },
  { order: 2, label: "本文上部", color: "bg-orange-500", hoverColor: "hover:bg-orange-600" },
  { order: 3, label: "本文下部", color: "bg-green-500", hoverColor: "hover:bg-green-600" },
];

// 既存画像の情報
interface ExistingImage {
  id: string;          // 画像レコードのID (PATCH/DELETE で使う)
  imageUrl: string;    // 画像の URL
  sortOrder: number;
}

export default function PostEditButton({ post }: { post: any }) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // モーダル用ステート
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [editTitle, setEditTitle] = useState(post.title || "");
  
  // 初期タグの取得（配列形式を想定）
  const initialTags = Array.isArray(post.tags) 
    ? post.tags.map((t: any) => typeof t === 'string' ? t : t.tag).filter(Boolean)
    : post.tag ? [post.tag] : [];
  
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<{ id: string; tag: string }[]>([]);
  const [customTag, setCustomTag] = useState("");
  
  const [editContent, setEditContent] = useState(post.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 画像編集用ステート ---
  // 既存画像の情報 (order をキーとした Map)
  const [existingImages, setExistingImages] = useState<Map<number, ExistingImage>>(new Map());
  // 新しく選択されたファイル (order をキーとした Map)
  const [newFiles, setNewFiles] = useState<Map<number, File>>(new Map());
  // 削除対象の画像ID (order をキーとした Set)
  const [deletedOrders, setDeletedOrders] = useState<Set<number>>(new Set());
  // 画像セクションの開閉
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(false);

  const presetTags = [
    "React", "Next.js", "TypeScript", "JavaScript", "Java", "Python",
    "C", "C++", "HTML", "CSS", "Node.js", "Webアプリ",
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

  // 既存画像を post.postImages から抽出
  const initialExistingImages = useMemo(() => {
    const map = new Map<number, ExistingImage>();
    if (post.postImages && Array.isArray(post.postImages)) {
      for (const img of post.postImages) {
        const order = img.sortOrder ?? img.sort_order ?? 0;
        map.set(order, {
          id: img.id,
          imageUrl: img.imageUrl || img.image_url,
          sortOrder: order,
        });
      }
    }
    return map;
  }, [post.postImages]);

  useEffect(() => {
    // ログインユーザーのIDを取得
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const id = payload.sub || payload.id || payload.userId;
          if (id) setCurrentUserId(String(id));
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }
    }

    const loadTags = async () => {
      if (!isUsingBackend()) return;
      try {
        const tags = await getAllTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error("タグ読み込みエラー:", error);
      }
    };
    loadTags();
  }, []);

  // モーダルを開いたときに既存画像ステートを初期化する
  useEffect(() => {
    if (isOpen) {
      setExistingImages(new Map(initialExistingImages));
      setNewFiles(new Map());
      setDeletedOrders(new Set());
      setIsImageSectionOpen(false);
    }
  }, [isOpen, initialExistingImages]);

  // 自分の投稿かどうか判定
  const isMyPost = () => {
    if (!currentUserId) return false;
    // バックエンドから返ってくる投稿者IDをプロパティに合わせてチェック
    const postUserId = post.userId?.id ?? post.userId ?? post.userid?.id ?? post.userid ?? post.user_id?.id ?? post.user_id;
    
    // バックエンドがない場合のダミーデータ判定
    if (!isUsingBackend() && postUserId === undefined) {
      // ダミーデータの場合はひとまずすべて編集可能にするか、特定のIDのみにするか。今回は適当でよい。
      return true;
    }
    
    return String(postUserId) === String(currentUserId);
  };

  if (!isMyPost()) {
    return null; // 自分の投稿でなければ何も表示しない
  }

  // --- 画像操作ヘルパー ---

  // スロットのプレビューURLを取得
  const getPreviewUrl = (order: number): string | null => {
    // 削除済みなら表示しない
    if (deletedOrders.has(order)) return null;
    // 新しいファイルが選択されていたらそのプレビュー
    const newFile = newFiles.get(order);
    if (newFile) return URL.createObjectURL(newFile);
    // 既存画像があればそのURL
    const existing = existingImages.get(order);
    if (existing) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000";
      // 絶対URLならそのまま、相対URLならバックエンドURLを付与
      return existing.imageUrl.startsWith("http")
        ? existing.imageUrl
        : `${backendUrl}${existing.imageUrl}`;
    }
    return null;
  };

  // ファイル選択ハンドラ
  const handleFileSelect = (order: number, file: File) => {
    setNewFiles((prev) => {
      const next = new Map(prev);
      next.set(order, file);
      return next;
    });
    // 削除フラグが立っていたら解除する（新しいファイルで上書き）
    setDeletedOrders((prev) => {
      const next = new Set(prev);
      next.delete(order);
      return next;
    });
  };

  // 画像削除ハンドラ
  const handleImageDelete = (order: number) => {
    // 新しいファイルがあればそれを外す
    setNewFiles((prev) => {
      const next = new Map(prev);
      next.delete(order);
      return next;
    });
    // 既存画像があれば削除対象に追加
    if (existingImages.has(order)) {
      setDeletedOrders((prev) => {
        const next = new Set(prev);
        next.add(order);
        return next;
      });
    }
  };

  // スロットに画像があるか（削除されていない既存 or 新ファイル）
  const hasImage = (order: number): boolean => {
    if (deletedOrders.has(order)) return !!newFiles.has(order);
    return existingImages.has(order) || newFiles.has(order);
  };

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isUsingBackend()) {
        // タグID解決フロー
        const uniqueSelectedTags = Array.from(
          new Set(selectedTags.map((tag) => tag.trim()).filter(Boolean))
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

        // タグを再取得して最新のタグリストを得る
        const refreshedTags = await getAllTags();
        setAvailableTags(refreshedTags);

        const resolvedTagIds = Array.from(
          new Set([
            ...uniqueSelectedTags
              .map((tag) => refreshedTags.find((t) => t.tag === tag)?.id)
              .filter((tagId): tagId is string => Boolean(tagId)),
          ])
        );

        const payload = {
          title: editTitle,
          content: editContent,
          ...(resolvedTagIds.length > 0 ? { tag_ids: resolvedTagIds } : {}),
        };

        // テキスト・タグの更新を試みる（APIが未実装の場合でも画像処理は続行する）
        const endpoint = post.itemType === "question" ? `/questions/${post.id}` : `/posts/${post.id}`;
        try {
          const response = await fetchWithAuth(endpoint, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn("テキスト更新に失敗しましたが、画像処理は続行します:", errorData.message);
          }
        } catch (err) {
          console.warn("テキスト更新APIの呼び出しに失敗しましたが、画像処理は続行します:", err);
        }

        // --- 画像の処理 ---
        const token = localStorage.getItem("access_token");
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000";
        const isQuestion = post.itemType === "question";
        const imageBaseEndpoint = isQuestion ? "question-images" : "post-images";

        // 1) 削除処理
        for (const order of deletedOrders) {
          const existing = existingImages.get(order);
          if (existing && !newFiles.has(order)) {
            // 削除のみ（差し替えでない場合）
            try {
              await fetch(`${backendUrl}/${imageBaseEndpoint}/${existing.id}`, {
                method: "DELETE",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });
            } catch (err) {
              console.error(`画像削除エラー (order ${order}):`, err);
            }
          }
        }

        // 2) 差し替え・新規追加処理
        for (const [order, file] of newFiles) {
          const existing = existingImages.get(order);
          const isDeleted = deletedOrders.has(order);

          const formData = new FormData();
          formData.append("file", file);
          formData.append("Order", String(order));

          if (existing && !isDeleted) {
            // 既存画像がある → PATCH で差し替え
            try {
              await fetch(`${backendUrl}/${imageBaseEndpoint}/upload/${existing.id}`, {
                method: "PATCH",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
              });
            } catch (err) {
              console.error(`画像差し替えエラー (order ${order}):`, err);
            }
          } else {
            // 既存なし or 削除済み → POST で新規追加
            if (existing && isDeleted) {
              // 先に削除
              try {
                await fetch(`${backendUrl}/${imageBaseEndpoint}/${existing.id}`, {
                  method: "DELETE",
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                });
              } catch (err) {
                console.error(`画像削除エラー (order ${order}):`, err);
              }
            }
            try {
              await fetch(`${backendUrl}/${imageBaseEndpoint}/upload/${post.id}`, {
                method: "POST",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
              });
            } catch (err) {
              console.error(`画像追加エラー (order ${order}):`, err);
            }
          }
        }
      }

      // 成功したらモーダルを閉じてページをリロード（または遷移）して最新情報を取得
      setIsOpen(false);
      alert("編集が完了しました");
      router.refresh();
      
    } catch (err: any) {
      console.error("[PostEditButton] 編集エラー:", err);
      setError(err.message || "編集に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (isUsingBackend()) {
        const endpoint = post.itemType === "question" ? `/questions/${post.id}` : `/posts/${post.id}`;
        const response = await fetchWithAuth(endpoint, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "削除に失敗しました");
        }
      }

      setIsDeleteModalOpen(false);
      alert("削除が完了しました");
      router.push("/list");
      router.refresh();
      
    } catch (err: any) {
      console.error("[PostEditButton] 削除エラー:", err);
      setDeleteError(err.message || "削除に失敗しました。");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 animate-in fade-in zoom-in duration-100">
            <button
              onClick={() => {
                setIsOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              編集
            </button>
            <button
              onClick={() => {
                setIsDeleteModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              削除
            </button>
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">{post.itemType === 'creation' ? '制作物' : '質問'}の編集</h3>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm font-medium flex items-center bg-red-50 p-3 rounded-xl border border-red-100">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* タグ選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {skillCandidates.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      selectedTags.includes(tag)
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="タグを入力"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = customTag.trim();
                    if (trimmed && !selectedTags.includes(trimmed)) {
                      setSelectedTags([...selectedTags, trimmed]);
                    }
                    setCustomTag("");
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  追加
                </button>
              </div>

              {(selectedTags.length > 0 || customTag) && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition font-medium"
                    >
                      #{tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* 画像編集セクション */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setIsImageSectionOpen(!isImageSectionOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition mb-3"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isImageSectionOpen ? "rotate-90" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                📷 画像の編集
                {(newFiles.size > 0 || deletedOrders.size > 0) && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    変更あり
                  </span>
                )}
              </button>

              {isImageSectionOpen && (
                <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                  {IMAGE_SLOTS.map((slot) => {
                    const previewUrl = getPreviewUrl(slot.order);
                    const imagePresent = hasImage(slot.order);
                    const hasNewFile = newFiles.has(slot.order);
                    const isDeletedExisting = deletedOrders.has(slot.order) && !hasNewFile;

                    return (
                      <div key={slot.order} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-700">{slot.label}</p>
                          <div className="flex gap-2">
                            {/* ファイル選択ボタン */}
                            <label className={`text-xs px-3 py-1.5 ${slot.color} text-white rounded-lg cursor-pointer ${slot.hoverColor} transition shadow-sm`}>
                              {imagePresent ? "差し替え" : "追加"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleFileSelect(slot.order, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                            {/* 削除ボタン（画像がある場合のみ） */}
                            {imagePresent && (
                              <button
                                type="button"
                                onClick={() => handleImageDelete(slot.order)}
                                className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm"
                              >
                                削除
                              </button>
                            )}
                          </div>
                        </div>

                        {/* プレビュー */}
                        {previewUrl ? (
                          <div className="relative">
                            <img
                              src={previewUrl}
                              alt={slot.label}
                              className="w-full max-h-[120px] object-contain rounded-lg border border-gray-100"
                            />
                            {hasNewFile && (
                              <span className="absolute top-1 left-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                新しい画像
                              </span>
                            )}
                          </div>
                        ) : isDeletedExisting ? (
                          <p className="text-xs text-red-500 italic py-2">🗑 削除予定</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic py-2">画像なし</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={isSubmitting || !editTitle.trim() || !editContent.trim()}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    保存中...
                  </>
                ) : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">投稿を削除しますか？</h3>
            <p className="text-sm text-gray-600 mb-6">
              この操作は取り消せません。本当にこの投稿を削除してもよろしいですか？
            </p>

            {deleteError && (
              <div className="mb-4 text-red-500 text-sm font-medium p-3 bg-red-50 rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center disabled:opacity-50"
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
