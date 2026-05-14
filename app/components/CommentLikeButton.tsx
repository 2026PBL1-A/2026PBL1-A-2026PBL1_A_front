"use client";

import { useState } from "react";

type LikeButtonProps = {
  initialCount?: number;
};

export default function CommentLikeButton({
  initialCount = 0,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  const handleLike = () => {
    if (liked) {
      setCount(count - 1);
    } else {
      setCount(count + 1);
    }

    setLiked(!liked);
  };

  return (
    <button
      onClick={handleLike}
      className={`
        flex items-center gap-2 rounded-full border px-4 py-2
        transition-colors duration-200
        ${
          liked
            ? "bg-pink-500 text-white border-pink-500"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }
      `}
    >
      <span className="text-lg">
        {liked ? "♥" : "♡"}
      </span>
      <span className="font-medium">
        {count}
      </span>
    </button>
  );
}
