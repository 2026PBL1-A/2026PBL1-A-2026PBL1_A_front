"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Menu from "@/app/components/aikon";
import { dummyPosts, Post } from "@/app/data/dummyPosts"; // ダミー投稿を読み込む
import Image from "next/image";
import { formatDate } from "@/lib/formatDate";
import { isUsingBackend, apiCall, fetchWithAuth } from "@/lib/api";
import {
  createProfile,
  getAllProfiles,
  getProfile,
  getProfilePosts,
  getProfileQuestions,
} from "@/lib/profileApi";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

function ProfilePostCard({ post }: { post: any }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(post.imageUrl || null);

  useEffect(() => {
    if (thumbnailUrl || !isUsingBackend()) return;

    let isMounted = true;
    const fetchImage = async () => {
      try {
        const endpoint = post.itemType === 'creation'
          ? `/post-images/post/${post.id}`
          : `/question-images/question/${post.id}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${endpoint}`);
        if (res.ok) {
          const images = await res.json();
          // sortOrder が 0 の画像をサムネイルとして扱う
          if (isMounted && images && images.length > 0) {
            const thumbImg = images.find((img: any) => img.sortOrder === 0);
            if (thumbImg) {
              setThumbnailUrl(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${thumbImg.imageUrl}`);
            }
          }
        }
      } catch (e) { }
    };
    fetchImage();
    return () => { isMounted = false; };
  }, [post.id, post.itemType, thumbnailUrl]);

  return (
    <Link href={`/post/${post.id}`} className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* サムネイル画像エリア */}
      <div className="w-full aspect-video bg-gray-100 overflow-hidden shrink-0 relative">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
             <img
               src={post.itemType === "creation" ? "/default-creation.jpg" : "/default-question.jpg"}
               alt={post.title}
               className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
             />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm text-white ${post.itemType === 'creation' ? 'bg-blue-500' : 'bg-orange-500'}`}>
            {post.itemType === 'creation' ? '制作物' : '質問'}
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
        {post.itemType === 'creation' && (
          <div className="flex items-center gap-2 text-pink-500 text-sm font-bold mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{post.score ?? 0}</span>
          </div>
        )}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-500 group-hover:text-blue-600 transition-colors">詳細を見る</span>
          <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </div>
      </div>
    </Link>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [isMyProfile, setIsMyProfile] = useState(true);
  const [userName, setUserName] = useState("ゲストユーザー");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>("自己紹介がまだ設定されていません。");
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("2026/05/01 14:40"); // 仮の更新日時
  const [selectedIcon, setSelectedIcon] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);

  const handleFollowToggle = async () => {
    if (followLoading) return;

    setFollowLoading(true);

    try {
      // backend 使用時
      if (isUsingBackend()) {
        if (!userIdParam) {
          throw new Error("フォロー対象のユーザーIDが不明です");
        }
        // apiCall を使うことで Authorization ヘッダーが自動付与され、401 ならログインへリダイレクトされる
        await apiCall(`/follows/${userIdParam}`, {
          method: "PATCH",
        });
      }

      // UI更新
      setIsFollowing((prev) => !prev);

      setFollowersCount((prev) =>
        isFollowing ? prev - 1 : prev + 1
      );

    } catch (err) {
      console.error(err);
      alert("フォロー処理に失敗しました");
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const storedSkills = localStorage.getItem("user_skills");

    if (storedSkills) {
      setSkills(JSON.parse(storedSkills));
    }
  }, []);

  // タブの状態管理
  const [activeTab, setActiveTab] = useState<"skills" | "creations" | "questions">("skills");

  // ユーザーの投稿一覧（ダミー）
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const currentIsMyProfile = !userIdParam || userIdParam === storedUserId;
    setIsMyProfile(currentIsMyProfile);

    // 自分のプロフィールの場合は localStorage から初期値を設定
    if (currentIsMyProfile) {
      const storedName = localStorage.getItem("user_name");
      if (storedName) setUserName(storedName);

      const storedAvatar = localStorage.getItem("avatar_url") || localStorage.getItem("user_icon");
      if (storedAvatar) {
        setAvatarUrl(storedAvatar);
        setSelectedIcon(storedAvatar);
      }

      if (!isUsingBackend()) {
        const storedBio = localStorage.getItem("user_bio");
        const storedPortfolio = localStorage.getItem("user_portfolio");
        const storedEmail = localStorage.getItem("user_email");
        if (storedBio) setBio(storedBio);
        if (storedPortfolio) setPortfolioUrl(storedPortfolio);
        if (storedEmail) setUserEmail(storedEmail);
      }
    } else {
      // 他人のプロフィールの場合は初期化する
      setUserName("読み込み中...");
      setAvatarUrl(null);
      setSelectedIcon("");
      setBio("");
      setUserEmail("");
      setSkills([]);
    }

    const fetchProfileAndPosts = async () => {
      if (!isUsingBackend()) {
        setUserPosts(dummyPosts);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("access_token");
        const targetUserId = userIdParam || storedUserId;

        let profileResp: Awaited<ReturnType<typeof getProfile>> | null = null;

        // 自分のプロフィールかつ保存済みの profile_id があれば優先して取得
        if (currentIsMyProfile) {
          const storedProfileId = localStorage.getItem("profile_id");
          if (storedProfileId) {
            try {
              profileResp = await getProfile(storedProfileId);
            } catch {
              profileResp = null;
            }
          }
        }

        // profile_id がない（または他人のプロフィール）場合は一覧から探す
        if (!profileResp) {
          const profiles = await getAllProfiles();
          if (targetUserId) {
            const found = profiles.find((p) => p.user && p.user.id === targetUserId) ?? null;
            if (found) profileResp = found;
          } else if (profiles.length === 1 && currentIsMyProfile) {
            profileResp = profiles[0];
          }
        }

        if (!profileResp && token && storedUserId && currentIsMyProfile) {
          const created = await createProfile({ bio: "" });
          profileResp = { profile: created, user: null } as any;
        }

        if (!profileResp) {
          setUserPosts([]);
          setUserName("ユーザーが見つかりません");
          setBio("");
          return;
        }

        // 状態の更新
        if (profileResp.user?.username) {
          setUserName(profileResp.user.username);
        } else {
          setUserName("名無しユーザー");
        }
        
        if (profileResp.user?.email) {
          setUserEmail(profileResp.user.email);
        } else {
          setUserEmail("");
        }

        if (profileResp.profile.bio !== undefined) {
          setBio(profileResp.profile.bio);
        } else {
          setBio("");
        }

        const fetchedAvatar = profileResp.profile?.avatarUrl || (profileResp.profile as any)?.avatar_url;
        if (fetchedAvatar) {
          let avatarToUse = fetchedAvatar;
          if (!avatarToUse.startsWith('http')) {
            avatarToUse = `${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${avatarToUse}`;
          }
          setAvatarUrl(avatarToUse);
          setSelectedIcon(avatarToUse);
        } else {
          setAvatarUrl(null);
          setSelectedIcon("");
        }

        const parsedSkills = (profileResp.profile.profileTags || [])
          .map((profileTag) => profileTag.tag?.tag)
          .filter((skill): skill is string => Boolean(skill && skill.trim()));
        setSkills(parsedSkills);

        // 自分のプロフィールの場合は localStorage に保存
        if (currentIsMyProfile) {
          localStorage.setItem("profile_id", profileResp.profile.id);
          if (profileResp.user?.id) localStorage.setItem("user_id", profileResp.user.id);
          if (profileResp.user?.username) localStorage.setItem("user_name", profileResp.user.username);
          if (profileResp.user?.email) localStorage.setItem("user_email", profileResp.user.email);
          if (profileResp.profile.bio !== undefined) localStorage.setItem("user_bio", profileResp.profile.bio);
          if (profileResp.profile.avatarUrl) localStorage.setItem("avatar_url", profileResp.profile.avatarUrl);
          if (parsedSkills.length > 0) {
            localStorage.setItem("user_skills", JSON.stringify(parsedSkills));
          } else {
            localStorage.removeItem("user_skills");
          }
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
            itemType: "creation" as const,
            created_at: post.created_at,
          })),
          ...profileQuestions.map((q) => ({
            id: q.id,
            title: q.title,
            content: q.content,
            itemType: "question" as const,
            created_at: q.created_at,
          })),
        ];

        setUserPosts(mappedPosts);

        // フォロワー情報を取得してフォロー状態を初期化する
        if (targetUserId && !currentIsMyProfile) {
          try {
            const followers = await fetchWithAuth(`/follows/followers/${targetUserId}`);
            if (followers.ok) {
              const followersList = await followers.json();
              setFollowersCount(followersList.length);
              // 自分がフォロワー一覧にいるかチェック
              const myUserId = localStorage.getItem("user_id");
              if (myUserId) {
                const amFollowing = followersList.some(
                  (f: { id: string }) => f.id === myUserId
                );
                setIsFollowing(amFollowing);
              }
            }
          } catch {
            // フォロワー取得に失敗してもプロフィール表示は続行
          }
        }

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

  const creationPosts = userPosts.filter(post => post.itemType === 'creation');
  const questionPosts = userPosts.filter(post => post.itemType === 'question');
  const storedUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  const handleId = (storedUserId || userName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "id").slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Menu />

      <div className="max-w-2xl mx-auto pt-16 px-4">
        {/* 戻るボタン（Xの矢印ボタン風） */}
        <div className="mb-4">
          <Link href="/list" className="text-gray-900 bg-white/80 backdrop-blur hover:bg-gray-200 inline-flex items-center justify-center w-10 h-10 rounded-full transition shadow-sm border border-gray-200">
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
                  <img
                    src={selectedIcon}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-bold text-5xl leading-none">
                    {userName.charAt(0)}
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-3">
              {isMyProfile ? (
                <Link href="/profile/edit">
                  <button className="bg-white text-gray-800 border border-gray-300 font-bold px-5 py-2 rounded-full hover:bg-gray-100 transition text-sm">
                    プロフィールを編集
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`font-bold px-5 py-2 rounded-full transition text-sm shadow-sm ${
                    isFollowing
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {followLoading
                    ? "処理中..."
                    : isFollowing
                    ? "フォロー中"
                    : "フォローする"}
                </button>
              )}
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

            {/* フォロワー情報 */}
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-bold text-gray-900">
                  {followersCount}
                </span>{" "}
                フォロワー
              </div>

              <div>
                <span className="font-bold text-gray-900">
                  {creationPosts.length + questionPosts.length}
                </span>{" "}
                投稿
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
                <div className="flex flex-wrap gap-2 mt-4">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "creations" && (
              <div className="p-6">
                {creationPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creationPosts.map((post) => (
                      <ProfilePostCard key={post.id} post={post} />
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
                      <ProfilePostCard key={post.id} post={post} />
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
    </div>
  );
}
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-20 text-center font-bold">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
