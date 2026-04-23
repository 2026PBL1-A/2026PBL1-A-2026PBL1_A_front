"use client";
import Menu from "@/app/components/aikon";
import Link from "@/app/components/Link";
import { useState } from "react";

export default function Page() {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  return (
    <div>
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="mt-10 space-y-6">
        
        {/* 投稿カード */}
        <div className="border rounded shadow p-4">
          
          {/* 見出し */}
          <h2 className="text-lg font-bold mb-2">
            タイトルが入ります
          </h2>

          {/* 画像枠 */}
          <div className="w-full h-40 bg-gray-200 mb-2 flex items-center justify-center">
            画像エリア
          </div>

          {/* 本文 */}
          <p>
            ここに投稿の内容が入ります
          </p>
{/*移動予定*/}
          {/* コメントボタン */}
            <button onClick={() => setShowComment(!showComment)} className="bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded shadow hover:underline">
              💬 コメントする
            </button>

            {/* 入力欄（条件付き表示） */}
              {showComment && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="コメントを書く"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="border p-2 w-full mb-2"
                  />
                    <button className="bg-blue-500 text-white px-4 py-1 rounded">
                      投稿
                    </button>
              </div>
            )}
{/*移動予定*/}
        </div>
      </div>
        {/* 投稿ボタン */}
        <Link
          href="/post/new"
          className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow hover:no-underline"
        >
          投稿
        </Link>
    </div>
  );
}