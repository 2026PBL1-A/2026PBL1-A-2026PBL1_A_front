"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Menu from "@/app/components/aikon";
import { dummyPosts, Post } from "@/app/data/dummyPosts"; // ダミー投稿を読み込む
import Image from "next/image";
import { formatDate } from "@/lib/formatDate";
import { isUsingBackend } from "@/lib/api";
import {
  createProfile,
  getAllProfiles,
  getProfile,
  getProfilePosts,
  getProfileQuestions,
} from "@/lib/profileApi";

// API から取得した日時を日本時間の見やすい形式に変換するユーティリティ関数
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const parseTimestamp = (value?: string) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts;
};

export default function ProfilePage() {
  const [userName, setUserName] = useState("ゲストユーザー");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>("自己紹介がまだ設定されていません。");
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("2026/05/01 14:40"); // 仮の更新日時
  const [selectedIcon, setSelectedIcon] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [skills, setSkills] = useState<string[]>(["JavaScript", "React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // タブの状態管理
  const [activeTab, setActiveTab] = useState<"skills" | "creations" | "questions">("skills");

  // ユーザーの投稿一覧（ダミー）
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  useEffect(() => {
    // 表示名は認証由来の値として backend 有効時でも使う
    const storedName = localStorage.getItem("user_name");
    if (storedName) {
      setUserName(storedName);
    }

    // アイコンだけはローカル優先で扱う（バックエンド使用時も localStorage を参照）
    // 後日バックエンドと連携予定: アイコンをサーバー保存に移行する予定のため、
    // 当面はローカルに保持して画面で即時反映する実装にしています。
    const storedAvatar = localStorage.getItem("avatar_url") || localStorage.getItem("user_icon");
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
      setSelectedIcon(storedAvatar);
    }

    // バックエンド未連携時はその他の値を localStorage から読み込む
    if (!isUsingBackend()) {
      const storedBio = localStorage.getItem("user_bio");
      const storedPortfolio = localStorage.getItem("user_portfolio");
      const storedEmail = localStorage.getItem("user_email");
      
      if (storedBio) setBio(storedBio);
      if (storedPortfolio) setPortfolioUrl(storedPortfolio);
      if (storedEmail) setUserEmail(storedEmail);
    }
    
    const fetchProfileAndPosts = async () => {
      if (!isUsingBackend()) {
        // バックエンド未使用時はこれまで通りローカルのダミーデータを利用
        setUserPosts(dummyPosts);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // API からプロフィールと投稿を取得するロジック
        const token = localStorage.getItem("access_token");
        const storedUserId = localStorage.getItem("user_id");
        const storedProfileId = localStorage.getItem("profile_id");

        // ID でプロフィールを取得（レスポンスは { profile, user } の形）
        let profileResp: Awaited<ReturnType<typeof getProfile>> | null = null;

        // まず保存済み profile_id があればそれを優先して詳細を引く
        if (storedProfileId) {
          try {
            profileResp = await getProfile(storedProfileId);
          } catch {
            profileResp = null;
          }
        }

        // profile_id がない場合は一覧から user_id に一致するプロフィールを探す
        if (!profileResp) {
          const profiles = await getAllProfiles();
          if (storedUserId) {
            const found = profiles.find((p) => p.user && p.user.id === storedUserId) ?? null;
            if (found) profileResp = found;
          } else if (profiles.length === 1) {
            // user_id 未保存時の最小フォールバック（単一プロフィール環境）
            profileResp = profiles[0];
          }
        }

        if (!profileResp && token && storedUserId) {
          // バックエンド連携時は localStorage から読まないため、空初期値で作成
          const created = await createProfile({ bio: "", tag: "" });
          profileResp = { profile: created, user: null } as any;
        }

        if (!profileResp) {
          setUserPosts([]);
          return;
        }

        // 次回以降の取得を安定させるため、判明した ID を保存し直す
        localStorage.setItem("profile_id", profileResp.profile.id);
        if (profileResp.user?.id) {
          localStorage.setItem("user_id", profileResp.user.id);
        }

        // ユーザー情報が含まれていれば localStorage に反映（メールも含む）
        if (profileResp.user?.username) {
          localStorage.setItem("user_name", profileResp.user.username);
        }
        if (profileResp.user?.email) {
          setUserEmail(profileResp.user.email);
          localStorage.setItem("user_email", profileResp.user.email);
        }

        if (profileResp.profile.bio && profileResp.profile.bio.trim()) {
          setBio(profileResp.profile.bio);
          localStorage.setItem("user_bio", profileResp.profile.bio);
        }

        const parsedSkills = (profileResp.profile.tag || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (parsedSkills.length > 0) {
          setSkills(parsedSkills);
        }

        // プロフィール所有者の投稿と質問を並行取得する
        const profileIdToUse = profileResp.profile.id;
        const [profilePosts, profileQuestions] = await Promise.all([
          getProfilePosts(profileIdToUse).catch(() => []),
          getProfileQuestions(profileIdToUse).catch(() => []),
        ]);

        // 投稿と質問を type フィールドをつけて統合する
        const mappedPosts: Post[] = [
          ...profilePosts.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            type: "creation" as const,
            created_at: post.created_at,
          })),
          ...profileQuestions.map((q) => ({
            id: q.id,
            title: q.title,
            content: q.content,
            type: "question" as const,
            created_at: q.created_at,
          })),
        ];

        setUserPosts(mappedPosts);

        // 投稿と質問の両方から有効な日時だけで最新を計算する
        const allPosts = [...profilePosts, ...profileQuestions];
        if (allPosts.length > 0) {
          const latestTs = allPosts.reduce((maxTs, post) => {
            const updatedTs = parseTimestamp(post.updated_at);
            const createdTs = parseTimestamp(post.created_at);
            return Math.max(maxTs, updatedTs, createdTs);
          }, Number.NEGATIVE_INFINITY);

          if (Number.isFinite(latestTs)) {
            setLastUpdated(formatDateTime(new Date(latestTs).toISOString()));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "プロフィール情報の取得に失敗しました";
        setError(message);
        setUserPosts(dummyPosts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, []);

  const creationPosts = userPosts.filter(post => post.type === 'creation');
  const questionPosts = userPosts.filter(post => post.type === 'question');
  const storedUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  const handleId = (storedUserId || userName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "id").slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Menu />

      <div className="max-w-2xl mx-auto pt-16 px-4">
        {/* 戻るボタン（Xの矢印ボタン風） */}
        <div className="mb-4">
          <Link href="/itiran" className="text-gray-900 bg-white/80 backdrop-blur hover:bg-gray-200 inline-flex items-center justify-center w-10 h-10 rounded-full transition shadow-sm border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>

        {/* プロフィールメインエリア（X風） */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* ヘッダー背景画像 */}
          <div className="h-40 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
          </div>

          <div className="px-6 pb-4">
            {/* アイコンと編集ボタン */}
            <div className="relative flex justify-between items-start mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 -mt-16 z-10 shadow-sm bg-white">
                {selectedIcon ? (
                  <Image
                    src={selectedIcon}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-bold text-5xl leading-none">
                    {userName.charAt(0)}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <Link href="/profile/edit">
                  <button className="bg-white text-gray-800 border border-gray-300 font-bold px-5 py-2 rounded-full hover:bg-gray-100 transition text-sm">
                    プロフィールを編集
                  </button>
                </Link>
              </div>
            </div>

            {/* 基本情報（表示名・IDなど） */}
            <div className="mb-4">
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{userName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-500 text-sm">{userEmail || `user_${userName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "id"}`}</p>
                <div className="flex items-center text-gray-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>更新: {lastUpdated}</span>
                </div>
              </div>
            </div>

            {/* 自己紹介文 */}
            <div className="mb-4">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">
                {bio}
              </p>
            </div>

          </div>

          {/* タブナビゲーション */}
          <div className="flex border-b border-gray-200 px-2">
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex-1 text-center py-4 text-[15px] font-bold hover:bg-gray-100 transition relative ${activeTab === "skills" ? "text-gray-900" : "text-gray-500"}`}
            >
              習得技術
              {activeTab === "skills" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("creations")}
              className={`flex-1 text-center py-4 text-[15px] font-bold hover:bg-gray-100 transition relative ${activeTab === "creations" ? "text-gray-900" : "text-gray-500"}`}
            >
              制作物
              {activeTab === "creations" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`flex-1 text-center py-4 text-[15px] font-bold hover:bg-gray-100 transition relative ${activeTab === "questions" ? "text-gray-900" : "text-gray-500"}`}
            >
              質問
              {activeTab === "questions" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-500 rounded-full"></div>
              )}
            </button>
          </div>

          {/* タブコンテンツエリア */}
          <div className="bg-gray-50 min-h-[400px]">
            {error && (
              <div className="mx-6 mt-6 p-3 bg-yellow-100 text-yellow-800 rounded">
                ⚠️ {error} (ダミーデータを表示しています)
              </div>
            )}

            {isLoading && (
              <div className="px-6 pt-6 text-gray-500 font-medium">読み込み中...</div>
            )}

            {activeTab === "skills" && (
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">習得技術スタック</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-bold shadow-sm">
                      {skill}
                    </span>
                  ))}
                  <span className="px-4 py-1.5 border border-dashed border-gray-400 text-gray-500 rounded-full text-sm font-bold cursor-pointer hover:bg-gray-200 transition">
                    + 追加する
                  </span>
                </div>
              </div>
            )}

            {activeTab === "creations" && (
              <div className="p-6">
                {creationPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creationPosts.map((post) => (
                      <Link href={`/post/${post.id}`} key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                        {/* 画像枠 */}
                        <div className="w-full aspect-video bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden relative">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                              <span className="text-xs font-medium text-gray-400">No Image</span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 text-xs font-bold rounded-full shadow-sm bg-blue-500 text-white">
                              制作物
                            </span>
                          </div>
                        </div>

                        {/* コンテンツエリア */}
                        <div className="p-5 flex flex-col flex-grow">
                          {post.created_at && (
                            <div className="text-xs text-gray-500 mb-2 font-medium">
                              {formatDate(post.created_at)}
                            </div>
                          )}
                          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h2>
                          <p className="line-clamp-3 text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                            {post.content}
                          </p>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-600 transition-colors">詳細を見る</span>
                            <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-100">
                    まだ制作物の投稿がありません。
                  </div>
                )}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="p-6">
                {questionPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {questionPosts.map((post) => (
                      <Link href={`/post/${post.id}`} key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                        {/* 画像枠 */}
                        <div className="w-full aspect-video bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden relative">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                              <span className="text-xs font-medium text-gray-400">No Image</span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 text-xs font-bold rounded-full shadow-sm bg-orange-500 text-white">
                              質問
                            </span>
                          </div>
                        </div>

                        {/* コンテンツエリア */}
                        <div className="p-5 flex flex-col flex-grow">
                          {post.created_at && (
                            <div className="text-xs text-gray-500 mb-2 font-medium">
                              {formatDate(post.created_at)}
                            </div>
                          )}
                          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h2>
                          <p className="line-clamp-3 text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                            {post.content}
                          </p>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-600 transition-colors">詳細を見る</span>
                            <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-100">
                    まだ質問の投稿がありません。
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
