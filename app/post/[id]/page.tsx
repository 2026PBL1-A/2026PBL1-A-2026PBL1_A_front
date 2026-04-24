import { dummyPosts } from "@/app/data/dummyPosts";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentSection from "@/app/components/CommentSection";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const post = dummyPosts.find((p) => p.id === resolvedParams.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-20">
      <div className="px-4 max-w-2xl mx-auto">
        <Link href="/itiran" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-500 mb-4 transition-colors">
          <span className="mr-1">&larr;</span> 一覧へ戻る
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
          {/* ヘッダー部分 */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${post.type === 'creation' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                {post.type === 'creation' ? '制作物' : '質問'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug">{post.title}</h1>
          </div>
          
          {/* 画像枠 */}
          <div className="w-full aspect-video bg-gray-100 mb-5 flex items-center justify-center text-gray-400 rounded-xl overflow-hidden border border-gray-50">
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">No Image</span>
            )}
          </div>
          
          {/* 本文 */}
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-[15px] mb-8">
            {post.content}
          </div>

          {/* 区切り線 */}
          <hr className="border-gray-100 mb-6" />

          {/* コメント・回答エリア */}
          <CommentSection postType={post.type} />
        </div>
      </div>
    </div>
  );
}
