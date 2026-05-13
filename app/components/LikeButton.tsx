"use client";

import { useState } from "react";
import { isUsingBackend } from "@/lib/api";

interface LikeButtonProps {
  postId: string;
  initialScore: number;
}

export default function LikeButton({ postId, initialScore }: LikeButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    // すでに「いいね」している場合は解除、していない場合は追加
    const newHasLiked = !hasLiked;
    const newScore = newHasLiked ? score + 1 : score - 1;

    // UIを即時反映（オプティミスティックUI）
    setHasLiked(newHasLiked);
    setScore(newScore);
    setIsLoading(true);

    try {
      if (isUsingBackend()) {
        const token = localStorage.getItem("access_token");
        if (!token) {
          alert("評価するにはログインが必要です。");
          setHasLiked(!newHasLiked);
          setScore(score);
          setIsLoading(false);
          return;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };

        // バックエンドの post-scores エンドポイント（トグル）を呼び出す
        const response = await fetch(`/api/post-scores/${postId}`, {
          method: "POST",
          headers,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          console.error("[LikeButton] APIエラー詳細:", {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          });
          throw new Error(
            errorBody.message || `評価の更新に失敗しました (${response.status})`
          );
        }
      } else {
        // ローカルダミー環境の場合はコンソール出力のみ
        console.info(`[LikeButton] ${newHasLiked ? "評価しました" : "評価を取り消しました"} (Post ID: ${postId})`);
      }
    } catch (error) {
      console.error("[LikeButton] エラー:", error);
      // エラー時は元の状態に戻す
      setHasLiked(!newHasLiked);
      setScore(score);
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
      <span className="text-lg">{score}</span>
    </button>
  );
}
