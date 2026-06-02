"use client";

import { useEffect, useState } from "react";
import { apiCall, fetchWithAuth, isUsingBackend } from "@/lib/api";

type Props = {
  targetUserId: string;
};

export default function FollowButton({ targetUserId }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // マウント時に自身のユーザーIDを取得
  useEffect(() => {
    let currentUserId = localStorage.getItem("user_id");
    
    // access_token からの取得をフォールバックとして試みる
    if (!currentUserId) {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const id = payload.sub || payload.id || payload.userId;
          if (id) {
            currentUserId = String(id);
            localStorage.setItem("user_id", currentUserId);
          }
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }
    }
    
    setMyUserId(currentUserId);
    setIsInitialized(true);
  }, []);

  // マウント時にバックエンドからフォロー状態を取得する
  useEffect(() => {
    if (!isInitialized) return;

    if (!isUsingBackend()) {
      // バックエンド未使用時は localStorage から読み込む（フォールバック）
      const stored = localStorage.getItem("following_users");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        setIsFollowing(ids.includes(targetUserId));
      }
      return;
    }

    if (!myUserId || myUserId === targetUserId) return;

    let isMounted = true;

    const checkFollowStatus = async () => {
      try {
        // 対象ユーザーのフォロワー一覧を取得し、自分が含まれているかチェック
        const res = await fetchWithAuth(`/follows/followers/${targetUserId}`);
        if (res.ok && isMounted) {
          const followers: { id: string }[] = await res.json();
          setIsFollowing(followers.some((f) => String(f.id) === myUserId));
        }
      } catch {
        // 取得失敗時は初期値（false）のまま
      }
    };

    checkFollowStatus();

    return () => {
      isMounted = false;
    };
  }, [targetUserId, myUserId, isInitialized]);

  const handleToggle = async () => {
    setLoading(true);

    try {
      // apiCall を使うことで Authorization ヘッダーが自動付与される
      await apiCall(`/follows/${targetUserId}`, {
        method: "PATCH",
      });

      // API 成功後に UI を更新
      setIsFollowing((prev) => !prev);
    } catch (error) {
      console.error("フォロー処理に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  // ログインしていない場合、初期化が終わっていない場合、または自身の投稿の場合はボタンを表示しない
  if (!isInitialized) return null; // 初期ロード中はちらつき防止のため非表示
  if (myUserId === targetUserId) return null; // 自分自身には表示しない

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-6 py-2.5 xl:px-8 xl:py-3 2xl:px-10 2xl:py-4 rounded-full text-base xl:text-lg 2xl:text-xl font-bold transition-all shadow-sm hover:shadow-md ${
        isFollowing
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {loading
        ? "処理中..."
        : isFollowing
        ? "フォロー中"
        : "フォロー"}
    </button>
  );
}