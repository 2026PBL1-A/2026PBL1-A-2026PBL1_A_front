"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Menu() {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <div className="fixed top-4 right-4">
      {/* アイコン */}
      <button onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* メニュー */}
      {open && (
        <div>
      {/* ログアウトボタン */}
      <button onClick={() => setShowModal(true)} className="absolute top-10 right-0 bg-blue-500 text-white shadow p-4 flex gap-4 min-w-[120px] flex items-center justify-center  hover:underline">
        ログアウト
      </button>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          
          <div className="bg-white p-6 rounded shadow w-80">
            <p className="mb-4 text-center">
              本当にログアウトしますか？
            </p>

            <div className="flex justify-end gap-2">
              
              {/* キャンセル */}
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-200 rounded"
              >
                キャンセル
              </button>

              {/* ログアウト */}
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                ログアウト
              </button>

            </div>
          </div>

        </div>
      )}
    </div>
      )}
    </div>
  );
}