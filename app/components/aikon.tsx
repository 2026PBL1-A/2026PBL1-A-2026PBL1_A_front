"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Menu() {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  useEffect(() => {
    // 他の機能で保存されたプロフィールアイコンがある場合は取得する
    const storedAvatar = localStorage.getItem("avatar_url") || localStorage.getItem("user_icon");
    const storedName = localStorage.getItem("user_name");
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
    }
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* アイコン */}
      <button 
        onClick={() => setOpen(!open)}
        className="w-10 h-10 md:w-12 md:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 shadow-sm hover:bg-gray-300 transition focus:outline-none"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : userName ? (
          <span className="text-gray-600 font-bold text-lg md:text-xl xl:text-2xl 2xl:text-3xl leading-none">{userName.charAt(0)}</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>

      {/* メニュー */}
      {open && (
        <div className="absolute top-16 right-0 bg-white border rounded shadow-lg flex flex-col w-40 overflow-hidden">
          {/* プロフィールへのリンク */}
          {pathname !== "/profile" && (
            <Link 
              href="/profile" 
              className="px-4 py-3 text-gray-700 hover:bg-gray-100 text-center border-b transition"
              onClick={() => setOpen(false)}
            >
              プロフィール
            </Link>
          )}
          
          {/* ログアウトボタン（一番下に配置） */}
          <button 
            onClick={() => {
              setOpen(false);
              setShowModal(true);
            }} 
            className="px-4 py-3 text-red-500 hover:bg-red-50 text-center transition font-medium"
          >
            ログアウト
          </button>
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded shadow w-80">
            <p className="mb-4 text-center text-gray-800">
              本当にログアウトしますか？
            </p>

            <div className="flex justify-end gap-2">
              {/* キャンセル */}
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                キャンセル
              </button>

              {/* ログアウト */}
              <button
                onClick={() => {
                  logout();
                  setShowModal(false);
                  setAvatarUrl(null);
                  setUserName(null);
                  router.push("/login");
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}