"use client";
import { useState } from "react";

export default function CommentSection({ postType }: { postType: "creation" | "question" }) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  // 属性が質問の場合は「回答」、それ以外は「コメント」
  const label = postType === "question" ? "回答" : "コメント";

  return (
    <div className="mt-8 border-t pt-4">
      <button
        onClick={() => setShowComment(!showComment)}
        className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition"
      >
        💬 {label}する
      </button>

      {/* 入力欄（条件付き表示） */}
      {showComment && (
        <div className="mt-4 bg-gray-50 p-4 rounded border">
          <input
            type="text"
            placeholder={`${label}を書く`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border p-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            送信
          </button>
        </div>
      )}
    </div>
  );
}
