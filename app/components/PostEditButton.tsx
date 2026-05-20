"use client";
import { useState, useEffect } from "react";
import { isUsingBackend, fetchWithAuth } from "@/lib/api";
import { getAllTags, createTag } from "@/lib/profileApi";
import { useRouter } from "next/navigation";

export default function PostEditButton({ post }: { post: any }) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // モーダル用ステート
  const [isOpen, setIsOpen] = useState(false);
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

        const endpoint = post.itemType === "question" ? `/questions/${post.id}` : `/posts/${post.id}`;
        const response = await fetchWithAuth(endpoint, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "編集に失敗しました");
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-blue-100"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        編集
      </button>

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

            <div className="mb-6">
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
    </>
  );
}
