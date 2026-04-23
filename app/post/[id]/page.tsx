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
    <div className="p-4 max-w-2xl mx-auto mt-6">
      <Link href="/itiran" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; 一覧へ戻る
      </Link>
      
      <div className="border rounded shadow p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2 py-1 text-sm font-bold rounded ${post.type === 'creation' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
            {post.type === 'creation' ? '制作物' : '質問'}
          </span>
          <h1 className="text-2xl font-bold">{post.title}</h1>
        </div>
        
        {/* 画像枠 */}
        <div className="w-full h-64 bg-gray-200 mb-6 flex items-center justify-center text-gray-500 rounded overflow-hidden">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            "画像なし"
          )}
        </div>
        
        {/* 本文 */}
        <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {post.content}
        </p>

        {/* コメント・回答エリア */}
        <CommentSection postType={post.type} />
      </div>
    </div>
  );
}
