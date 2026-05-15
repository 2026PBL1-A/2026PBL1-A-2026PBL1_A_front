"use client";

import { useState, useEffect } from "react";
import { isUsingBackend, fetchWithAuth } from "@/lib/api";

type ScoreButtonProps = {
  initialCount?: number;
  answerId?: string | number;
};

// JWTトークンからユーザーIDを取り出す関数
const getCurrentUserId = () => {
  let currentUserId = "1"; // デフォルト
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        currentUserId = payload.sub || payload.id || payload.userId || "1";
      } catch (e) {
        console.error("Token decode error:", e);
      }
    }
  }
  return currentUserId;
};

export default function AnswersScoreButton({
  initialCount = 0,
  answerId,
}: ScoreButtonProps) {
  const [isScored, setIsScored] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      if (isUsingBackend() && answerId) {
        try {
          const response = await fetchWithAuth(`/answer/score/${answerId}`);
          if (response.ok) {
            const text = await response.text();
            if (text) {
              const data = JSON.parse(text);
              if (typeof data === 'number') {
                setCount(data);
              } else if (Array.isArray(data)) {
                setCount(data.length);
              } else if (data && typeof data === 'object') {
                // バックエンドが findOneBy を使っている場合、オブジェクトが返る
                setCount(1);
                
                // 現在のユーザーが評価済みかどうかの判定（もしデータに userId が含まれていれば）
                const currentUserId = getCurrentUserId();
                if (data.userId && String(data.userId) === String(currentUserId)) {
                  setIsScored(true);
                }
              }
            }
          }
        } catch (e) {
          console.error("[AnswersScoreButton] Error fetching score:", e);
        }
      }
    }
    fetchScore();
  }, [answerId]);

  const handleScore = async () => {
    const newIsScored = !isScored;
    const newCount = newIsScored ? count + 1 : count - 1;

    // オプティミスティックUIアップデート
    setIsScored(newIsScored);
    setCount(newCount < 0 ? 0 : newCount);
    setIsLoading(true);

    try {
      if (isUsingBackend() && answerId) {
        const currentUserId = getCurrentUserId();
        // バックエンドとの通信
        // POST /answer/score/:answerId/:userId (トグル処理)
        const response = await fetchWithAuth(`/answer/score/${answerId}/${currentUserId}`, {
          method: "POST", // バックエンドの実装がPOSTでトグル処理を行うようになっているため
        });

        if (!response.ok) {
          throw new Error("評価の更新に失敗しました");
        }
      } else {
        console.info(`[AnswersScoreButton] ${newIsScored ? "評価しました" : "評価を取り消しました"} (Answer ID: ${answerId})`);
      }
    } catch (error) {
      console.error("[AnswersScoreButton] エラー:", error);
      // エラー時は元の状態に戻す
      setIsScored(!newIsScored);
      setCount(count);
      alert("評価の更新に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleScore}
      disabled={isLoading}
      className={`group flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm border ${
        isScored
          ? "bg-pink-50 border-pink-200 text-pink-600"
          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-pink-200 hover:text-pink-500"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <svg
        className={`w-6 h-6 transition-transform group-hover:scale-110 ${
          isScored ? "fill-current" : "fill-none stroke-current stroke-2"
        }`}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="text-lg">{count}</span>
    </button>
  );
}
