"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Menu from "@/app/components/aikon";

export default function ProfilePage() {
  const [userName, setUserName] = useState("ゲストユーザー");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>("自己紹介がまだ設定されていません。");
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);

  useEffect(() => {
    // ユーザー情報の取得
    const storedName = localStorage.getItem("user_name");
    const storedAvatar = localStorage.getItem("avatar_url") || localStorage.getItem("user_icon");
    const storedBio = localStorage.getItem("user_bio");
    const storedPortfolio = localStorage.getItem("user_portfolio");

    if (storedName) setUserName(storedName);
    if (storedAvatar) setAvatarUrl(storedAvatar);
    if (storedBio) setBio(storedBio);
    if (storedPortfolio) setPortfolioUrl(storedPortfolio);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Menu />
      
      <div className="max-w-2xl mx-auto pt-24 px-4">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link href="/itiran" className="text-blue-500 hover:text-blue-700 flex items-center transition w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            一覧へ戻る
          </Link>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* ヘッダー背景 */}
          <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          
          <div className="px-8 pb-8">
            {/* アイコンと編集ボタン */}
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-bold text-4xl leading-none">{userName.charAt(0)}</span>
                )}
              </div>
              
              {/* プロフィール編集画面への遷移ボタン */}
              <Link href="/profile/edit">
                <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-full shadow-sm hover:bg-gray-50 transition font-medium text-sm">
                  プロフィールを編集
                </button>
              </Link>
            </div>

            {/* 表示名 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
            </div>

            {/* 自己紹介 */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">自己紹介</h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {bio}
                </p>
              </div>
            </div>

            {/* 制作物URL */}
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">制作物のURL</h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {portfolioUrl ? (
                  <a 
                    href={portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-700 hover:underline flex items-center transition break-all text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {portfolioUrl}
                  </a>
                ) : (
                  <p className="text-gray-400 italic text-sm">登録されていません</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
