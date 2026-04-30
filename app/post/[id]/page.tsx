import { dummyPosts } from "@/app/data/dummyPosts";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentSection from "@/app/components/CommentSection";
import { isUsingBackend } from "@/lib/api";

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
      const response = await fetch(
        `${process.env.BACKEND_API_URL || "http://localhost:5000"}/posts/${resolvedParams.id}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        post = data;
        console.info(`[Post Detail] バックエンドから投稿 ID ${resolvedParams.id} を取得`);
      }
    } catch (error) {
      console.error(`[Post Detail] バックエンド取得エラー (ID: ${resolvedParams.id}):`, error);
      // フォールバック: ダミーデータ
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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="px-4 max-w-3xl mx-auto">
        <Link href="/itiran" className="inline-flex items-center text-blue-500 hover:text-blue-600 transition-colors mb-8 font-medium">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          一覧へ戻る
        </Link>
        
        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-20">
          {/* 画像がある場合はヒーロー画像として配置 */}
          {post.imageUrl ? (
            <figure className="w-full aspect-video bg-gray-100 relative m-0">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <span className={`px-4 py-1.5 text-sm font-bold rounded-full shadow-md ${post.type === 'creation' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                  {post.type === 'creation' ? '制作物' : '質問'}
                </span>
              </div>
            </figure>
          ) : (
            /* 画像がない場合はタグだけを表示 */
            <div className="p-8 md:p-12 pb-0">
              <span className={`inline-block px-4 py-1.5 text-sm font-bold rounded-full ${post.type === 'creation' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                {post.type === 'creation' ? '制作物' : '質問'}
              </span>
            </div>
          )}

          <div className="p-8 md:p-12 pt-8">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                {post.title}
              </h1>
              
              {/* メタデータ */}
              <div className="flex items-center text-gray-500 text-sm">
                {post.createdAt && (
                  <div className="flex items-center mr-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <time dateTime={post.createdAt}>
                      {new Date(post.createdAt).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                )}
              </div>
            </header>
            
            {/* 本文 */}
            <div className="prose prose-lg max-w-none text-gray-700 leading-loose mb-12 whitespace-pre-wrap">
              {post.content}
            </div>

            <hr className="border-gray-100 mb-10" />

            {/* コメント・回答エリア */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                {post.type === 'creation' ? 'コメント' : '回答'}
              </h2>
              <CommentSection postType={post.type} />
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
