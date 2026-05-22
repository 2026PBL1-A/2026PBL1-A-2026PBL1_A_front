"use client";

import { useEffect, useState } from "react";

type Props = {
  targetUserId: string;
};

export default function FollowButton({ targetUserId }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("following_users");

    if (stored) {
      const ids: string[] = JSON.parse(stored);
      setIsFollowing(ids.includes(targetUserId));
    }
  }, [targetUserId]);

  const handleToggle = async () => {
    setLoading(true);

    try {
      const stored = localStorage.getItem("following_users");
      let ids: string[] = stored ? JSON.parse(stored) : [];

      if (isFollowing) {
        ids = ids.filter((id) => id !== targetUserId);
      } else {
        ids.push(targetUserId);
      }

      localStorage.setItem("following_users", JSON.stringify(ids));

      setIsFollowing(!isFollowing);

      const token = localStorage.getItem("access_token");
      if (token) {
        const response = await fetch(`/api/follows/${targetUserId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          console.error("フォロー処理に失敗しました");
        }
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
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