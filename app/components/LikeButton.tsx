"use client";

import { useState } from "react";
import { isUsingBackend } from "@/lib/api";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
}

export default function LikeButton({ postId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    // すでに「いいね」している場合は解除、していない場合は追加
    const newHasLiked = !hasLiked;
    const newLikes = newHasLiked ? likes + 1 : likes - 1;

    // UIを即時反映（オプティミスティックUI）
    setHasLiked(newHasLiked);
    setLikes(newLikes);
    setIsLoading(true);

    try {
      if (isUsingBackend()) {
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // バックエンドとの通信（仕様が決まるまでのダミーエンドポイント）
        // ※バックエンドの仕様に合わせて変更してください（例: POST /api/posts/{id}/like）
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: newHasLiked ? "POST" : "DELETE",
          headers,
        });

        if (!response.ok) {
          throw new Error("評価の更新に失敗しました");
        }
      } else {
        // ローカルダミー環境の場合はコンソール出力のみ
        console.info(`[LikeButton] ${newHasLiked ? "評価しました" : "評価を取り消しました"} (Post ID: ${postId})`);
      }
    } catch (error) {
      console.error("[LikeButton] エラー:", error);
      // エラー時は元の状態に戻す
      setHasLiked(!newHasLiked);
      setLikes(likes);
      alert("評価の更新に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`group flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm border ${hasLiked
          ? "bg-pink-50 border-pink-200 text-pink-600"
          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-pink-200 hover:text-pink-500"
        }`}
    >
      <svg
        className={`w-6 h-6 transition-transform group-hover:scale-110 ${hasLiked ? "fill-current" : "fill-none stroke-current stroke-2"
          }`}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="text-lg">{likes}</span>
    </button>
  );
}
