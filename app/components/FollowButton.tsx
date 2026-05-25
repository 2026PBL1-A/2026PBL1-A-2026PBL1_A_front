"use client";

import { useEffect, useState } from "react";
import { apiCall, fetchWithAuth, isUsingBackend } from "@/lib/api";

type Props = {
  targetUserId: string;
};

export default function FollowButton({ targetUserId }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // マウント時にバックエンドからフォロー状態を取得する
  useEffect(() => {
    if (!isUsingBackend()) {
      // バックエンド未使用時は localStorage から読み込む（フォールバック）
      const stored = localStorage.getItem("following_users");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        setIsFollowing(ids.includes(targetUserId));
      }
      return;
    }

    const myUserId = localStorage.getItem("user_id");
    if (!myUserId || myUserId === targetUserId) return;

    let isMounted = true;

    const checkFollowStatus = async () => {
      try {
        // 対象ユーザーのフォロワー一覧を取得し、自分が含まれているかチェック
        const res = await fetchWithAuth(`/follows/followers/${targetUserId}`);
        if (res.ok && isMounted) {
          const followers: { id: string }[] = await res.json();
          setIsFollowing(followers.some((f) => f.id === myUserId));
        }
      } catch {
        // 取得失敗時は初期値（false）のまま
      }
    };

    checkFollowStatus();

    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

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

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-full text-sm font-bold transition ${
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