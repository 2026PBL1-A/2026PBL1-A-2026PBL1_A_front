"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/aikon";

export default function ProfileEditPage() {
  const router = useRouter();
  
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 既存のユーザー情報を読み込む
    const storedName = localStorage.getItem("user_name");
    const storedAvatar = localStorage.getItem("avatar_url") || localStorage.getItem("user_icon");
    const storedBio = localStorage.getItem("user_bio");
    const storedPortfolio = localStorage.getItem("user_portfolio");

    if (storedName) setUserName(storedName);
    if (storedAvatar) setAvatarUrl(storedAvatar);
    if (storedBio) setBio(storedBio);
    if (storedPortfolio) setPortfolioUrl(storedPortfolio);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // localStorage に保存（本来はバックエンドAPIへ送信）
      localStorage.setItem("user_name", userName);
      if (avatarUrl) {
        localStorage.setItem("avatar_url", avatarUrl);
      }
      localStorage.setItem("user_bio", bio);
      localStorage.setItem("user_portfolio", portfolioUrl);

      alert("プロフィールを更新しました");
      router.push("/profile");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("プロフィールの保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Menu />
      
      <div className="max-w-2xl mx-auto pt-24 px-4">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link href="/profile" className="text-gray-500 hover:text-gray-700 flex items-center transition w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            キャンセルして戻る
          </Link>
        </div>

        {/* 編集フォームカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8">
          <h1 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">
            プロフィール編集
          </h1>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* アイコン画像 */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0 mb-4 relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 font-bold text-3xl">?</span>
                )}
                
                {/* オーバーレイ */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageChange}
                />
              </div>
              <p className="text-xs text-gray-500">アイコンをクリックして画像を変更</p>
            </div>

            {/* 表示名 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                表示名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                placeholder="あなたの名前を入力"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            {/* 自己紹介 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                placeholder="自己紹介やスキルなどを入力してください"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* 制作物URL */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                制作物のURL (ポートフォリオ、GitHubなど)
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                placeholder="https://example.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            {/* ボタングループ */}
            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving || !userName.trim()}
                className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? "保存中..." : "変更を保存する"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
