"use client";

import { useState, useEffect } from "react";
import { isUsingBackend } from "@/lib/api";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
}

export default function LikeButton({ postId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const [hasLiked, setHasLiked] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`liked_${postId}`) === "true";
    }

    return false;
  });

  const handleLike = async () => {
    setIsLoading(true);

    try {
      if (isUsingBackend()) {
        const token = localStorage.getItem("access_token");

        // トークンがない場合は API を呼ばない
        if (!token) {
          alert("ログインが必要です");
          return;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // バックエンドとの通信（仕様が決まるまでのダミーエンドポイント）
        // ※バックエンドの仕様に合わせて変更してください（例: POST /api/posts/{id}/like）

        console.log("postId:", postId);
        console.log("token:", localStorage.getItem("access_token"));

        const response = await fetch(`/api/post-scores/${postId}`, {
          method: "POST",
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();

          console.error("status:", response.status);
          console.error("body:", errorText);

          if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("user_name");

            alert("ログインの有効期限が切れています。再度ログインしてください。");

            // 必要ならログイン画面へ遷移
            // window.location.href = "/login";
          }

          throw new Error("評価の更新に失敗しました");
        }

        const data = await response.json();

        console.log("response data:", data);

        // サーバーから返ってきた最新値を反映
        setHasLiked(data.liked);
        setLikes(data.score);

        localStorage.setItem(
          `liked_${postId}`,
          String(data.liked)
        );
      } else {
        const newHasLiked = !hasLiked;
        const newLikes = newHasLiked ? likes + 1 : likes - 1;

        setHasLiked(newHasLiked);
        setLikes(Math.max(0, newLikes));

        localStorage.setItem(
          `liked_${postId}`,
          String(newHasLiked)
        );

        // ローカルダミー環境の場合はコンソール出力のみ
        console.info(`[LikeButton] ${newHasLiked ? "評価しました" : "評価を取り消しました"} (Post ID: ${postId})`);
      }
    } catch (error) {
      console.error("[LikeButton] エラー:", error);
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
