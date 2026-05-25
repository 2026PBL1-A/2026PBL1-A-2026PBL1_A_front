import { dummyPosts } from "@/app/data/dummyPosts";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnswersSection from "@/app/components/AnswersSection";
import ScoreButton from "@/app/components/ScoreButton";
import PostEditButton from "@/app/components/PostEditButton";
import { isUsingBackend } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import FollowButton from "@/app/components/FollowButton";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  let post = null;

  if (isUsingBackend()) {
    // バックエンドから投稿を取得
    try {
      let response = await fetch(
        `${process.env.BACKEND_API_URL || "http://localhost:5000"}/posts/${resolvedParams.id}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        post = { ...data, itemType: "creation" };
        console.info(`[Post Detail] バックエンドから投稿 ID ${resolvedParams.id} を取得`);
      } else {
        // posts になければ questions を探す
        const qResponse = await fetch(
          `${process.env.BACKEND_API_URL || "http://localhost:5000"}/questions/${resolvedParams.id}`,
          { cache: "no-store" }
        );
        if (qResponse.ok) {
          const data = await qResponse.json();
          post = { ...data, itemType: "question" };
          console.info(`[Post Detail] バックエンドから質問 ID ${resolvedParams.id} を取得`);
        }
      }
    } catch (error) {
      console.error(`[Post Detail] バックエンド取得エラー (ID: ${resolvedParams.id}):`, error);
      // フォールバック: ダミーデータ
    }

    if (post) {
      try {
        const endpoint = post.itemType === 'creation'
          ? `/post-images/post/${resolvedParams.id}`
          : `/question-images/question/${resolvedParams.id}`;

        const imgRes = await fetch(`${process.env.BACKEND_API_URL || "http://localhost:5000"}${endpoint}`, { cache: "no-store" });
        if (imgRes.ok) {
          const images = await imgRes.json();
          if (images && images.length > 0) {
            post.postImages = images;
            // sortOrder === 0 の画像をサムネイル（hero画像）として設定
            const thumbImg = images.find((img: any) => img.sortOrder === 0);
            if (thumbImg) {
              post.imageUrl = `${process.env.BACKEND_API_URL || "http://localhost:5000"}${thumbImg.imageUrl}`;
            }
          }
        }
      } catch (err) {
        console.error("画像取得エラー:", err);
      }

      // プロフィール情報を取得して、ユーザー名とアイコンを post オブジェクトにマージする
      try {
        const postUserId = post.user_id || post.userId?.id || post.userid?.id;
        if (postUserId) {
          const profileRes = await fetch(`${process.env.BACKEND_API_URL || "http://localhost:5000"}/profiles`, { cache: "no-store" });
          if (profileRes.ok) {
            const profiles = await profileRes.json();
            const foundProfile = profiles.find((p: any) => p.user && p.user.id === postUserId);
            if (foundProfile) {
              post.user = foundProfile.user; // { id, username, email }
              post.user.profile = foundProfile.profile; // { avatarUrl, etc. }
            }
          }
        }
      } catch (err) {
        console.error("プロフィール取得エラー:", err);
      }
    }
  }

  // バックエンド取得失敗またはローカルモードの場合、ダミーデータを使用
  if (!post) {
    post = dummyPosts.find((p) => p.id === resolvedParams.id);
    if (post) {
      console.info(`[Post Detail] ローカルダミーデータを使用 (ID: ${resolvedParams.id})`);
    }
  }

  if (!post) {
    notFound();
  }

  // バックエンド画像とダミー画像の両方をサポート
  const getImageUrl = (order: number) => {
    if (post.postImages) {
      const backendImg = post.postImages.find((img: any) => img.sortOrder === order);
      if (backendImg) {
        return `${process.env.BACKEND_API_URL || "http://localhost:5000"}${backendImg.imageUrl}`;
      }
    }
    const dummyImg = post.images?.find((img: any) => img.order === order);
    if (dummyImg) return dummyImg.url;
    return null;
  };

  const thumbnailUrl = getImageUrl(0);
  const headerUrl = getImageUrl(1);
  const topUrl = getImageUrl(2);
  const bottomUrl = getImageUrl(3);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="px-4 max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/list" className="text-gray-900 bg-white/80 backdrop-blur hover:bg-gray-200 inline-flex items-center justify-center w-10 h-10 rounded-full transition shadow-sm border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>

        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-20">
          {/* ヒーロー画像（ヘッダー画像またはサムネイル画像、なければデフォルト画像） */}
          <figure className="w-full aspect-video bg-gray-100 relative m-0">
            <img
              src={headerUrl || thumbnailUrl || (post.itemType === 'creation' ? '/default-creation.jpg' : '/default-question.jpg')}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-4 py-1.5 text-sm font-bold rounded-full shadow-md ${post.itemType === 'creation' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                {post.itemType === 'creation' ? '制作物' : '質問'}
              </span>
            </div>
          </figure>

          <div className="p-8 md:p-12 pt-8">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                {post.title}
              </h1>

              {/* 投稿者情報 */}
              <div className="flex items-center justify-between mb-6">
                {(() => {
                  const postUserIdStr = post.userId?.id ?? post.userId ?? post.userid?.id ?? post.userid ?? post.user_id?.id ?? post.user_id;
                  let postUsername = post.user?.username ?? post.userId?.username ?? post.userid?.username ?? post.user_id?.username ?? post.username ?? "名無しユーザー";
                  
                  // プロフィールの情報（avatarUrlとavatar_urlの両方を確認）
                  const pProfile = post.user?.profile ?? post.userId?.profile ?? post.user_id?.profile;
                  let postAvatar = pProfile?.avatarUrl ?? (pProfile as any)?.avatar_url ?? post.avatarUrl ?? post.avatar_url ?? null;
                  
                  if (postAvatar && !postAvatar.startsWith('http')) {
                    postAvatar = `${process.env.BACKEND_API_URL || "http://localhost:5000"}${postAvatar}`;
                  }

                  return (
                    <div className="flex items-center justify-between w-full">
                      <Link
                        href={`/profile?userId=${postUserIdStr || ''}`}
                        className="flex items-center group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 font-bold text-sm border border-blue-100 overflow-hidden shadow-sm group-hover:shadow transition-shadow">
                          {postAvatar ? (
                            <img
                              src={postAvatar}
                              alt={postUsername}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            postUsername.charAt(0)
                          )}
                        </div>

                        <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                          {postUsername}
                        </span>
                      </Link>

                      {postUserIdStr && (
                        <FollowButton targetUserId={String(postUserIdStr)} />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* メタデータ */}
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <div className="flex items-center">
                  {(post.createdAt || post.created_at) && (
                    <div className="flex items-center mr-4">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <time dateTime={post.createdAt || post.created_at}>
                        {formatDate(post.createdAt || post.created_at)}
                      </time>
                    </div>
                  )}
                  <PostEditButton post={post} />
                </div>

                {/* 評価（スコア）ボタン：制作物の場合のみ表示 */}
                {post.itemType === 'creation' && (
                  <ScoreButton postId={post.id} initialScore={post.score} />
                )}
              </div>
            </header>

            {/* 本文上部画像 */}
            {topUrl && (
              <figure className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <img src={topUrl} alt="本文上部画像" className="w-full h-auto object-contain max-h-[500px]" />
              </figure>
            )}

            {/* 本文 */}
            <div className="prose prose-lg max-w-none text-gray-700 leading-loose mb-12 whitespace-pre-wrap">
              {post.content}
            </div>

            {/* 本文下部画像 */}
            {bottomUrl && (
              <figure className="mb-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <img src={bottomUrl} alt="本文下部画像" className="w-full h-auto object-contain max-h-[500px]" />
              </figure>
            )}

            {/* 作品URL */}
            {post.work_url && (
              <div className="mb-8">
                <a
                  href={post.work_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-sm break-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m5.656-5.656a4 4 0 015.656 5.656l-1.5 1.5"
                    />
                  </svg>

                  <span className="truncate">
                    作品を見る
                  </span>
                </a>

                <p className="text-sm text-gray-500 mt-2 break-all">
                  {post.work_url}
                </p>
              </div>
            )}

            <hr className="border-gray-100 mb-10" />

            {/* コメント・回答エリア */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                {post.itemType === 'creation' ? 'コメント' : '回答'}
              </h2>
              <AnswersSection itemType={post.itemType} postId={post.id} />
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
